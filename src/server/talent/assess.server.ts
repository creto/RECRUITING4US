import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import {
  acceptsResponseAt,
  calculateAttemptDeadline,
  calculateWeightedScore,
  canStartAttempt,
  choosePool,
  candidateExportPayload,
  gradeExactMultipleChoice,
  gradeNumeric,
  gradingMethod,
  explainAuthorQuestion,
  manualBasisPoints,
  DEFAULT_TEXT_RUBRIC,
  mapExternalScore,
  planExtension,
  seededShuffle,
  validateAssessmentPublish,
} from "@/domain/rules";
import { runnerAvailability } from "@/domain/edge";
import { stageNameList, trackBar } from "@/domain/sheet";
import {
  answersMatch,
  casesForQuestion,
  codeEntry,
  codeJudgeScore,
  estimateComplexity,
  rankCodeResponses,
  SPACE_CLASSES,
  TIME_CLASSES,
  type RankRow,
  type SpaceClass,
  type TimeClass,
} from "@/domain/judge";
import { proctorKind } from "@/domain/proctor";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, canonical, db, dbNow, json, mapDbError, nid, requireActor, requireUser, sha256, withTransaction } from "./db.server";
import { ensureCodingBank, flag } from "./bank.server";
import { ensureReadCodeBank } from "./read-code.server";
import { candidateItem, answerComplete, coerceAnswer, orderedOptions } from "@/domain/candidate-view";
import { readPersonality, scorePersonality, type PersonalityResult } from "@/domain/personality";
import { ensureReview, rememberEvent } from "./workflows.server";

const HUMAN_TYPES = new Set(["text", "code", "file", "sql", "spreadsheet", "recording"]);

export async function listAssessments(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  await ensureCodingBank(actor.companyId);
  await ensureReadCodeBank(actor.companyId);
  const { ensurePersonalityAssessment } = await import("./personality.server");
  await ensurePersonalityAssessment(actor.companyId);
  const { ensureMentalMath } = await import("./mental.server");
  await ensureMentalMath(actor.companyId);
  try {
    const { ensureOpsDefaults } = await import("./ops.server");
    await ensureOpsDefaults(actor.companyId);
  } catch {
    // Assessments still list if the sandbox tables are not ready.
  }
  const sql = await db();
  const rows = await sql<{
    id: string;
    name: string;
    description: string;
    archived: boolean;
    auto_send: unknown;
    published: number;
    assignments: number;
    duration_seconds: number | null;
    proctored: unknown;
    latest_status: string | null;
  }>`
    select a.id, a.name, a.description, a.archived, a.auto_send,
      (select count(*) from assessment_versions v where v.assessment_id = a.id and v.status = 'PUBLISHED') as published,
      (select count(*) from assignments g
        join assessment_versions v on v.id = g.assessment_version_id
        where v.assessment_id = a.id) as assignments,
      latest.duration_seconds, latest.proctored, latest.status as latest_status
    from assessments a
    left join lateral (
      select duration_seconds, proctored, status
      from assessment_versions
      where assessment_id = a.id and company_id = a.company_id
      order by version_number desc
      limit 1
    ) latest on true
    where a.company_id = ${actor.companyId}
    order by a.created_at desc
  `;
  return rows.map((row) => ({
    ...row,
    auto_send: flag(row.auto_send),
    proctored: flag(row.proctored),
    duration_seconds: Number(row.duration_seconds ?? 0),
  }));
}

export async function getAssessment(userId: string, slug: string, assessmentId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "assessment.author");
  const sql = await db();
  const rows = await sql<{ id: string; name: string; description: string }>`
    select id, name, description from assessments where id = ${assessmentId} and company_id = ${actor.companyId}
  `;
  if (!rows[0]) throw new Error("Not found.");
  const versions = await sql`
    select id, version_number, status, duration_seconds, score_release, instructions,
      to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as published_at
    from assessment_versions where assessment_id = ${assessmentId} and company_id = ${actor.companyId}
    order by version_number desc
  `;
  return { assessment: rows[0], versions };
}

export async function listQuestions(
  userId: string,
  slug: string,
  opts: { filter?: "all" | "bank" | "read" | "other"; limit?: number; offset?: number; q?: string } = {},
) {
  const actor = await requireActor(userId, slug);
  allow(actor, "assessment.author");
  await ensureCodingBank(actor.companyId);
  await ensureReadCodeBank(actor.companyId);
  const sql = await db();
  const filter = opts.filter ?? "all";
  const limit = Math.min(100, Math.max(1, Number(opts.limit ?? 40)));
  const offset = Math.max(0, Number(opts.offset ?? 0));
  const needle = (opts.q ?? "").trim().slice(0, 80);
  const bank = filter === "bank";
  const read = filter === "read";
  const other = filter === "other";
  const totals = await sql<{ n: number }>`
    select count(*)::int as n
    from questions q
    join question_versions v on v.question_id = q.id and v.company_id = q.company_id
    where q.company_id = ${actor.companyId}
      and v.version_number = (
        select max(version_number) from question_versions where question_id = q.id
      )
      and (
        (${bank} and q.tags like 'coding-bank%')
        or (${read} and q.tags like 'read-code%')
        or (${other} and q.tags not like 'coding-bank%' and q.tags not like 'read-code%')
        or (not ${bank} and not ${read} and not ${other})
      )
      and (${needle} = '' or v.prompt ilike ${"%" + needle + "%"} or coalesce(v.payload->>'title', '') ilike ${"%" + needle + "%"})
  `;
  const rows = await sql<{
    id: string;
    type: string;
    tags: string;
    archived: boolean;
    prompt: string;
    title: string | null;
    version_number: number;
    version_id: string;
    points: number;
    difficulty: string | null;
    payload: unknown;
    rubric: unknown;
    key_payload: unknown;
  }>`
    select q.id, q.type, q.tags, q.archived,
      left(v.prompt, 900) as prompt,
      v.payload->>'title' as title,
      v.version_number, v.id as version_id, v.points,
      v.payload->>'difficulty' as difficulty,
      case when q.type in ('single', 'multi', 'likert') then v.payload else '{}'::jsonb end as payload,
      case when q.type in ('single', 'multi', 'numeric') then v.rubric else null end as rubric,
      case when q.type in ('single', 'multi', 'numeric') then v.key_payload else '{}'::jsonb end as key_payload
    from questions q
    join question_versions v on v.question_id = q.id and v.company_id = q.company_id
    where q.company_id = ${actor.companyId}
      and v.version_number = (
        select max(version_number) from question_versions where question_id = q.id
      )
      and (
        (${bank} and q.tags like 'coding-bank%')
        or (${read} and q.tags like 'read-code%')
        or (${other} and q.tags not like 'coding-bank%' and q.tags not like 'read-code%')
        or (not ${bank} and not ${read} and not ${other})
      )
      and (${needle} = '' or v.prompt ilike ${"%" + needle + "%"} or coalesce(v.payload->>'title', '') ilike ${"%" + needle + "%"})
    order by
      case when q.tags like 'coding-bank%' or q.tags like 'read-code%' then 1 else 0 end,
      q.created_at desc
    limit ${limit} offset ${offset}
  `;
  const items = rows.map((row) => {
    const bankish = row.tags.startsWith("coding-bank") || row.tags.startsWith("read-code");
    const grading = !bankish && gradingMethod(row.type)
      ? explainAuthorQuestion({
          type: row.type,
          points: row.points,
          payload: row.payload,
          rubric: row.rubric,
          key: row.key_payload,
        })
      : null;
    return {
      id: row.id,
      type: row.type,
      tags: row.tags,
      archived: row.archived,
      prompt: row.prompt,
      title: row.title,
      version_number: row.version_number,
      version_id: row.version_id,
      points: row.points,
      difficulty: row.difficulty,
      options: bankish && row.type === "code" ? [] : orderedOptions(row.payload, null),
      grading: grading
        ? { method: grading.method, title: grading.title, keySummary: grading.keySummary, steps: grading.steps }
        : null,
    };
  });
  return {
    items,
    total: Number(totals[0]?.n ?? 0),
    limit,
    offset,
    filter,
  };
}

export async function createQuestion(
  userId: string,
  input: {
    slug: string;
    type: string;
    prompt: string;
    tags: string;
    points: number;
    options: { id: string; label: string }[];
    correct: string[];
    expected?: string;
    absTolerance?: string;
    relTolerance?: string;
  },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.author");
  const sql = await db();
  const questionId = nid();
  const versionId = nid();
  const payload =
    input.type === "numeric"
      ? { absTolerance: input.absTolerance ?? "0", relTolerance: input.relTolerance ?? "0" }
      : input.type === "single" || input.type === "multi"
        ? { options: input.options }
        : { mode: input.type };
  const key =
    input.type === "numeric"
      ? { expected: input.expected ?? "" }
      : input.type === "single" || input.type === "multi"
        ? { correct: input.correct }
        : {};
  if (!HUMAN_TYPES.has(input.type) && input.type !== "single" && input.type !== "multi" && input.type !== "numeric") {
    throw new Error("That question type is not supported.");
  }
  const rubric = HUMAN_TYPES.has(input.type) ? DEFAULT_TEXT_RUBRIC : null;
  if ((input.type === "single" || input.type === "multi") && input.correct.length === 0) {
    throw new Error("Choose the correct option or options.");
  }
  await sql`
    insert into questions (id, company_id, logical_key, type, tags)
    values (${questionId}, ${actor.companyId}, ${questionId}, ${input.type}, ${input.tags.slice(0, 120)})
  `;
  await sql`
    insert into question_versions (
      id, company_id, question_id, version_number, prompt, payload, key_payload, rubric, points
    ) values (
      ${versionId}, ${actor.companyId}, ${questionId}, 1, ${input.prompt.trim()},
      ${json(payload)}::jsonb, ${json(key)}::jsonb, ${rubric ? json(rubric) : null}::jsonb, ${input.points}
    )
  `;
  await audit(actor, "question.create", "question", questionId, "Question drafted.");
  return { questionId, versionId };
}

export async function createAssessment(
  userId: string,
  input: {
    slug: string;
    name: string;
    description: string;
    durationSeconds: number;
    scoreRelease: string;
    instructions: string;
    proctored?: boolean;
    autoSend?: boolean;
    sections: { title: string; weightBasisPoints: number; questionVersionIds: string[]; poolPick?: number | null }[];
  },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.author");
  const sql = await db();
  const assessmentId = nid();
  const versionId = nid();
  await sql`
    insert into assessments (id, company_id, name, description, auto_send)
    values (${assessmentId}, ${actor.companyId}, ${input.name.trim()}, ${input.description}, ${input.autoSend !== false})
  `;
  await sql`
    insert into assessment_versions (
      id, company_id, assessment_id, version_number, status, duration_seconds, instructions, score_release, proctored
    ) values (
      ${versionId}, ${actor.companyId}, ${assessmentId}, 1, 'DRAFT', ${Math.max(60, input.durationSeconds)},
      ${input.instructions}, ${input.scoreRelease === "AGGREGATE" ? "AGGREGATE" : "NONE"}, ${input.proctored === true}
    )
  `;
  let position = 0;
  for (let s = 0; s < input.sections.length; s += 1) {
    const section = input.sections[s]!;
    const sectionId = nid();
    await sql`
      insert into assessment_sections (id, company_id, version_id, title, position, weight_basis_points, pool_pick)
      values (${sectionId}, ${actor.companyId}, ${versionId}, ${section.title}, ${s}, ${section.weightBasisPoints}, ${section.poolPick ?? null})
    `;
    for (const questionVersionId of section.questionVersionIds) {
      const versions = await sql<{ points: number }>`
        select points from question_versions where id = ${questionVersionId} and company_id = ${actor.companyId}
      `;
      if (!versions[0]) throw new Error("A selected question is not in this company.");
      await sql`
        insert into assessment_items (id, company_id, section_id, question_version_id, points, position)
        values (${nid()}, ${actor.companyId}, ${sectionId}, ${questionVersionId}, ${versions[0].points}, ${position})
      `;
      position += 1;
    }
  }
  return { assessmentId, versionId };
}

export async function publishAssessment(userId: string, input: { slug: string; assessmentId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.publish");
  const sql = await db();
  const versions = await sql<{ id: string; status: string; duration_seconds: number }>`
    select id, status, duration_seconds from assessment_versions
    where assessment_id = ${input.assessmentId} and company_id = ${actor.companyId}
    order by version_number desc limit 1
  `;
  const version = versions[0];
  if (!version) throw new Error("Not found.");
  if (version.status === "PUBLISHED") {
    return { ok: true, alreadyPublished: true };
  }
  const sections = await sql<{ id: string; title: string; weight_basis_points: number; pool_pick: number | null }>`
    select id, title, weight_basis_points, pool_pick from assessment_sections
    where version_id = ${version.id} and company_id = ${actor.companyId}
  `;
  const built = [];
  for (const section of sections) {
    const items = await sql<{ type: string; key_payload: unknown; rubric: unknown; points: number }>`
      select q.type, v.key_payload, v.rubric, i.points
      from assessment_items i
      join question_versions v on v.id = i.question_version_id and v.company_id = i.company_id
      join questions q on q.id = v.question_id and q.company_id = v.company_id
      where i.section_id = ${section.id} and i.company_id = ${actor.companyId}
    `;
    built.push({
      title: section.title,
      weightBasisPoints: section.weight_basis_points,
      poolPick: section.pool_pick,
      items: items.map((item) => ({
        type: item.type,
        hasKey: item.type === "numeric"
          ? Boolean((item.key_payload as { expected?: string })?.expected)
          : item.type === "single" || item.type === "multi"
            ? ((item.key_payload as { correct?: string[] })?.correct?.length ?? 0) > 0
            : true,
        hasRubric: Boolean(item.rubric),
        points: item.points,
      })),
    });
  }
  const issues = validateAssessmentPublish({ sections: built, durationSeconds: version.duration_seconds });
  if (issues.length) throw new Error(issues.map((issue) => issue.message).join(" "));
  const hash = sha256(canonical(built));
  const updated = await sql<{ id: string }>`
    update assessment_versions set status = 'PUBLISHED', published_at = now(), content_hash = ${hash}
    where id = ${version.id} and company_id = ${actor.companyId} and status = 'DRAFT'
    returning id
  `;
  if (!updated[0]) {
    const again = await sql<{ status: string }>`
      select status from assessment_versions
      where id = ${version.id} and company_id = ${actor.companyId}
    `;
    if (again[0]?.status === "PUBLISHED") return { ok: true, alreadyPublished: true };
    throw new Error("Publish did not save. Check that you can edit this company, then try again.");
  }
  await audit(actor, "assessment.publish", "assessment", input.assessmentId, "Assessment version published.");
  return { ok: true, alreadyPublished: false };
}

export async function assignAssessment(
  userId: string,
  input: {
    slug: string;
    applicationId: string;
    assessmentId: string;
    startBy: string;
    multiplierBasisPoints: number;
    extraSeconds: number;
  },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.assign");
  const sql = await db();
  const apps = await sql<{ id: string; lifecycle: string }>`
    select id, lifecycle from applications where id = ${input.applicationId} and company_id = ${actor.companyId}
  `;
  if (!apps[0]) throw new Error("Not found.");
  if (apps[0].lifecycle !== "ACTIVE") throw new Error("Only active applications can receive an assessment.");
  const versions = await sql<{ id: string; duration_seconds: number }>`
    select id, duration_seconds from assessment_versions
    where assessment_id = ${input.assessmentId} and company_id = ${actor.companyId} and status = 'PUBLISHED'
    order by version_number desc limit 1
  `;
  if (!versions[0]) throw new Error("Publish the assessment before assigning it.");
  const startBy = new Date(input.startBy);
  if (Number.isNaN(startBy.getTime())) throw new Error("Choose a start-by date.");
  const id = nid();
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by,
      duration_seconds, multiplier_basis_points, extra_seconds
    ) values (
      ${id}, ${actor.companyId}, ${input.applicationId}, ${versions[0].id}, 'INVITED', ${startBy.toISOString()},
      ${versions[0].duration_seconds}, ${input.multiplierBasisPoints}, ${input.extraSeconds}
    )
  `;
  const people = await sql<{ email: string; name: string }>`
    select c.email, s.name from applications a
    join candidates c on c.id = a.candidate_id
    join assessment_versions v on v.id = ${versions[0].id}
    join assessments s on s.id = v.assessment_id
    where a.id = ${input.applicationId}
  `;
  if (people[0]) {
    await sql`
      insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
      values (
        ${nid()}, ${actor.companyId}, ${people[0].email},
        ${"Assessment: " + people[0].name},
        ${"You have an assessment to complete in the candidate portal before the start-by time. Opening this message does not start the timer."},
        'CAPTURED', ${id}
      )
    `;
  }
  await rememberEvent(actor.companyId, "ASSESSMENT_ASSIGNED", id, {
    applicationId: input.applicationId,
    assignmentId: id,
  });
  await audit(actor, "assessment.assign", "assignment", id, "Assessment assigned.");
  return { assignmentId: id };
}

async function candidateOwns(userId: string, applicationId: string) {
  const user = await requireUser(userId);
  const sql = await db();
  const rows = await sql<{ company_id: string; candidate_id: string; email_verified: boolean }>`
    select a.company_id, a.candidate_id, u.email_verified as email_verified
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join lateral app_user_identity(${userId}) u on true
    where a.id = ${applicationId}
      and (
        c.user_id = ${userId}
        or (lower(c.email) = lower(u.email) and u.email_verified = true)
      )
  `;
  if (!rows[0]) throw new Error("Not found.");
  return { ...rows[0], email: user.emailNormalized };
}

export async function listMyApplications(userId: string) {
  await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    id: string;
    company_name: string;
    company_slug: string;
    job_title: string;
    lifecycle: string;
    category: string;
    stage_name: string;
    stages: unknown;
    submitted_at: string;
  }>`
    select a.id, c.name as company_name, c.slug as company_slug, j.title as job_title,
      a.lifecycle, s.category, s.name as stage_name,
      coalesce((
        select json_agg(json_build_object('name', ps.name) order by ps.position)::text
        from pipeline_stages ps
        where ps.company_id = a.company_id and ps.job_id = a.job_id and ps.archived = false
      ), '[]') as stages,
      to_char(a.submitted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as submitted_at
    from applications a
    join companies c on c.id = a.company_id
    join jobs j on j.id = a.job_id
    join pipeline_stages s on s.id = a.current_stage_id
    join candidates cand on cand.id = a.candidate_id
    join lateral app_user_identity(${userId}) u on true
    where cand.user_id = ${userId}
      or (lower(cand.email) = lower(u.email) and u.email_verified = true)
    order by a.submitted_at desc
  `;
  return rows.map((row) => {
    const bar = trackBar({
      stages: stageNameList(row.stages),
      stageName: row.stage_name,
      category: row.category,
      lifecycle: row.lifecycle,
    });
    return {
      id: row.id,
      companyName: row.company_name,
      companySlug: row.company_slug,
      jobTitle: row.job_title,
      status: row.lifecycle === "ACTIVE" ? row.category : row.lifecycle,
      label: bar.label,
      stageName: row.stage_name,
      steps: bar.steps,
      index: bar.index,
      stopped: bar.stopped,
      hired: bar.hired,
      submittedAt: row.submitted_at,
    };
  });
}

export async function getMyApplication(userId: string, applicationId: string) {
  await candidateOwns(userId, applicationId);
  const sql = await db();
  const rows = await sql<{
    id: string;
    company_name: string;
    job_title: string;
    lifecycle: string;
    category: string;
    stage_name: string;
    stages: unknown;
    timezone: string;
  }>`
    select a.id, c.name as company_name, j.title as job_title, a.lifecycle, s.category, s.name as stage_name, c.timezone,
      coalesce((
        select json_agg(json_build_object('name', ps.name) order by ps.position)::text
        from pipeline_stages ps
        where ps.company_id = a.company_id and ps.job_id = a.job_id and ps.archived = false
      ), '[]') as stages
    from applications a
    join companies c on c.id = a.company_id
    join jobs j on j.id = a.job_id
    join pipeline_stages s on s.id = a.current_stage_id
    where a.id = ${applicationId}
  `;
  const application = rows[0];
  if (!application) throw new Error("Not found.");
  const bar = trackBar({
    stages: stageNameList(application.stages),
    stageName: application.stage_name,
    category: application.category,
    lifecycle: application.lifecycle,
  });
  const assignments = await sql`
    select g.id, g.status, s.name, v.duration_seconds, v.instructions, v.proctored, g.multiplier_basis_points, g.extra_seconds,
      to_char(g.start_by at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as start_by,
      (select t.id from attempts t where t.assignment_id = g.id and t.status = 'IN_PROGRESS' limit 1) as active_attempt
    from assignments g
    join assessment_versions v on v.id = g.assessment_version_id
    join assessments s on s.id = v.assessment_id
    where g.application_id = ${applicationId}
  `;
  const offers = await sql`
    select o.id, o.status, o.current_revision, r.title, r.salary_minor, r.currency, r.start_date::text as start_date, r.message
    from offers o
    join offer_revisions r on r.offer_id = o.id and r.revision = o.current_revision
    where o.application_id = ${applicationId} and o.status in ('SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')
  `;
  const interviews = await sql`
    select id, title, status, timezone, location, meeting_url,
      to_char(starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as starts_at,
      to_char(ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ends_at
    from interviews where application_id = ${applicationId} and status <> 'CANCELLED'
  `;
  const { listMyMail } = await import("./mail.server");
  const messages = await listMyMail(userId, applicationId);
  return {
    application: {
      id: application.id,
      company_name: application.company_name,
      job_title: application.job_title,
      lifecycle: application.lifecycle,
      category: application.category,
      stage_name: application.stage_name,
      timezone: application.timezone,
      label: bar.label,
      steps: bar.steps,
      index: bar.index,
      stopped: bar.stopped,
      hired: bar.hired,
    },
    assignments,
    offers,
    interviews,
    messages,
    runner: runnerAvailability(),
  };
}

export async function withdrawMine(userId: string, applicationId: string, reason: string) {
  assertSameSiteRequest();
  await candidateOwns(userId, applicationId);
  const sql = await db();
  const updated = await sql<{ company_id: string }>`
    update applications set lifecycle = 'WITHDRAWN', closed_at = now(), version = version + 1
    where id = ${applicationId} and lifecycle = 'ACTIVE'
    returning company_id
  `;
  if (!updated[0]) throw new Error("This application can no longer be withdrawn.");
  await sql`
    insert into stage_events (id, company_id, application_id, from_lifecycle, to_lifecycle, actor_user_id, reason)
    values (${nid()}, ${updated[0].company_id}, ${applicationId}, 'ACTIVE', 'WITHDRAWN', ${userId}, ${reason.slice(0, 400)})
  `;
  await rememberEvent(updated[0].company_id, "LIFECYCLE_CHANGED", applicationId, {
    applicationId,
    lifecycle: "WITHDRAWN",
  });
  return { ok: true };
}

export async function requestDeletion(userId: string, applicationId: string) {
  assertSameSiteRequest();
  const owned = await candidateOwns(userId, applicationId);
  const sql = await db();
  await sql`
    insert into deletion_requests (id, company_id, candidate_id, requested_by)
    values (${nid()}, ${owned.company_id}, ${owned.candidate_id}, ${userId})
  `;
  return { ok: true };
}

export async function startAttempt(userId: string, assignmentId: string) {
  assertSameSiteRequest();
  await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    id: string;
    company_id: string;
    application_id: string;
    version_id: string;
    status: string;
    start_by: string;
    hard_finish_by: string | null;
    duration_seconds: number;
    multiplier_basis_points: number;
    extra_seconds: number;
    attempt_allowance: number;
  }>`
    select g.id, g.company_id, g.application_id, g.assessment_version_id as version_id, g.status,
      g.start_by::text as start_by, g.hard_finish_by::text as hard_finish_by,
      g.duration_seconds, g.multiplier_basis_points, g.extra_seconds, g.attempt_allowance
    from assignments g where g.id = ${assignmentId}
  `;
  const assignment = rows[0];
  if (!assignment) throw new Error("Not found.");
  await candidateOwns(userId, assignment.application_id);
  const active = await sql<{ id: string }>`
    select id from attempts
    where assignment_id = ${assignmentId} and status in ('NOT_STARTED', 'IN_PROGRESS')
  `;
  if (active[0]) return { attemptId: active[0].id, created: false };
  if (assignment.status === "CANCELLED" || assignment.status === "EXPIRED" || assignment.status === "COMPLETED") {
    throw new Error("This assessment can no longer be started.");
  }
  const used = await sql<{ n: number }>`select count(*) as n from attempts where assignment_id = ${assignmentId}`;
  if (Number(used[0]?.n ?? 0) >= assignment.attempt_allowance) {
    throw new Error("No attempts remain on this assignment.");
  }
  const now = await dbNow();
  const startBy = new Date(assignment.start_by);
  let deadline: Date;
  try {
    deadline = calculateAttemptDeadline({
      startedAt: now,
      durationSeconds: assignment.duration_seconds,
      multiplierBasisPoints: assignment.multiplier_basis_points,
      extraSeconds: assignment.extra_seconds,
      hardFinishBy: assignment.hard_finish_by ? new Date(assignment.hard_finish_by) : null,
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "This assessment cannot be started.");
  }
  if (!canStartAttempt({ now, startBy, deadline })) {
    if (now.getTime() >= startBy.getTime()) {
      await sql`update assignments set status = 'EXPIRED' where id = ${assignmentId} and status = 'INVITED'`;
      throw new Error("The start window has closed.");
    }
    throw new Error("There is no positive time remaining, so the attempt was not started.");
  }
  const attemptId = nid();
  const ordinal = Number(used[0]?.n ?? 0) + 1;
  const bank = await sql<{
    question_version_id: string;
    section_id: string;
    position: number;
    points: number;
    payload: { options?: { id: string }[] };
  }>`
    select i.question_version_id, i.section_id, i.position, i.points, v.payload
    from assessment_items i
    join assessment_sections s on s.id = i.section_id
    join question_versions v on v.id = i.question_version_id
    where s.version_id = ${assignment.version_id}
    order by i.position
  `;
  const sectionRows = await sql<{ id: string; pool_pick: number | null }>`
    select id, pool_pick from assessment_sections where version_id = ${assignment.version_id}
  `;
  const selected = sectionRows.flatMap((section) => {
    const group = bank.filter((item) => item.section_id === section.id);
    return section.pool_pick ? choosePool(group, section.pool_pick, `${attemptId}:${section.id}`) : group;
  });
  try {
    await withTransaction(async () => {
      await sql`
        insert into attempts (id, company_id, assignment_id, ordinal, status, started_at, deadline)
        values (${attemptId}, ${assignment.company_id}, ${assignmentId}, ${ordinal}, 'IN_PROGRESS', ${now.toISOString()}, ${deadline.toISOString()})
      `;
      for (const item of selected) {
        const options = item.payload?.options ? seededShuffle(item.payload.options, `${attemptId}:${item.question_version_id}`) : [];
        await sql`
          insert into attempt_items (
            id, company_id, attempt_id, question_version_id, section_id, position, points, option_order
          ) values (
            ${nid()}, ${assignment.company_id}, ${attemptId}, ${item.question_version_id}, ${item.section_id},
            ${item.position}, ${item.points}, ${json(options.map((option) => option.id))}::jsonb
          )
        `;
      }
      await sql`update assignments set status = 'IN_PROGRESS' where id = ${assignmentId}`;
    });
  } catch (error) {
    const again = await sql<{ id: string }>`
      select id from attempts where assignment_id = ${assignmentId} and status = 'IN_PROGRESS'
    `;
    if (again[0]) return { attemptId: again[0].id, created: false };
    mapDbError(error);
  }
  await audit(
    { companyId: assignment.company_id, userId },
    "attempt.start",
    "attempt",
    attemptId,
    "Attempt started. The deadline is fixed on the server.",
  );
  return { attemptId, created: true };
}

type AttemptItem = {
  id: string;
  position: number;
  points: number;
  prompt: string;
  type: string;
  payload: { options?: { id: string; label: string }[]; absTolerance?: string; relTolerance?: string; mode?: string };
  option_order: string[];
  section_title: string;
  answer: unknown;
  revision: number | null;
};

export async function getAttempt(userId: string, attemptId: string) {
  const ctx = await loadOwnedAttempt(userId, attemptId);
  await sweepAttempt(ctx.attempt.company_id, attemptId);
  const fresh = await loadOwnedAttempt(userId, attemptId);
  const sql = await db();
  const items = await sql<AttemptItem>`
    select i.id, i.position, i.points, v.prompt, q.type, v.payload, i.option_order, s.title as section_title,
      r.answer, r.revision
    from attempt_items i
    join question_versions v on v.id = i.question_version_id
    join questions q on q.id = v.question_id
    join assessment_sections s on s.id = i.section_id
    left join responses r on r.attempt_item_id = i.id
    where i.attempt_id = ${attemptId}
    order by i.position
  `;
  const snapshot = await sql<{ receipt_id: string; submitted_at: string; reason: string; answers: unknown }>`
    select receipt_id, reason, answers,
      to_char(submitted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as submitted_at
    from submission_snapshots where attempt_id = ${attemptId}
  `;
  const release = await sql<{ score_release: string; name: string; instructions: string; proctored: unknown; duration_seconds: number }>`
    select v.score_release, a.name, v.instructions, v.proctored, v.duration_seconds
    from attempts t
    join assignments g on g.id = t.assignment_id
    join assessment_versions v on v.id = g.assessment_version_id
    join assessments a on a.id = v.assessment_id
    where t.id = ${attemptId}
  `;
  let score: number | null = null;
  if (snapshot[0] && release[0]?.score_release === "AGGREGATE") {
    const evals = await sql<{ basis_points: number | null; status: string }>`
      select basis_points, status from evaluations
      where attempt_id = ${attemptId} and origin = 'AUTOMATIC'
      order by revision desc limit 1
    `;
    if (evals[0]?.status === "FINAL") score = evals[0].basis_points;
  }
  const now = await dbNow();
  return {
    serverNow: now.toISOString(),
    attempt: {
      id: fresh.attempt.id,
      status: fresh.attempt.status,
      deadline: fresh.attempt.deadline,
      startedAt: fresh.attempt.started_at,
      reason: fresh.attempt.submission_reason,
    },
    assessmentName: release[0]?.name ?? "Assessment",
    instructions: release[0]?.instructions ?? "",
    proctored: flag(release[0]?.proctored),
    durationSeconds: Number(release[0]?.duration_seconds ?? 0),
    runner: runnerAvailability(),
    items: items.map((item) => candidateItem({
      id: item.id,
      position: item.position,
      points: item.points,
      prompt: item.prompt,
      type: item.type,
      section: item.section_title,
      options: presentOptions(item),
      absTolerance: item.payload?.absTolerance,
      relTolerance: item.payload?.relTolerance,
      answer: item.answer ?? null,
      revision: item.revision ?? 0,
    })),
    receipt: snapshot[0]
      ? {
          id: snapshot[0].receipt_id,
          submittedAt: snapshot[0].submitted_at,
          reason: snapshot[0].reason,
          answered: Array.isArray(snapshot[0].answers) ? snapshot[0].answers.length : 0,
          score,
        }
      : null,
    personality: snapshot[0] ? await storedPersonality(attemptId) : null,
  };
}

export async function recordProctorEvent(
  userId: string,
  input: { attemptId: string; kind: string; detail: string },
) {
  assertSameSiteRequest();
  const kind = proctorKind(input.kind);
  if (!kind) throw new Error("That proctor note is not recognized.");
  const ctx = await loadOwnedAttempt(userId, input.attemptId);
  if (ctx.attempt.status !== "IN_PROGRESS") return { ok: true, stored: false };
  const sql = await db();
  const versions = await sql<{ proctored: unknown }>`
    select v.proctored
    from attempts t
    join assignments g on g.id = t.assignment_id
    join assessment_versions v on v.id = g.assessment_version_id
    where t.id = ${input.attemptId} and t.company_id = ${ctx.attempt.company_id}
  `;
  if (!flag(versions[0]?.proctored)) return { ok: true, stored: false };
  if (kind === "HEARTBEAT") {
    const recent = await sql<{ id: string }>`
      select id from proctor_events
      where company_id = ${ctx.attempt.company_id} and attempt_id = ${input.attemptId} and kind = 'HEARTBEAT'
        and created_at > now() - interval '20 seconds'
      limit 1
    `;
    if (recent[0]) return { ok: true, stored: false };
  }
  await sql`
    insert into proctor_events (id, company_id, attempt_id, kind, detail)
    values (${nid()}, ${ctx.attempt.company_id}, ${input.attemptId}, ${kind}, ${input.detail.slice(0, 200)})
  `;
  return { ok: true, stored: true };
}

function presentOptions(item: AttemptItem) {
  return orderedOptions(item.payload, item.option_order);
}

async function loadOwnedAttempt(userId: string, attemptId: string) {
  await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    id: string;
    company_id: string;
    application_id: string;
    assignment_id: string;
    status: string;
    deadline: string;
    started_at: string;
    submission_reason: string | null;
  }>`
    select t.id, t.company_id, g.application_id, t.assignment_id, t.status,
      to_char(t.deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as deadline,
      to_char(t.started_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as started_at,
      t.submission_reason
    from attempts t
    join assignments g on g.id = t.assignment_id
    where t.id = ${attemptId}
  `;
  const attempt = rows[0];
  if (!attempt) throw new Error("Not found.");
  await candidateOwns(userId, attempt.application_id);
  return { attempt };
}

export async function saveResponse(
  userId: string,
  input: { attemptId: string; itemId: string; answer: unknown; expectedRevision: number; mutationId: string },
) {
  assertSameSiteRequest();
  const ctx = await loadOwnedAttempt(userId, input.attemptId);
  const sql = await db();
  const hash = sha256(canonical(input.answer));
  const prior = await sql<{ payload_hash: string; revision: number }>`
    select payload_hash, revision from response_mutations
    where company_id = ${ctx.attempt.company_id} and attempt_id = ${input.attemptId} and mutation_id = ${input.mutationId}
  `;
  if (prior[0]) {
    if (prior[0].payload_hash !== hash) {
      return { status: "conflict" as const, message: "This save id was reused with a different answer.", revision: prior[0].revision };
    }
    return { status: "saved" as const, revision: prior[0].revision, replay: true };
  }
  const items = await sql<{ type: string; payload: { options?: { id: string }[] } }>`
    select q.type, v.payload
    from attempt_items i
    join question_versions v on v.id = i.question_version_id
    join questions q on q.id = v.question_id
    where i.id = ${input.itemId} and i.attempt_id = ${input.attemptId} and i.company_id = ${ctx.attempt.company_id}
  `;
  const item = items[0];
  if (!item) throw new Error("Not found.");
  const problem = validateAnswer(item.type, item.payload, input.answer);
  if (problem) return { status: "rejected" as const, message: problem, revision: input.expectedRevision };
  const now = await dbNow();
  const deadline = new Date(ctx.attempt.deadline);
  if (!acceptsResponseAt({ status: ctx.attempt.status, deadline, now })) {
    return {
      status: "rejected" as const,
      message: ctx.attempt.status === "IN_PROGRESS"
        ? "The deadline has passed. This answer was not saved."
        : "This attempt is no longer accepting answers.",
      revision: input.expectedRevision,
    };
  }
  if (input.expectedRevision === 0) {
    const inserted = await sql<{ revision: number }>`
      with att as (
        select id from attempts
        where id = ${input.attemptId} and status = 'IN_PROGRESS' and now() < deadline
      )
      insert into responses (id, company_id, attempt_item_id, answer, revision, mutation_id, payload_hash)
      select ${nid()}, ${ctx.attempt.company_id}, ${input.itemId}, ${json(input.answer)}::jsonb, 1, ${input.mutationId}, ${hash}
      from att
      on conflict (company_id, attempt_item_id) do nothing
      returning revision
    `;
    if (inserted[0]) {
      await sql`
        insert into response_mutations (id, company_id, attempt_id, mutation_id, payload_hash, attempt_item_id, revision)
        values (${nid()}, ${ctx.attempt.company_id}, ${input.attemptId}, ${input.mutationId}, ${hash}, ${input.itemId}, 1)
      `;
      return { status: "saved" as const, revision: 1, replay: false };
    }
  }
  const updated = await sql<{ revision: number }>`
    update responses r
    set answer = ${json(input.answer)}::jsonb, revision = r.revision + 1, mutation_id = ${input.mutationId},
        payload_hash = ${hash}, updated_at = now()
    from attempts a
    where r.attempt_item_id = ${input.itemId} and r.company_id = ${ctx.attempt.company_id}
      and r.revision = ${input.expectedRevision}
      and a.id = ${input.attemptId} and a.status = 'IN_PROGRESS' and now() < a.deadline
    returning r.revision
  `;
  if (!updated[0]) {
    const current = await sql<{ revision: number; answer: unknown }>`
      select revision, answer from responses where attempt_item_id = ${input.itemId}
    `;
    return {
      status: "conflict" as const,
      message: "A newer answer is already saved. Review it before trying again.",
      revision: current[0]?.revision ?? 0,
      answer: current[0]?.answer ?? null,
    };
  }
  await sql`
    insert into response_mutations (id, company_id, attempt_id, mutation_id, payload_hash, attempt_item_id, revision)
    values (
      ${nid()}, ${ctx.attempt.company_id}, ${input.attemptId}, ${input.mutationId}, ${hash}, ${input.itemId}, ${updated[0].revision}
    )
  `;
  return { status: "saved" as const, revision: updated[0].revision, replay: false };
}

function validateAnswer(type: string, payload: unknown, answer: unknown): string | null {
  if (!answer || typeof answer !== "object") return "That answer is incomplete.";
  const record = answer as Record<string, unknown>;
  const ids = new Set(orderedOptions(payload, null).map((option) => option.id));
  if (type === "single" || type === "likert") {
    if (typeof record.optionId !== "string" || !ids.has(record.optionId)) return "Choose one of the listed options.";
  } else if (type === "multi") {
    if (!Array.isArray(record.optionIds) || record.optionIds.some((id) => typeof id !== "string" || !ids.has(id))) {
      return "Choose from the listed options.";
    }
  } else if (type === "numeric") {
    if (typeof record.value !== "string" || record.value.length > 40) return "Enter a plain decimal number.";
  } else if (type === "text" || type === "code") {
    if (typeof record.text !== "string") return "Enter a response.";
    if (record.text.length > 20000) return "That response is too long.";
  } else return "This question type cannot be saved here.";
  return null;
}

export async function submitAttempt(
  userId: string,
  input: { attemptId: string; expectedRevisions: Record<string, number> },
) {
  assertSameSiteRequest();
  await loadOwnedAttempt(userId, input.attemptId);
  return finalize(input.attemptId, "MANUAL", input.expectedRevisions, userId);
}

export async function sweepCompany(companyId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  const due = await sql<{ id: string }>`
    select id from attempts
    where company_id = ${companyId} and status = 'IN_PROGRESS' and deadline <= now()
    limit 20
  `;
  for (const attempt of due) await finalize(attempt.id, "DEADLINE", null, null);
  await sql`
    update assignments set status = 'EXPIRED'
    where company_id = ${companyId} and status = 'INVITED' and start_by <= now()
      and not exists (select 1 from attempts t where t.assignment_id = assignments.id)
  `;
}

async function sweepAttempt(companyId: string, attemptId: string) {
  const sql = await db();
  const due = await sql<{ id: string }>`
    select id from attempts where id = ${attemptId} and company_id = ${companyId}
      and status = 'IN_PROGRESS' and deadline <= now()
  `;
  if (due[0]) await finalize(attemptId, "DEADLINE", null, null);
}

async function finalize(
  attemptId: string,
  reason: "MANUAL" | "DEADLINE",
  expectedRevisions: Record<string, number> | null,
  actorUserId: string | null,
) {
  const sql = await db();
  const existing = await sql<{
    receipt_id: string;
    submitted_at: string;
    reason: string;
    answers: unknown[];
  }>`
    select receipt_id, reason, answers,
      to_char(submitted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as submitted_at
    from submission_snapshots where attempt_id = ${attemptId}
  `;
  if (existing[0]) {
    return {
      receiptId: existing[0].receipt_id,
      submittedAt: existing[0].submitted_at,
      reason: existing[0].reason,
      answered: existing[0].answers.length,
      personality: await storedPersonality(attemptId),
      replay: true,
    };
  }
  const attempts = await sql<{
    company_id: string;
    application_id: string;
    assignment_id: string;
    status: string;
    deadline: string;
  }>`
    select t.company_id, g.application_id, t.assignment_id, t.status,
      to_char(t.deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as deadline
    from attempts t join assignments g on g.id = t.assignment_id
    where t.id = ${attemptId}
  `;
  const attempt = attempts[0];
  if (!attempt || attempt.status !== "IN_PROGRESS") throw new Error("This attempt cannot be submitted.");
  const now = await dbNow();
  const late = now.getTime() >= new Date(attempt.deadline).getTime();
  const responses = await sql<{ attempt_item_id: string; answer: unknown; revision: number }>`
    select r.attempt_item_id, r.answer, r.revision
    from responses r
    join attempt_items i on i.id = r.attempt_item_id
    where i.attempt_id = ${attemptId}
  `;
  if (!late && reason === "MANUAL" && expectedRevisions) {
    for (const response of responses) {
      if (expectedRevisions[response.attempt_item_id] !== response.revision) {
        throw new Error("Some answers changed while you were submitting. Review the latest saved answers.");
      }
    }
    const paper = await sql<{ id: string; type: string; answer: unknown }>`
      select i.id, q.type, r.answer
      from attempt_items i
      join question_versions v on v.id = i.question_version_id
      join questions q on q.id = v.question_id
      left join responses r on r.attempt_item_id = i.id
      where i.attempt_id = ${attemptId}
    `;
    const open = paper.filter((item) => !answerComplete(item.type, coerceAnswer(item.answer)));
    if (open.length > 0) {
      throw new Error(`Answer every question before submitting. ${open.length} still open. When time runs out, the server submits what is already saved.`);
    }
  }
  const finalReason = late ? "DEADLINE" : reason;
  const receiptId = nid();
  const snapshotId = nid();
  const inserted = await sql<{ receipt_id: string }>`
    insert into submission_snapshots (id, company_id, attempt_id, answers, content_hash, receipt_id, reason, submitted_at)
    select ${snapshotId}, ${attempt.company_id}, ${attemptId}, ${json(responses)}::jsonb,
      ${sha256(canonical(responses))}, ${receiptId}, ${finalReason}, now()
    where not exists (select 1 from submission_snapshots where attempt_id = ${attemptId})
    returning receipt_id
  `;
  if (!inserted[0]) return finalize(attemptId, reason, expectedRevisions, actorUserId);
  await sql`
    update attempts set status = 'SUBMITTED', submitted_at = now(), submission_reason = ${finalReason}
    where id = ${attemptId} and status = 'IN_PROGRESS'
  `;
  await sql`update assignments set status = 'COMPLETED' where id = ${attempt.assignment_id}`;
  const score = await gradeObjective(attempt.company_id, attemptId);
  const status = score.pending ? "AWAITING_REVIEW" : "COMPLETED";
  await sql`update attempts set status = ${status} where id = ${attemptId}`;
  if (score.pending) await ensureReview(attempt.company_id, attemptId, attempt.application_id);
  await rememberEvent(attempt.company_id, "ASSESSMENT_COMPLETED", attemptId, {
    applicationId: attempt.application_id,
    attemptId,
    scoreStatus: score.pending ? "PENDING" : "FINAL",
    basisPoints: score.basisPoints,
  });
  await audit(
    { companyId: attempt.company_id, userId: actorUserId },
    "attempt.submit",
    "attempt",
    attemptId,
    `Submitted (${finalReason}).`,
  );
  try {
    const { advanceJob } = await import("./ladder.server");
    const jobs = await sql<{ job_id: string }>`
      select job_id from applications where id = ${attempt.application_id} and company_id = ${attempt.company_id}
    `;
    if (jobs[0]) await advanceJob(attempt.company_id, jobs[0].job_id);
  } catch {
    // The submission is already stored. Opening the pipeline ranks again.
  }
  const stamped = await sql<{ submitted_at: string }>`
    select to_char(submitted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as submitted_at
    from submission_snapshots where attempt_id = ${attemptId}
  `;
  return {
    receiptId,
    submittedAt: stamped[0]?.submitted_at ?? now.toISOString(),
    reason: finalReason,
    answered: responses.length,
    personality: score.personality,
    replay: false,
  };
}

async function gradeObjective(companyId: string, attemptId: string) {
  const sql = await db();
  const items = await sql<{
    id: string;
    points: number;
    type: string;
    section_id: string;
    weight: number;
    section_title: string;
    key_payload: { correct?: string[]; expected?: string; dimension?: string; toward?: string };
    payload: { absTolerance?: string; relTolerance?: string };
    answer: { optionId?: string; optionIds?: string[]; value?: string } | null;
  }>`
    select i.id, i.points, q.type, i.section_id, s.weight_basis_points as weight, s.title as section_title,
      v.key_payload, v.payload, r.answer
    from attempt_items i
    join assessment_sections s on s.id = i.section_id
    join question_versions v on v.id = i.question_version_id
    join questions q on q.id = v.question_id
    left join responses r on r.attempt_item_id = i.id
    where i.attempt_id = ${attemptId} and i.company_id = ${companyId}
  `;
  const personality = personalityFrom(items);
  if (items.length > 0 && items.every((item) => item.type === "likert") && personality) {
    const revisionRows = await sql<{ n: number }>`
      select coalesce(max(revision), 0) as n from evaluations where attempt_id = ${attemptId}
    `;
    await sql`
      insert into evaluations (
        id, company_id, attempt_id, revision, origin, status, basis_points, raw, created_by
      ) values (
        ${nid()}, ${companyId}, ${attemptId}, ${Number(revisionRows[0]?.n ?? 0) + 1}, 'AUTOMATIC',
        'FINAL', null, ${json(personality)}::jsonb, ${"system"}
      )
    `;
    return { pending: false, basisPoints: null, personality };
  }
  const bySection = new Map<string, { title: string; weight: number; earned: number; possible: number; pending: boolean }>();
  for (const item of items) {
    if (item.type === "likert") continue;
    const bucket = bySection.get(item.section_id) ?? {
      title: item.section_title,
      weight: item.weight,
      earned: 0,
      possible: 0,
      pending: false,
    };
    const auto = item.type === "single" || item.type === "multi" || item.type === "numeric";
    if (!auto) {
      bucket.pending = true;
      bucket.possible += item.points;
    } else {
      bucket.possible += item.points;
      let credit = 0;
      if (item.type === "single") {
        credit = gradeExactMultipleChoice(
          item.answer?.optionId ? [item.answer.optionId] : [],
          item.key_payload.correct ?? [],
        );
      } else if (item.type === "multi") {
        credit = gradeExactMultipleChoice(item.answer?.optionIds ?? [], item.key_payload.correct ?? []);
      } else if (item.answer?.value && item.key_payload.expected) {
        credit = gradeNumeric({
          answer: item.answer.value,
          expected: item.key_payload.expected,
          absTolerance: item.payload.absTolerance ?? "0",
          relTolerance: item.payload.relTolerance ?? "0",
        })
          ? 1
          : 0;
      }
      bucket.earned += Math.round(credit * item.points);
    }
    bySection.set(item.section_id, bucket);
  }
  const sections = [...bySection.values()].map((section) => ({
    earned: section.pending ? null : section.earned,
    possible: Math.max(section.possible, 1),
    weightBasisPoints: section.weight,
    status: section.pending ? ("PENDING" as const) : ("FINAL" as const),
    title: section.title,
  }));
  const weighted = calculateWeightedScore(sections);
  const revisionRows = await sql<{ n: number }>`
    select coalesce(max(revision), 0) as n from evaluations where attempt_id = ${attemptId}
  `;
  await sql`
    insert into evaluations (
      id, company_id, attempt_id, revision, origin, status, basis_points, numerator, denominator, raw, created_by
    ) values (
      ${nid()}, ${companyId}, ${attemptId}, ${Number(revisionRows[0]?.n ?? 0) + 1}, 'AUTOMATIC',
      ${weighted.status}, ${weighted.basisPoints}, ${weighted.numerator}, ${weighted.denominator},
      ${json({ sections })}::jsonb, ${"system"}
    )
  `;
  return { pending: weighted.status !== "FINAL", basisPoints: weighted.basisPoints, personality: null };
}

function personalityFrom(items: {
  type: string;
  key_payload: { dimension?: string; toward?: string };
  answer: { optionId?: string } | null;
}[]): PersonalityResult | null {
  const likert = items.filter((item) => item.type === "likert");
  if (!likert.length) return null;
  return scorePersonality(likert.map((item) => ({
    optionId: item.answer?.optionId ?? null,
    dimension: item.key_payload?.dimension ?? "",
    toward: item.key_payload?.toward ?? "",
  })));
}

async function storedPersonality(attemptId: string): Promise<PersonalityResult | null> {
  const sql = await db();
  const rows = await sql<{ raw: unknown }>`
    select raw from evaluations where attempt_id = ${attemptId} and origin = 'AUTOMATIC'
    order by revision desc limit 1
  `;
  const raw = rows[0]?.raw;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return readPersonality(parsed);
}

export async function listReviews(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const sql = await db();
  return sql`
    select r.id, r.status, a.name as candidate_name, j.title as job_title, s.name as assessment_name,
      to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from review_tasks r
    join applications ap on ap.id = r.application_id
    join candidates a on a.id = ap.candidate_id
    join jobs j on j.id = ap.job_id
    join attempts t on t.id = r.attempt_id
    join assignments g on g.id = t.assignment_id
    join assessment_versions v on v.id = g.assessment_version_id
    join assessments s on s.id = v.assessment_id
    where r.company_id = ${actor.companyId}
    order by r.created_at desc
  `;
}

export async function getReview(userId: string, slug: string, reviewId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const sql = await db();
  const tasks = await sql<{ id: string; status: string; notes: string; ratings: Record<string, number>; attempt_id: string }>`
    select id, status, notes, ratings, attempt_id from review_tasks
    where id = ${reviewId} and company_id = ${actor.companyId}
  `;
  const task = tasks[0];
  if (!task) throw new Error("Not found.");
  const items = await sql<{ id: string; prompt: string; type: string; points: number; answer: { text?: string } | null; rubric: { dimensions: { id: string; label: string; anchors: string[] }[] } | null }>`
    select i.id, v.prompt, q.type, i.points, r.answer, v.rubric
    from attempt_items i
    join question_versions v on v.id = i.question_version_id
    join questions q on q.id = v.question_id
    left join responses r on r.attempt_item_id = i.id
    where i.attempt_id = ${task.attempt_id}
      and q.type in ('text', 'code', 'file', 'sql', 'spreadsheet', 'recording')
    order by i.position
  `;
  return {
    task,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      points: item.points,
      prompt: item.prompt,
      answer: item.answer?.text ?? "",
      rubric: item.rubric ?? DEFAULT_TEXT_RUBRIC,
    })),
  };
}

export async function submitReview(
  userId: string,
  input: { slug: string; reviewId: string; ratings: Record<string, number>; notes: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "evaluation.grade");
  const review = await getReview(userId, input.slug, input.reviewId);
  const required = review.items[0]?.rubric.dimensions.map((dimension) => dimension.id) ?? ["substance", "clarity"];
  const scored = manualBasisPoints(input.ratings, required);
  if (!scored) throw new Error("Score every required dimension from 0 to 4.");
  const sql = await db();
  const tasks = await sql<{ attempt_id: string; application_id: string }>`
    select attempt_id, application_id from review_tasks
    where id = ${input.reviewId} and company_id = ${actor.companyId} and status = 'OPEN'
  `;
  if (!tasks[0]) throw new Error("This review is already submitted.");
  await sql`
    update review_tasks set status = 'SUBMITTED', ratings = ${json(input.ratings)}::jsonb,
      notes = ${input.notes.slice(0, 4000)}, submitted_at = now(), assignee_user_id = ${actor.userId}
    where id = ${input.reviewId}
  `;
  const earned = scored.earned;
  const possible = scored.possible;
  const revisionRows = await sql<{ n: number }>`
    select coalesce(max(revision), 0) as n from evaluations where attempt_id = ${tasks[0].attempt_id}
  `;
  await sql`
    insert into evaluations (
      id, company_id, attempt_id, revision, origin, status, basis_points, raw, created_by, reason
    ) values (
      ${nid()}, ${actor.companyId}, ${tasks[0].attempt_id}, ${Number(revisionRows[0]?.n ?? 0) + 1},
      'MANUAL', 'FINAL', ${scored.basisPoints},
      ${json({ ratings: input.ratings, earned, possible })}::jsonb, ${actor.userId}, ${"Human review"}
    )
  `;
  await sql`update attempts set status = 'COMPLETED' where id = ${tasks[0].attempt_id}`;
  await rememberEvent(actor.companyId, "REVIEW_COMPLETED", input.reviewId, {
    applicationId: tasks[0].application_id,
    attemptId: tasks[0].attempt_id,
    scoreStatus: "FINAL",
  });
  await audit(actor, "review.submit", "review", input.reviewId, "Review submitted.");
  try {
    const { advanceJob } = await import("./ladder.server");
    const jobs = await sql<{ job_id: string }>`
      select a.job_id from attempts t
      join assignments g on g.id = t.assignment_id
      join applications a on a.id = g.application_id
      where t.id = ${tasks[0].attempt_id} and t.company_id = ${actor.companyId}
    `;
    if (jobs[0]) await advanceJob(actor.companyId, jobs[0].job_id);
  } catch {
    // The review is already stored. Opening the pipeline ranks again.
  }
  return { ok: true };
}

export async function extendAttempt(
  userId: string,
  input: { slug: string; attemptId: string; extraSeconds: number; reason: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.assign");
  if (!input.reason.trim()) throw new Error("A reason is required.");
  const sql = await db();
  const rows = await sql<{ status: string; deadline: string; hard_finish_by: string | null }>`
    select t.status, t.deadline::text as deadline, g.hard_finish_by::text as hard_finish_by
    from attempts t
    join assignments g on g.id = t.assignment_id and g.company_id = t.company_id
    where t.id = ${input.attemptId} and t.company_id = ${actor.companyId}
  `;
  const attempt = rows[0];
  if (!attempt) throw new Error("Not found.");
  const next = planExtension({
    status: attempt.status,
    deadline: new Date(attempt.deadline),
    extraSeconds: input.extraSeconds,
    hardFinishBy: attempt.hard_finish_by ? new Date(attempt.hard_finish_by) : null,
  });
  const updated = await sql`
    update attempts set deadline = ${next.toISOString()}
    where id = ${input.attemptId} and company_id = ${actor.companyId} and status = 'IN_PROGRESS'
    returning id
  `;
  if (!updated[0]) throw new Error("The attempt was closed before the extension was saved.");
  await sql`
    insert into attempt_extensions (id, company_id, attempt_id, previous_deadline, deadline, reason, actor_user_id)
    values (
      ${nid()}, ${actor.companyId}, ${input.attemptId}, ${attempt.deadline}, ${next.toISOString()},
      ${input.reason.slice(0, 400)}, ${actor.userId}
    )
  `;
  await audit(actor, "attempt.extend", "attempt", input.attemptId, "Deadline extended.");
  return { deadline: next.toISOString() };
}

export async function importExternalScore(
  userId: string,
  input: { slug: string; attemptId: string; provider: string; raw: string; scaleMin: string; scaleMax: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "evaluation.grade");
  const mapped = mapExternalScore(input);
  const sql = await db();
  const attempts = await sql`select id from attempts where id = ${input.attemptId} and company_id = ${actor.companyId}`;
  if (!attempts[0]) throw new Error("Not found.");
  const revisionRows = await sql<{ n: number }>`
    select coalesce(max(revision), 0) as n from evaluations where attempt_id = ${input.attemptId}
  `;
  await sql`
    insert into evaluations (
      id, company_id, attempt_id, revision, origin, status, basis_points, raw, created_by, reason
    ) values (
      ${nid()}, ${actor.companyId}, ${input.attemptId}, ${Number(revisionRows[0]?.n ?? 0) + 1},
      'EXTERNAL', ${mapped.status}, ${mapped.basisPoints},
      ${json({ provider: input.provider.slice(0, 80), raw: input.raw, scaleMin: input.scaleMin, scaleMax: input.scaleMax })}::jsonb,
      ${actor.userId}, ${"External result imported with its original scale."}
    )
  `;
  return { status: mapped.status, basisPoints: mapped.basisPoints };
}

export async function exportMine(userId: string) {
  const sql = await db();
  const rows = await sql<{ job_title: string; company_name: string; lifecycle: string; submitted_at: string }>`
    select j.title as job_title, co.name as company_name, a.lifecycle,
      to_char(a.submitted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as submitted_at
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join jobs j on j.id = a.job_id
    join companies co on co.id = a.company_id
    join lateral app_user_identity(${userId}) u on true
    where c.user_id = ${userId} or (lower(c.email) = lower(u.email) and u.email_verified = true)
  `;
  const applications = rows.map((row) => ({
    jobTitle: row.job_title,
    companyName: row.company_name,
    lifecycle: row.lifecycle,
    submittedAt: row.submitted_at,
  }));
  return { exportedAt: new Date().toISOString(), ...candidateExportPayload(applications) };
}

export async function archiveAssessment(userId: string, input: { slug: string; assessmentId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.publish");
  const sql = await db();
  const updated = await sql`
    update assessments set archived = true
    where id = ${input.assessmentId} and company_id = ${actor.companyId}
    returning id
  `;
  if (!updated[0]) throw new Error("Not found.");
  return { ok: true };
}

export async function sampleRun(userId: string, attemptId: string) {
  const { attempt } = await loadOwnedAttempt(userId, attemptId);
  enterTenant({ companyId: attempt.company_id, userId, publicSlug: "" });
  const sql = await db();
  const rows = await sql<{ answer: { text?: string } | null }>`
    select r.answer
    from attempt_items i
    join question_versions v on v.id = i.question_version_id
    join questions q on q.id = v.question_id
    left join responses r on r.attempt_item_id = i.id
    where i.attempt_id = ${attemptId} and i.company_id = ${attempt.company_id} and q.type = 'code'
    order by i.position
    limit 1
  `;
  const { runIsolated } = await import("./runner.server");
  const { sandboxForAttempt } = await import("./ops.server");
  const sandbox = await sandboxForAttempt(attempt.company_id, attemptId);
  const result = await runIsolated(rows[0]?.answer?.text ?? "", sandbox
    ? { timeoutMs: Number(sandbox.timeout_ms), maxOutputChars: Number(sandbox.max_output_chars) }
    : undefined);
  const sandboxNote = sandbox
    ? ` Sandbox "${sandbox.name}": ${sandbox.timeout_ms} ms, ${sandbox.max_output_chars} characters, network denied, filesystem denied.`
    : " Default sandbox: 1500 ms, 4000 characters, network denied, filesystem denied.";
  await sql`
    insert into code_runs (id, company_id, attempt_id, status, truncated, timed_out, output_excerpt)
    values (
      ${nid()}, ${attempt.company_id}, ${attemptId}, ${result.status},
      ${result.truncated}, ${result.timedOut}, ${result.outputExcerpt.slice(0, 8000)}
    )
  `;
  return { ...result, reason: `${result.reason}${sandboxNote}` };
}

const DEMO_CODE = [
  {
    label: "linear",
    source: `function deduplicateEvents(events, windowMs) {
  const last = new Map();
  const kept = [];
  for (const event of events) {
    const previous = last.get(event.id);
    if (previous !== undefined && event.timestampMs - previous <= windowMs) continue;
    last.set(event.id, event.timestampMs);
    kept.push(event);
  }
  return kept;
}`,
  },
  {
    label: "quadratic",
    source: `function deduplicateEvents(events, windowMs) {
  const kept = [];
  for (const event of events) {
    let drop = false;
    for (let i = 0; i < kept.length; i++) {
      const prev = kept[i];
      if (prev.id === event.id && event.timestampMs - prev.timestampMs <= windowMs) drop = true;
    }
    if (!drop) kept.push(event);
  }
  return kept;
}`,
  },
  {
    label: "constant",
    source: "function deduplicateEvents(events) { return events; }",
  },
] as const;

type CodeRow = {
  attempt_item_id: string;
  attempt_id: string;
  application_id: string;
  candidate_name: string;
  logical_key: string;
  prompt: string;
  key_payload: unknown;
  answer: { text?: string } | null;
  judge_status: string | null;
  passed: number | null;
  total: number | null;
  time_class: string | null;
  space_class: string | null;
  measured_ms: number | null;
  basis_points: number | null;
  reasons: unknown;
};

function answerText(answer: { text?: string } | null): string {
  return typeof answer?.text === "string" ? answer.text : "";
}

function entryHint(key: unknown): string | null {
  if (!key || typeof key !== "object") return null;
  const entry = (key as { entry?: unknown }).entry;
  return typeof entry === "string" ? entry : null;
}

function asTime(value: string | null | undefined): TimeClass {
  return (TIME_CLASSES as readonly string[]).includes(value ?? "") ? (value as TimeClass) : "unknown";
}

function asSpace(value: string | null | undefined): SpaceClass {
  return (SPACE_CLASSES as readonly string[]).includes(value ?? "") ? (value as SpaceClass) : "unknown";
}

function reasonList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 4);
}

async function loadCodeRows(companyId: string): Promise<CodeRow[]> {
  const sql = await db();
  return sql<CodeRow>`
    select i.id as attempt_item_id, t.id as attempt_id, a.id as application_id, c.name as candidate_name,
      q.logical_key, v.prompt, v.key_payload, r.answer,
      j.status as judge_status, j.passed, j.total, j.time_class, j.space_class,
      j.measured_ms, j.basis_points, j.reasons
    from attempt_items i
    join attempts t on t.id = i.attempt_id and t.company_id = i.company_id
    join assignments g on g.id = t.assignment_id and g.company_id = t.company_id
    join applications a on a.id = g.application_id and a.company_id = g.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join question_versions v on v.id = i.question_version_id and v.company_id = i.company_id
    join questions q on q.id = v.question_id and q.company_id = v.company_id
    left join responses r on r.attempt_item_id = i.id and r.company_id = i.company_id
    left join code_judgements j on j.attempt_item_id = i.id and j.company_id = i.company_id
    where i.company_id = ${companyId}
      and q.type = 'code'
      and t.status in ('SUBMITTED', 'AWAITING_REVIEW', 'COMPLETED', 'GRADING')
    order by c.name
    limit 80
  `;
}

async function ensureDemoSamples(companyId: string) {
  const sql = await db();
  const found = await sql<{ version_id: string; section_id: string; question_version_id: string }>`
    select s.version_id, i.section_id, v.id as question_version_id
    from questions q
    join question_versions v on v.question_id = q.id and v.company_id = q.company_id
    join assessment_items i on i.question_version_id = v.id and i.company_id = v.company_id
    join assessment_sections s on s.id = i.section_id and s.company_id = i.company_id
    where q.company_id = ${companyId} and q.logical_key = 'dedupe' and q.type = 'code'
    limit 1
  `;
  const question = found[0];
  if (!question) return;
  const apps = await sql<{ id: string }>`
    select id from applications
    where company_id = ${companyId} and lifecycle = 'ACTIVE'
    order by submitted_at
    limit 3
  `;
  for (let index = 0; index < apps.length && index < DEMO_CODE.length; index += 1) {
    const sample = DEMO_CODE[index]!;
    const app = apps[index]!;
    const assignmentId = sha256(`${companyId}:code-rank:${sample.label}:assignment`).slice(0, 24);
    const attemptId = sha256(`${companyId}:code-rank:${sample.label}:attempt`).slice(0, 24);
    const itemId = sha256(`${companyId}:code-rank:${sample.label}:item`).slice(0, 24);
    const responseId = sha256(`${companyId}:code-rank:${sample.label}:response`).slice(0, 24);
    const reviewId = sha256(`${companyId}:code-rank:${sample.label}:review`).slice(0, 24);
    await sql`
      insert into assignments (
        id, company_id, application_id, assessment_version_id, status, start_by, duration_seconds
      ) values (
        ${assignmentId}, ${companyId}, ${app.id}, ${question.version_id}, 'COMPLETED',
        '2026-06-01T15:00:00.000Z', 5400
      )
      on conflict (id) do nothing
    `;
    await sql`
      insert into attempts (
        id, company_id, assignment_id, ordinal, status, started_at, deadline, submitted_at, submission_reason
      ) values (
        ${attemptId}, ${companyId}, ${assignmentId}, 1, 'AWAITING_REVIEW',
        '2026-06-10T15:00:00.000Z', '2026-06-10T16:30:00.000Z', '2026-06-10T15:20:00.000Z', 'MANUAL'
      )
      on conflict (id) do nothing
    `;
    await sql`
      insert into attempt_items (
        id, company_id, attempt_id, question_version_id, section_id, position, points, option_order
      ) values (
        ${itemId}, ${companyId}, ${attemptId}, ${question.question_version_id}, ${question.section_id},
        0, 1, '[]'::jsonb
      )
      on conflict (id) do nothing
    `;
    await sql`
      insert into responses (id, company_id, attempt_item_id, answer, revision)
      values (${responseId}, ${companyId}, ${itemId}, ${json({ text: sample.source })}::jsonb, 1)
      on conflict (id) do nothing
    `;
    await sql`
      insert into review_tasks (id, company_id, attempt_id, application_id, status)
      values (${reviewId}, ${companyId}, ${attemptId}, ${app.id}, 'OPEN')
      on conflict (id) do nothing
    `;
  }
}

async function saveJudgement(input: {
  companyId: string;
  attemptId: string;
  attemptItemId: string;
  status: "JUDGED" | "TIMED_OUT" | "FAILED" | "REFUSED";
  passed: number | null;
  total: number | null;
  timeClass: TimeClass;
  spaceClass: SpaceClass;
  measuredMs: number | null;
  basisPoints: number | null;
  reasons: string[];
}) {
  const sql = await db();
  await sql`
    insert into code_judgements (
      id, company_id, attempt_id, attempt_item_id, status, passed, total,
      time_class, space_class, measured_ms, basis_points, reasons
    ) values (
      ${nid()}, ${input.companyId}, ${input.attemptId}, ${input.attemptItemId}, ${input.status},
      ${input.passed}, ${input.total}, ${input.timeClass}, ${input.spaceClass}, ${input.measuredMs},
      ${input.basisPoints}, ${json(input.reasons)}::jsonb
    )
    on conflict (company_id, attempt_item_id) do update set
      status = excluded.status,
      passed = excluded.passed,
      total = excluded.total,
      time_class = excluded.time_class,
      space_class = excluded.space_class,
      measured_ms = excluded.measured_ms,
      basis_points = excluded.basis_points,
      reasons = excluded.reasons,
      created_at = now()
  `;
}

async function judgeOne(companyId: string, row: CodeRow) {
  const source = answerText(row.answer);
  const estimate = estimateComplexity(source);
  const entry = codeEntry(source, entryHint(row.key_payload));
  const cases = casesForQuestion({ logicalKey: row.logical_key, prompt: row.prompt, entry });
  const blank = {
    companyId,
    attemptId: row.attempt_id,
    attemptItemId: row.attempt_item_id,
    timeClass: estimate.timeClass,
    spaceClass: estimate.spaceClass,
    reasons: estimate.reasons,
    measuredMs: null,
    basisPoints: null,
    passed: null as number | null,
    total: cases.length > 0 ? cases.length : null,
  };
  if (!source.trim() || !entry) {
    await saveJudgement({ ...blank, status: "REFUSED" });
    return;
  }
  if (cases.length === 0) {
    await saveJudgement({ ...blank, status: "JUDGED", total: null });
    return;
  }
  const { judgeIsolated } = await import("./runner.server");
  const run = await judgeIsolated(source, entry, cases.map((item) => item.args));
  if (run.status !== "JUDGED" || run.results.length !== cases.length) {
    const status = run.status === "TIMED_OUT" ? "TIMED_OUT" : (run.status === "REFUSED" || run.status === "INFRA" ? "REFUSED" : "FAILED");
    await saveJudgement({ ...blank, status });
    return;
  }
  let passed = 0;
  for (let index = 0; index < cases.length; index += 1) {
    const result = run.results[index];
    if (result && !result.error && answersMatch(result.value, cases[index]?.expected)) passed += 1;
  }
  const last = run.results[run.results.length - 1]?.ms;
  const measuredMs = typeof last === "number" && last >= 0 ? Math.min(60_000, Math.round(last)) : null;
  const score = codeJudgeScore({
    passed,
    total: cases.length,
    timeClass: estimate.timeClass,
    measuredMs,
  });
  await saveJudgement({
    ...blank,
    status: "JUDGED",
    passed,
    total: cases.length,
    measuredMs,
    basisPoints: score.basisPoints,
    reasons: [...estimate.reasons, score.reason].slice(0, 4),
  });
}

function boardFrom(rows: CodeRow[]) {
  const groups = new Map<string, CodeRow[]>();
  for (const row of rows) {
    const list = groups.get(row.logical_key) ?? [];
    list.push(row);
    groups.set(row.logical_key, list);
  }
  return [...groups.entries()].map(([questionKey, list]) => {
    const facts: (RankRow & { row: CodeRow; reasons: string[] })[] = list.map((row) => {
      const source = answerText(row.answer);
      const estimate = estimateComplexity(source);
      const judged = row.judge_status === "JUDGED" || row.judge_status === "TIMED_OUT" || row.judge_status === "FAILED" || row.judge_status === "REFUSED";
      return {
        row,
        id: row.attempt_item_id,
        status: judged ? (row.judge_status as RankRow["status"]) : "ESTIMATE",
        passed: judged ? row.passed : null,
        total: judged ? row.total : null,
        timeClass: judged ? asTime(row.time_class) : estimate.timeClass,
        spaceClass: judged ? asSpace(row.space_class) : estimate.spaceClass,
        measuredMs: judged ? row.measured_ms : null,
        basisPoints: judged ? row.basis_points : null,
        reasons: judged ? reasonList(row.reasons) : estimate.reasons,
      };
    });
    const ranked = rankCodeResponses(facts);
    const title = (list[0]?.prompt ?? "Code").split("\n")[0]?.slice(0, 90) ?? "Code";
    return {
      questionKey,
      title,
      rows: ranked.map((item) => ({
        rank: item.rank,
        candidateName: item.row.candidate_name,
        timeClass: item.timeClass,
        spaceClass: item.spaceClass,
        reasons: item.reasons,
        passed: item.passed,
        total: item.total,
        measuredMs: item.measuredMs,
        basisPoints: item.basisPoints,
        status: item.status,
        excerpt: answerText(item.row.answer).slice(0, 220),
      })),
    };
  });
}

export async function listCodeBoard(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  let rows = await loadCodeRows(actor.companyId);
  if (rows.length === 0 && actor.demo) {
    await ensureDemoSamples(actor.companyId);
    rows = await loadCodeRows(actor.companyId);
  }
  const pending = rows.filter((row) => !row.judge_status);
  if (actor.demo && rows.length > 0 && rows.length <= 3 && pending.length === rows.length) {
    for (const row of pending) await judgeOne(actor.companyId, row);
    rows = await loadCodeRows(actor.companyId);
  }
  return {
    note: "Correct answers are ordered by estimated time class, then space class, then measured time on the largest case. The class is read from the source. It is not a proof. A wrong answer does not outrank a correct one. A timeout is not scored as zero. The human rubric is separate.",
    groups: boardFrom(rows),
  };
}

export async function judgeCodeBoard(userId: string, slug: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const rows = await loadCodeRows(actor.companyId);
  const pending = rows.filter((row) => !row.judge_status).slice(0, 8);
  for (const row of pending) await judgeOne(actor.companyId, row);
  await audit(actor, "evaluation.grade", "code_judgement", actor.companyId, "Judged code submissions.");
  return {
    judged: pending.length,
    remaining: Math.max(0, rows.filter((row) => !row.judge_status).length - pending.length),
  };
}
