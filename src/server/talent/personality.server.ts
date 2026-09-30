import { LIKERT_OPTIONS, PERSONALITY_ITEMS } from "@/domain/personality";
import { enterTenant } from "@/lib/tenant";
import { db, json, sha256 } from "./db.server";

function personalityId(companyId: string, name: string) {
  return sha256(`${companyId}:personality:${name}`).slice(0, 24);
}

const INSTRUCTIONS =
  "Twenty-five statements. Choose how much you agree. There is no correct answer. The result is a preference summary on five scales, not a percentage and not a hiring decision. This questionnaire is original. It is not the 16Personalities test and not the Myers-Briggs Type Indicator.";

const NAME = "Assessment 3 · Personality";
const DESCRIPTION =
  "Third assessment. Twenty-five agree-or-disagree statements. Five scales — mind, information, decisions, structure, and identity — produce a type such as ENFP-A. There is no correct answer and no percentage. It is not sent automatically with a CV. The statements are original. This is not the 16Personalities test and not the Myers-Briggs Type Indicator.";

/** Idempotent. Publishes the 25-statement personality questionnaire. */
export async function ensurePersonalityAssessment(companyId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  const versionId = personalityId(companyId, "version");
  const assessmentId = personalityId(companyId, "assessment");
  const existing = await sql<{ n: number }>`
    select count(*) as n from questions
    where company_id = ${companyId} and logical_key like 'style:%'
  `;
  const exam = await sql<{ id: string }>`
    select id from assessment_versions where id = ${versionId} and company_id = ${companyId}
  `;
  if (Number(existing[0]?.n ?? 0) >= PERSONALITY_ITEMS.length && exam[0]) {
    await sql`
      update assessments set name = ${NAME}, description = ${DESCRIPTION}
      where id = ${assessmentId} and company_id = ${companyId}
    `;
    await sql`
      update assessment_versions set instructions = ${INSTRUCTIONS}
      where id = ${versionId} and company_id = ${companyId}
    `;
    return;
  }

  for (const item of PERSONALITY_ITEMS) {
    const questionId = personalityId(companyId, `q:${item.key}`);
    const version = personalityId(companyId, `v:${item.key}`);
    await sql`
      insert into questions (id, company_id, logical_key, type, tags)
      values (${questionId}, ${companyId}, ${`style:${item.key}`}, 'likert', 'work-style')
      on conflict (company_id, logical_key) do nothing
    `;
    await sql`
      insert into question_versions (
        id, company_id, question_id, version_number, prompt, payload, key_payload, points
      ) values (
        ${version}, ${companyId}, ${questionId}, 1, ${item.prompt},
        ${json({ kind: "personality", options: LIKERT_OPTIONS.map((option) => ({ id: option.id, label: option.label })) })}::jsonb,
        ${json({ dimension: item.dimension, toward: item.toward })}::jsonb,
        1
      )
      on conflict (company_id, question_id, version_number) do nothing
    `;
  }

  const sectionId = personalityId(companyId, "section");
  await sql`
    insert into assessments (id, company_id, name, description, auto_send)
    values (
      ${assessmentId}, ${companyId}, ${NAME}, ${DESCRIPTION}, false
    )
    on conflict (id) do nothing
  `;
  await sql`
    insert into assessment_versions (
      id, company_id, assessment_id, version_number, status, duration_seconds,
      instructions, score_release, published_at, content_hash, proctored
    ) values (
      ${versionId}, ${companyId}, ${assessmentId}, 1, 'PUBLISHED', ${20 * 60},
      ${INSTRUCTIONS}, 'AGGREGATE', now(), 'work-style-25', false
    )
    on conflict (id) do nothing
  `;
  await sql`
    insert into assessment_sections (
      id, company_id, version_id, title, position, weight_basis_points, instructions
    ) values (
      ${sectionId}, ${companyId}, ${versionId}, 'Preferences', 0, 10000,
      ${"Agree or disagree. A middle answer is a tie on that statement, not a wrong answer."}
    )
    on conflict (id) do nothing
  `;
  for (let index = 0; index < PERSONALITY_ITEMS.length; index += 1) {
    const item = PERSONALITY_ITEMS[index]!;
    await sql`
      insert into assessment_items (id, company_id, section_id, question_version_id, position, points)
      values (
        ${personalityId(companyId, `item:${item.key}`)}, ${companyId}, ${sectionId},
        ${personalityId(companyId, `v:${item.key}`)}, ${index}, 1
      )
      on conflict (id) do nothing
    `;
  }
}
