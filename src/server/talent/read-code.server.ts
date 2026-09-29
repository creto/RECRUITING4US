import { READ_CODE_BANK } from "@/domain/read-code-bank";
import { db, json, sha256 } from "./db.server";

function readCodeId(companyId: string, name: string) {
  return sha256(`${companyId}:read-code:${name}`).slice(0, 24);
}

const NAME = "Assessment · Code reading";
const DESCRIPTION =
  "Five hundred original read-the-code multiple-choice items. A timed exam can draw a pool from this bank. Answers are graded automatically against the stored key. These items are not copied from a proprietary bank.";
const INSTRUCTIONS =
  "Read each JavaScript snippet carefully. Choose the single best answer. The server clock is authoritative. Changing the timer in the browser does not add time.";
const DURATION_SECONDS = 45 * 60;
const POOL_PICK = 20;

/** Idempotent. Publishes the read-the-code MCQ bank and a pool assessment. */
export async function ensureReadCodeBank(companyId: string) {
  const sql = await db();
  for (const item of READ_CODE_BANK) {
    const logical = `readcode:${item.key}`;
    const questionId = readCodeId(companyId, `q:${item.key}`);
    const versionId = readCodeId(companyId, `v:${item.key}`);
    const points = item.difficulty === "hard" ? 2 : 1;
    await sql`
      insert into questions (id, company_id, logical_key, type, tags)
      values (
        ${questionId}, ${companyId}, ${logical}, 'single',
        ${`read-code:${item.difficulty}`}
      )
      on conflict (company_id, logical_key) do nothing
    `;
    await sql`
      insert into question_versions (
        id, company_id, question_id, version_number, prompt, payload, key_payload, points
      ) values (
        ${versionId}, ${companyId}, ${questionId}, 1, ${item.prompt},
        ${json({
          options: item.options,
          difficulty: item.difficulty,
          title: item.title,
          tags: item.tags,
          mode: "read-code",
        })}::jsonb,
        ${json({ correct: [item.correct] })}::jsonb,
        ${points}
      )
      on conflict (company_id, question_id, version_number) do nothing
    `;
  }

  const assessmentId = readCodeId(companyId, "assessment");
  const versionId = readCodeId(companyId, "version");
  const sectionId = readCodeId(companyId, "section");
  const existing = await sql<{ n: number }>`
    select count(*) as n from questions
    where company_id = ${companyId} and logical_key like 'readcode:%'
  `;
  const exam = await sql<{ id: string }>`
    select id from assessment_versions where id = ${versionId} and company_id = ${companyId}
  `;
  if (Number(existing[0]?.n ?? 0) >= READ_CODE_BANK.length && exam[0]) {
    await sql`
      update assessments set name = ${NAME}, description = ${DESCRIPTION}
      where id = ${assessmentId} and company_id = ${companyId}
    `;
    await sql`
      update assessment_versions
      set instructions = ${INSTRUCTIONS}, duration_seconds = ${DURATION_SECONDS}
      where id = ${versionId} and company_id = ${companyId}
    `;
    return { questions: Number(existing[0]?.n ?? 0), assessmentId };
  }

  await sql`
    insert into assessments (id, company_id, name, description, auto_send)
    values (${assessmentId}, ${companyId}, ${NAME}, ${DESCRIPTION}, false)
    on conflict (id) do nothing
  `;
  await sql`
    insert into assessment_versions (
      id, company_id, assessment_id, version_number, status, duration_seconds,
      instructions, score_release, published_at, content_hash, proctored
    ) values (
      ${versionId}, ${companyId}, ${assessmentId}, 1, 'PUBLISHED', ${DURATION_SECONDS},
      ${INSTRUCTIONS}, 'AGGREGATE', now(), 'read-code-500', false
    )
    on conflict (id) do nothing
  `;
  await sql`
    insert into assessment_sections (
      id, company_id, version_id, title, position, weight_basis_points, pool_pick, instructions
    ) values (
      ${sectionId}, ${companyId}, ${versionId}, 'Read the code', 0, 10000, ${POOL_PICK},
      ${"Twenty items are drawn from the bank and stay fixed for this attempt."}
    )
    on conflict (id) do nothing
  `;

  for (let index = 0; index < READ_CODE_BANK.length; index += 1) {
    const item = READ_CODE_BANK[index]!;
    const points = item.difficulty === "hard" ? 2 : 1;
    await sql`
      insert into assessment_items (id, company_id, section_id, question_version_id, position, points)
      values (
        ${readCodeId(companyId, `item:${item.key}`)}, ${companyId}, ${sectionId},
        ${readCodeId(companyId, `v:${item.key}`)}, ${index}, ${points}
      )
      on conflict (id) do nothing
    `;
  }

  return { questions: READ_CODE_BANK.length, assessmentId };
}
