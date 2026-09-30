import { MENTAL_MATH, MENTAL_MATH_SECONDS } from "@/domain/mental-math";
import { enterTenant } from "@/lib/tenant";
import { db, json, sha256 } from "./db.server";

function mentalId(companyId: string, name: string) {
  return sha256(`${companyId}:mental:${name}`).slice(0, 24);
}

const NAME = "Assessment 4 · Mental math";
const DESCRIPTION =
  "Fourth assessment. Fifteen minutes. Twenty original arithmetic items, including three-digit products. The answer is an exact integer. This is not an Optiver paper. It is not sent automatically with a CV.";
const INSTRUCTIONS =
  "Fifteen minutes on the server clock. Enter digits only. A calculator is not part of the assessment. The answer key is not in this page, and changing the timer in the browser does not add time.";

/** Idempotent. Publishes the 15-minute arithmetic paper. */
export async function ensureMentalMath(companyId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  const versionId = mentalId(companyId, "version");
  const assessmentId = mentalId(companyId, "assessment");
  const existing = await sql<{ n: number }>`
    select count(*) as n from questions
    where company_id = ${companyId} and logical_key like 'mental:%'
  `;
  const exam = await sql<{ id: string }>`
    select id from assessment_versions where id = ${versionId} and company_id = ${companyId}
  `;
  if (Number(existing[0]?.n ?? 0) >= MENTAL_MATH.length && exam[0]) {
    await sql`update assessments set name = ${NAME}, description = ${DESCRIPTION} where id = ${assessmentId} and company_id = ${companyId}`;
    await sql`update assessment_versions set instructions = ${INSTRUCTIONS}, duration_seconds = ${MENTAL_MATH_SECONDS} where id = ${versionId} and company_id = ${companyId}`;
    return;
  }
  for (const item of MENTAL_MATH) {
    const questionId = mentalId(companyId, `q:${item.key}`);
    const version = mentalId(companyId, `v:${item.key}`);
    await sql`
      insert into questions (id, company_id, logical_key, type, tags)
      values (${questionId}, ${companyId}, ${`mental:${item.key}`}, 'numeric', 'mental-math')
      on conflict (company_id, logical_key) do nothing
    `;
    await sql`
      insert into question_versions (
        id, company_id, question_id, version_number, prompt, payload, key_payload, points
      ) values (
        ${version}, ${companyId}, ${questionId}, 1, ${item.prompt},
        ${json({ absTolerance: "0", relTolerance: "0" })}::jsonb,
        ${json({ expected: item.expected })}::jsonb,
        1
      )
      on conflict (company_id, question_id, version_number) do nothing
    `;
  }
  const sectionId = mentalId(companyId, "section");
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
      ${versionId}, ${companyId}, ${assessmentId}, 1, 'PUBLISHED', ${MENTAL_MATH_SECONDS},
      ${INSTRUCTIONS}, 'AGGREGATE', now(), 'mental-math-15', false
    )
    on conflict (id) do nothing
  `;
  await sql`
    insert into assessment_sections (id, company_id, version_id, title, position, weight_basis_points, instructions)
    values (
      ${sectionId}, ${companyId}, ${versionId}, 'Arithmetic', 0, 10000,
      ${"Exact digits. A miss scores 0. There is no partial credit."}
    )
    on conflict (id) do nothing
  `;
  for (let index = 0; index < MENTAL_MATH.length; index += 1) {
    const item = MENTAL_MATH[index]!;
    await sql`
      insert into assessment_items (id, company_id, section_id, question_version_id, position, points)
      values (
        ${mentalId(companyId, `item:${item.key}`)}, ${companyId}, ${sectionId},
        ${mentalId(companyId, `v:${item.key}`)}, ${index}, 1
      )
      on conflict (id) do nothing
    `;
  }
}
