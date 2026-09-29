/**
 * Idempotent production seed for the write-code bank.
 * Usage: DATABASE_URL=... node scripts/seed-coding-bank.mjs [companySlug...]
 * Defaults to tiglobal when no slugs are passed.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const targets = process.argv.slice(2);
const slugs = targets.length ? targets : ["tiglobal"];

const dir = await mkdtemp(join(tmpdir(), "coding-bank-"));
const outfile = join(dir, "bank.mjs");
const build = spawnSync(
  "npx",
  ["--yes", "esbuild", "src/domain/coding-bank.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${outfile}`],
  { stdio: "inherit", cwd: process.cwd() },
);
if (build.status !== 0) process.exit(build.status ?? 1);
const { CODING_BANK } = await import(pathToFileURL(outfile).href);

function sha24(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}
function bankId(companyId, name) {
  return sha24(`${companyId}:coding-bank:${name}`);
}
function ladderId(companyId, name) {
  return sha24(`${companyId}:ladder:${name}`);
}
function pointsFor(difficulty) {
  return difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
}

const NAME = "Assessment · Coding problems";
const DESCRIPTION =
  "Five hundred original write-code problems. A timed paper draws two easy, two medium, and one hard problem. Answers are stored for a person to grade. These prompts were written for this bank.";
const INSTRUCTIONS =
  "Ninety minutes. Two easy problems, two medium problems, and one hard problem are drawn from the bank and stay fixed for this attempt. They are not auto-judged. A person scores them.";
const SECTIONS = [
  { key: "easy", title: "Easy", pick: 2, points: 1, weight: 2000 },
  { key: "medium", title: "Medium", pick: 2, points: 2, weight: 4000 },
  { key: "hard", title: "Hard", pick: 1, points: 3, weight: 4000 },
];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

async function syncPool(companyId, sectionId, difficulty, itemId, points) {
  const questions = await client.query(
    `select v.id, q.logical_key
     from questions q
     join question_versions v on v.question_id = q.id and v.company_id = q.company_id and v.version_number = 1
     where q.company_id = $1 and q.logical_key like 'bank:%' and v.payload->>'difficulty' = $2
     order by q.logical_key`,
    [companyId, difficulty],
  );
  const have = await client.query(
    `select count(*)::int as n from assessment_items where company_id = $1 and section_id = $2`,
    [companyId, sectionId],
  );
  if (have.rows[0].n !== questions.rows.length) {
    await client.query(`delete from assessment_items where company_id = $1 and section_id = $2`, [companyId, sectionId]);
  }
  for (let position = 0; position < questions.rows.length; position += 1) {
    const row = questions.rows[position];
    await client.query(
      `insert into assessment_items (id, company_id, section_id, question_version_id, points, position)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do nothing`,
      [itemId(row.logical_key), companyId, sectionId, row.id, points, position],
    );
  }
  return questions.rows.length;
}

for (const slug of slugs) {
  const companies = await client.query(`select id from companies where slug = $1`, [slug]);
  const company = companies.rows[0];
  if (!company) {
    console.error(`No company for slug ${slug}`);
    continue;
  }
  const companyId = company.id;
  let insertedQ = 0;
  let insertedV = 0;
  for (const item of CODING_BANK) {
    const logical = `bank:${item.key}`;
    const questionId = bankId(companyId, `q:${item.key}`);
    const versionId = bankId(companyId, `v:${item.key}`);
    const points = pointsFor(item.difficulty);
    const q = await client.query(
      `insert into questions (id, company_id, logical_key, type, tags)
       values ($1, $2, $3, 'code', $4)
       on conflict (company_id, logical_key) do nothing
       returning id`,
      [questionId, companyId, logical, `coding-bank:${item.difficulty}`],
    );
    if (q.rowCount) insertedQ += 1;
    const owned = await client.query(
      `select id from questions where company_id = $1 and logical_key = $2`,
      [companyId, logical],
    );
    const realQuestionId = owned.rows[0]?.id;
    if (!realQuestionId) continue;
    const payload = {
      mode: "code",
      languages: ["typescript"],
      difficulty: item.difficulty,
      title: item.title,
      judged: false,
    };
    const v = await client.query(
      `insert into question_versions (
         id, company_id, question_id, version_number, prompt, payload, key_payload, rubric, points
       ) values (
         $1, $2, $3, 1, $4, $5::jsonb, '{}'::jsonb,
         '{"dimensions":[{"id":"substance","label":"Substance","anchors":["Missing","Thin","Adequate","Strong","Exceptional"]},{"id":"clarity","label":"Clarity","anchors":["Unclear","Hard to follow","Understandable","Clear","Precise"]}]}'::jsonb,
         $6
       )
       on conflict (company_id, question_id, version_number) do nothing
       returning id`,
      [versionId, companyId, realQuestionId, item.prompt, JSON.stringify(payload), points],
    );
    if (v.rowCount) insertedV += 1;
  }

  const assessmentId = bankId(companyId, "assessment");
  const versionId = bankId(companyId, "version");
  await client.query(
    `insert into assessments (id, company_id, name, description, auto_send)
     values ($1, $2, $3, $4, false)
     on conflict (id) do nothing`,
    [assessmentId, companyId, NAME, DESCRIPTION],
  );
  await client.query(
    `update assessments set name = $1, description = $2 where id = $3 and company_id = $4`,
    [NAME, DESCRIPTION, assessmentId, companyId],
  );
  await client.query(
    `insert into assessment_versions (
       id, company_id, assessment_id, version_number, status, duration_seconds,
       instructions, score_release, published_at, content_hash, proctored
     ) values ($1, $2, $3, 1, 'PUBLISHED', $4, $5, 'AGGREGATE', now(), 'coding-500', false)
     on conflict (id) do nothing`,
    [versionId, companyId, assessmentId, 90 * 60, INSTRUCTIONS],
  );
  await client.query(
    `update assessment_versions
     set instructions = $1, duration_seconds = $2, content_hash = 'coding-500', status = 'PUBLISHED'
     where id = $3 and company_id = $4`,
    [INSTRUCTIONS, 90 * 60, versionId, companyId],
  );
  const pools = {};
  for (let index = 0; index < SECTIONS.length; index += 1) {
    const section = SECTIONS[index];
    const sectionId = bankId(companyId, `section:${section.key}`);
    await client.query(
      `insert into assessment_sections (
         id, company_id, version_id, title, position, weight_basis_points, pool_pick, instructions
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do nothing`,
      [sectionId, companyId, versionId, section.title, index, section.weight, section.pick, "Items in this section are drawn once and stay fixed for the attempt."],
    );
    await client.query(
      `update assessment_sections
       set title = $1, pool_pick = $2, weight_basis_points = $3, position = $4
       where id = $5 and company_id = $6`,
      [section.title, section.pick, section.weight, index, sectionId, companyId],
    );
    pools[section.key] = await syncPool(
      companyId,
      sectionId,
      section.key,
      (logical) => sha24(`${companyId}:coding-bank:item:${section.key}:${logical}`),
      section.points,
    );
  }

  const ladder = [
    ["coding", [
      { key: "medium", points: 2 },
      { key: "hard", points: 3 },
    ]],
    ["final", [{ key: "hard", points: 3 }]],
  ];
  for (const [paper, sections] of ladder) {
    const paperVersion = ladderId(companyId, `${paper}-version`);
    const exists = await client.query(`select id from assessment_versions where id = $1 and company_id = $2`, [paperVersion, companyId]);
    if (!exists.rows[0]) continue;
    for (const section of sections) {
      const sectionId = ladderId(companyId, `${paper}-sec-${section.key}`);
      await syncPool(companyId, sectionId, section.key, (logical) => sha24(`${companyId}:ladder:${paper}-item-${section.key}-${logical}`), section.points);
    }
  }

  const count = await client.query(
    `select count(*)::int as n from questions where company_id = $1 and logical_key like 'bank:%'`,
    [companyId],
  );
  console.log(JSON.stringify({
    slug,
    assessmentId,
    name: NAME,
    insertedQuestions: insertedQ,
    insertedVersions: insertedV,
    totalBank: count.rows[0].n,
    pools,
  }));
}

await client.end();
await rm(dir, { recursive: true, force: true });
