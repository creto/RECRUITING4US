import { CODING_BANK } from "@/domain/coding-bank";
import { orderedOptions } from "@/domain/candidate-view";
import { DEFAULT_TEXT_RUBRIC } from "@/domain/rules";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { allow, audit, db, json, nid, requireActor, sha256 } from "./db.server";
import { rememberEvent } from "./workflows.server";

function bankId(companyId: string, name: string) {
  return sha256(`${companyId}:coding-bank:${name}`).slice(0, 24);
}

export function flag(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

/** Idempotent. Publishes the 500-problem coding bank and a pooled write-code assessment. */
export async function ensureCodingBank(companyId: string) {
  const sql = await db();
  for (const item of CODING_BANK) {
    const logical = `bank:${item.key}`;
    await sql`
      insert into questions (id, company_id, logical_key, type, tags)
      values (${bankId(companyId, `q:${item.key}`)}, ${companyId}, ${logical}, 'code', ${`coding-bank:${item.difficulty}`})
      on conflict (company_id, logical_key) do nothing
    `;
    const found = await sql<{ id: string }>`
      select id from questions where company_id = ${companyId} and logical_key = ${logical}
    `;
    const questionId = found[0]?.id;
    if (!questionId) continue;
    const points = item.difficulty === "hard" ? 3 : item.difficulty === "medium" ? 2 : 1;
    await sql`
      insert into question_versions (
        id, company_id, question_id, version_number, prompt, payload, key_payload, rubric, points
      ) values (
        ${bankId(companyId, `v:${item.key}`)}, ${companyId}, ${questionId}, 1, ${item.prompt},
        ${json({ mode: "code", languages: ["typescript"], difficulty: item.difficulty, title: item.title, judged: false })}::jsonb,
        '{}'::jsonb,
        ${json(DEFAULT_TEXT_RUBRIC)}::jsonb,
        ${points}
      )
      on conflict (company_id, question_id, version_number) do nothing
    `;
  }
  await sql`
    update question_versions v
    set payload = jsonb_set(v.payload, '{judged}', 'false'::jsonb)
    from questions q
    where q.id = v.question_id and q.company_id = v.company_id
      and q.company_id = ${companyId}
      and q.logical_key like 'bank:%'
      and coalesce(v.payload->>'judged', '') <> 'false'
  `;
  await ensureCodingExam(companyId);
}

const CODING_EXAM_NAME = "Assessment · Coding problems";
const CODING_EXAM_DESCRIPTION =
  "Five hundred original write-code problems. A timed paper draws two easy, two medium, and one hard problem. Answers are stored for a person to grade. These prompts were written for this bank.";
const CODING_EXAM_INSTRUCTIONS =
  "Ninety minutes. Two easy problems, two medium problems, and one hard problem are drawn from the bank and stay fixed for this attempt. They are not auto-judged. A person scores them.";

async function ensureCodingExam(companyId: string) {
  const sql = await db();
  const assessmentId = bankId(companyId, "assessment");
  const versionId = bankId(companyId, "version");
  const sections = [
    { key: "easy", title: "Easy", pick: 2, points: 1, weight: 2000 },
    { key: "medium", title: "Medium", pick: 2, points: 2, weight: 4000 },
    { key: "hard", title: "Hard", pick: 1, points: 3, weight: 4000 },
  ] as const;
  await sql`
    insert into assessments (id, company_id, name, description, auto_send)
    values (${assessmentId}, ${companyId}, ${CODING_EXAM_NAME}, ${CODING_EXAM_DESCRIPTION}, false)
    on conflict (id) do nothing
  `;
  await sql`
    update assessments set name = ${CODING_EXAM_NAME}, description = ${CODING_EXAM_DESCRIPTION}
    where id = ${assessmentId} and company_id = ${companyId}
  `;
  await sql`
    insert into assessment_versions (
      id, company_id, assessment_id, version_number, status, duration_seconds,
      instructions, score_release, published_at, content_hash, proctored
    ) values (
      ${versionId}, ${companyId}, ${assessmentId}, 1, 'PUBLISHED', ${90 * 60},
      ${CODING_EXAM_INSTRUCTIONS}, 'AGGREGATE', now(), 'coding-500', false
    )
    on conflict (id) do nothing
  `;
  await sql`
    update assessment_versions
    set instructions = ${CODING_EXAM_INSTRUCTIONS}, duration_seconds = ${90 * 60}, content_hash = 'coding-500'
    where id = ${versionId} and company_id = ${companyId}
  `;
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index]!;
    const sectionId = bankId(companyId, `section:${section.key}`);
    await sql`
      insert into assessment_sections (
        id, company_id, version_id, title, position, weight_basis_points, pool_pick, instructions
      ) values (
        ${sectionId}, ${companyId}, ${versionId}, ${section.title}, ${index}, ${section.weight}, ${section.pick},
        ${"Items in this section are drawn once and stay fixed for the attempt."}
      )
      on conflict (id) do nothing
    `;
    await sql`
      update assessment_sections
      set title = ${section.title}, pool_pick = ${section.pick}, weight_basis_points = ${section.weight}, position = ${index}
      where id = ${sectionId} and company_id = ${companyId}
    `;
    const questions = await sql<{ id: string; logical_key: string }>`
      select v.id, q.logical_key
      from questions q
      join question_versions v on v.question_id = q.id and v.company_id = q.company_id and v.version_number = 1
      where q.company_id = ${companyId} and q.logical_key like 'bank:%'
        and v.payload->>'difficulty' = ${section.key}
      order by q.logical_key
    `;
    const have = await sql<{ n: number }>`
      select count(*) as n from assessment_items
      where company_id = ${companyId} and section_id = ${sectionId}
    `;
    if (Number(have[0]?.n ?? 0) !== questions.length) {
      await sql`
        delete from assessment_items
        where company_id = ${companyId} and section_id = ${sectionId}
      `;
    }
    for (let position = 0; position < questions.length; position += 1) {
      const question = questions[position]!;
      await sql`
        insert into assessment_items (id, company_id, section_id, question_version_id, points, position)
        values (
          ${bankId(companyId, `item:${section.key}:${question.logical_key}`)},
          ${companyId}, ${sectionId}, ${question.id}, ${section.points}, ${position}
        )
        on conflict (id) do nothing
      `;
    }
  }
}

type PreviewQuestion = {
  id: string;
  type: string;
  prompt: string;
  points: number;
  difficulty: string | null;
  options: { id: string; label: string }[];
};

export async function previewAssessment(userId: string, input: { slug: string; assessmentId: string }) {
  const actor = await requireActor(userId, input.slug);
  await ensureCodingBank(actor.companyId);
  const { ensureReadCodeBank } = await import("./read-code.server");
  await ensureReadCodeBank(actor.companyId);
  const { ensurePersonalityAssessment } = await import("./personality.server");
  await ensurePersonalityAssessment(actor.companyId);
  const { ensureMentalMath } = await import("./mental.server");
  await ensureMentalMath(actor.companyId);
  const sql = await db();
  const rows = await sql<{
    name: string;
    description: string;
    auto_send: unknown;
    version_id: string;
    status: string;
    duration_seconds: number;
    proctored: unknown;
    instructions: string;
  }>`
    select s.name, s.description, s.auto_send, v.id as version_id, v.status,
      v.duration_seconds, v.proctored, v.instructions
    from assessments s
    join assessment_versions v on v.assessment_id = s.id and v.company_id = s.company_id
    where s.id = ${input.assessmentId} and s.company_id = ${actor.companyId}
    order by v.version_number desc
    limit 1
  `;
  const exam = rows[0];
  if (!exam) throw new Error("Not found.");
  const sections = await sql<{ id: string; title: string; pool_pick: number | null; position: number }>`
    select id, title, pool_pick, position from assessment_sections
    where version_id = ${exam.version_id} and company_id = ${actor.companyId}
    order by position
  `;
  const built: { title: string; poolPick: number | null; questions: PreviewQuestion[] }[] = [];
  for (const section of sections) {
    const items = await sql<{
      id: string;
      type: string;
      prompt: string;
      points: number;
      payload: unknown;
    }>`
      select i.id, q.type, v.prompt, i.points, v.payload
      from assessment_items i
      join question_versions v on v.id = i.question_version_id and v.company_id = i.company_id
      join questions q on q.id = v.question_id and q.company_id = v.company_id
      where i.section_id = ${section.id} and i.company_id = ${actor.companyId}
      order by i.position
    `;
    built.push({
      title: section.title,
      poolPick: section.pool_pick,
      questions: items.map((item) => {
        const record = item.payload && typeof item.payload === "object" ? item.payload as { difficulty?: unknown } : {};
        return {
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          points: item.points,
          difficulty: typeof record.difficulty === "string" ? record.difficulty : null,
          options: orderedOptions(item.payload, null),
        };
      }),
    });
  }
  return {
    id: input.assessmentId,
    name: exam.name,
    description: exam.description,
    status: exam.status,
    durationSeconds: Number(exam.duration_seconds),
    proctored: flag(exam.proctored),
    autoSend: flag(exam.auto_send),
    instructions: exam.instructions,
    sections: built,
  };
}

export async function updateAssessmentDelivery(
  userId: string,
  input: { slug: string; assessmentId: string; autoSend?: boolean; proctored?: boolean },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.author");
  const sql = await db();
  const owned = await sql<{ id: string }>`
    select id from assessments where id = ${input.assessmentId} and company_id = ${actor.companyId}
  `;
  if (!owned[0]) throw new Error("Not found.");
  if (typeof input.autoSend === "boolean") {
    await sql`
      update assessments set auto_send = ${input.autoSend}
      where id = ${input.assessmentId} and company_id = ${actor.companyId}
    `;
  }
  if (typeof input.proctored === "boolean") {
    await sql`
      update assessment_versions set proctored = ${input.proctored}
      where assessment_id = ${input.assessmentId} and company_id = ${actor.companyId}
        and version_number = (
          select max(version_number) from assessment_versions
          where assessment_id = ${input.assessmentId} and company_id = ${actor.companyId}
        )
    `;
  }
  await audit(
    { companyId: actor.companyId, userId },
    "assessment.delivery",
    "assessment",
    input.assessmentId,
    "Updated automatic send or proctoring.",
  );
  return { ok: true };
}

export async function sendAssessmentToFits(userId: string, input: { slug: string; assessmentId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.assign");
  const sql = await db();
  const versions = await sql<{ id: string; duration_seconds: number; name: string }>`
    select v.id, v.duration_seconds, s.name
    from assessment_versions v
    join assessments s on s.id = v.assessment_id and s.company_id = v.company_id
    where v.assessment_id = ${input.assessmentId} and v.company_id = ${actor.companyId} and v.status = 'PUBLISHED'
    order by v.version_number desc
    limit 1
  `;
  const version = versions[0];
  if (!version) throw new Error("Publish the assessment before sending it.");
  const fits = await sql<{ application_id: string; email: string }>`
    select a.id as application_id, c.email
    from cv_screens sc
    join applications a on a.id = sc.application_id and a.company_id = sc.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    where sc.company_id = ${actor.companyId}
      and sc.fit = 'GOOD'
      and a.lifecycle = 'ACTIVE'
  `;
  let sent = 0;
  const startBy = new Date(Date.now() + 14 * 86400000).toISOString();
  for (const fit of fits) {
    const existing = await sql<{ id: string }>`
      select id from assignments
      where company_id = ${actor.companyId} and application_id = ${fit.application_id}
        and assessment_version_id = ${version.id}
      limit 1
    `;
    if (existing[0]) continue;
    const id = nid();
    await sql`
      insert into assignments (
        id, company_id, application_id, assessment_version_id, status, start_by,
        duration_seconds, multiplier_basis_points, extra_seconds
      ) values (
        ${id}, ${actor.companyId}, ${fit.application_id}, ${version.id}, 'INVITED', ${startBy},
        ${version.duration_seconds}, 10000, 0
      )
    `;
    await sql`
      insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
      values (
        ${nid()}, ${actor.companyId}, ${fit.email},
        ${"Assessment: " + version.name},
        ${"A recruiter sent this assessment because the CV was a fit. It is in the candidate portal. Opening this message does not start the timer. This message was captured inside RECRUIT4US and was not delivered by an outside mail server."},
        'CAPTURED', ${id}
      )
    `;
    await rememberEvent(actor.companyId, "ASSESSMENT_ASSIGNED", id, {
      applicationId: fit.application_id,
      assignmentId: id,
      source: "good_cv",
    });
    sent += 1;
  }
  await audit(
    { companyId: actor.companyId, userId },
    "assessment.assign",
    "assessment",
    input.assessmentId,
    `Sent to ${sent} applications whose CV was a fit.`,
  );
  return { sent };
}
