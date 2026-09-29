/**
 * Idempotent production seed for the read-code MCQ bank.
 * Usage: DATABASE_URL=... node scripts/seed-read-code-bank.mjs [companySlug...]
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

const slugs = process.argv.slice(2);
const targets = slugs.length ? slugs : ["tiglobal"];

const dir = await mkdtemp(join(tmpdir(), "read-code-"));
const outfile = join(dir, "bank.mjs");
const build = spawnSync(
  "npx",
  ["--yes", "esbuild", "src/domain/read-code-bank.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${outfile}`],
  { stdio: "inherit", cwd: process.cwd() },
);
if (build.status !== 0) {
  console.error("Failed to bundle read-code-bank.ts");
  process.exit(build.status ?? 1);
}
const { READ_CODE_BANK } = await import(pathToFileURL(outfile).href);

function sha24(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}
function readCodeId(companyId, name) {
  return sha24(`${companyId}:read-code:${name}`);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const NAME = "Assessment · Code reading";
const DESCRIPTION =
  "Five hundred original read-the-code multiple-choice items. A timed exam can draw a pool from this bank. Answers are graded automatically against the stored key. These items are not copied from a proprietary bank.";
const INSTRUCTIONS =
  "Read each JavaScript snippet carefully. Choose the single best answer. The server clock is authoritative. Changing the timer in the browser does not add time.";
const DURATION_SECONDS = 45 * 60;
const POOL_PICK = 20;

for (const slug of targets) {
  const companies = await client.query(`select id, name, slug from companies where slug = $1`, [slug]);
  const company = companies.rows[0];
  if (!company) {
    console.error(`No company for slug ${slug}`);
    continue;
  }
  const companyId = company.id;
  let insertedQ = 0;
  let insertedV = 0;
  for (const item of READ_CODE_BANK) {
    const logical = `readcode:${item.key}`;
    const questionId = readCodeId(companyId, `q:${item.key}`);
    const versionId = readCodeId(companyId, `v:${item.key}`);
    const points = item.difficulty === "hard" ? 2 : 1;
    const q = await client.query(
      `insert into questions (id, company_id, logical_key, type, tags)
       values ($1, $2, $3, 'single', $4)
       on conflict (company_id, logical_key) do nothing
       returning id`,
      [questionId, companyId, logical, `read-code:${item.difficulty}`],
    );
    if (q.rowCount) insertedQ += 1;
    const payload = {
      options: item.options,
      difficulty: item.difficulty,
      title: item.title,
      tags: item.tags,
      mode: "read-code",
    };
    const key = { correct: [item.correct] };
    const v = await client.query(
      `insert into question_versions (
         id, company_id, question_id, version_number, prompt, payload, key_payload, points
       ) values ($1, $2, $3, 1, $4, $5::jsonb, $6::jsonb, $7)
       on conflict (company_id, question_id, version_number) do nothing
       returning id`,
      [versionId, companyId, questionId, item.prompt, JSON.stringify(payload), JSON.stringify(key), points],
    );
    if (v.rowCount) insertedV += 1;
  }

  const assessmentId = readCodeId(companyId, "assessment");
  const versionId = readCodeId(companyId, "version");
  const sectionId = readCodeId(companyId, "section");
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
     ) values ($1, $2, $3, 1, 'PUBLISHED', $4, $5, 'AGGREGATE', now(), 'read-code-500', false)
     on conflict (id) do nothing`,
    [versionId, companyId, assessmentId, DURATION_SECONDS, INSTRUCTIONS],
  );
  await client.query(
    `insert into assessment_sections (
       id, company_id, version_id, title, position, weight_basis_points, pool_pick, instructions
     ) values ($1, $2, $3, 'Read the code', 0, 10000, $4, $5)
     on conflict (id) do nothing`,
    [sectionId, companyId, versionId, POOL_PICK, "Twenty items are drawn from the bank and stay fixed for this attempt."],
  );

  let insertedItems = 0;
  for (let index = 0; index < READ_CODE_BANK.length; index += 1) {
    const item = READ_CODE_BANK[index];
    const points = item.difficulty === "hard" ? 2 : 1;
    const r = await client.query(
      `insert into assessment_items (id, company_id, section_id, question_version_id, position, points)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do nothing
       returning id`,
      [
        readCodeId(companyId, `item:${item.key}`),
        companyId,
        sectionId,
        readCodeId(companyId, `v:${item.key}`),
        index,
        points,
      ],
    );
    if (r.rowCount) insertedItems += 1;
  }

  const count = await client.query(
    `select count(*)::int as n from questions where company_id = $1 and logical_key like 'readcode:%'`,
    [companyId],
  );
  console.log(
    JSON.stringify({
      slug,
      companyId,
      insertedQuestions: insertedQ,
      insertedVersions: insertedV,
      insertedItems,
      totalReadCode: count.rows[0].n,
      assessmentId,
    }),
  );
}

await client.end();
await rm(dir, { recursive: true, force: true });
