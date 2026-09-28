import { createHash } from "node:crypto";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import {
  extractResumeText,
  screenResume,
  termsFromJson,
} from "@/domain/screen";
import { allow, audit, db, json, nid, requireActor } from "./db.server";
import { rememberEvent } from "./workflows.server";

const GOOD_CV = "Amina Okonkwo. Software engineer. I have shipped production services in TypeScript for six years. I design PostgreSQL schemas and write SQL for reporting. I also use React for internal tools.";
const WEAK_CV = "Jonah Hale. Retail supervisor. I managed a store team, scheduled shifts, and handled customer complaints. I use spreadsheets for the weekly roster. I have not worked in software.";

function demoId(companyId: string, name: string) {
  return createHash("sha256").update(`${companyId}:cv-screen:${name}`).digest("hex").slice(0, 24);
}

export async function ensureDemoCvSamples(companyId: string) {
  const sql = await db();
  const companies = await sql<{ demo: boolean }>`select demo from companies where id = ${companyId}`;
  if (!companies[0]?.demo) return;
  const goodApp = demoId(companyId, "good-app");
  const weakApp = demoId(companyId, "weak-app");
  const ready = await sql<{ application_id: string }>`
    select application_id from cv_screens
    where company_id = ${companyId} and application_id in (${goodApp}, ${weakApp})
  `;
  if (ready.length >= 2) return;

  const jobs = await sql<{ id: string; screen_required: unknown; stage_id: string | null }>`
    select j.id, j.screen_required,
      (
        select s.id from pipeline_stages s
        where s.job_id = j.id and s.company_id = j.company_id and s.category = 'APPLIED' and s.archived = false
        order by s.position limit 1
      ) as stage_id
    from jobs j
    where j.company_id = ${companyId} and j.slug = 'senior-software-engineer-platform'
    limit 1
  `;
  const job = jobs[0];
  if (!job?.stage_id) return;
  const tests = await sql<{ id: string }>`
    select id from assessments
    where company_id = ${companyId} and name = 'Senior Platform Engineering Exercise'
    limit 1
  `;
  const assessmentId = tests[0]?.id ?? null;
  if (termsFromJson(job.screen_required).length === 0) {
    await sql`
      update jobs set
        screen_required = ${json(["TypeScript", "SQL", "PostgreSQL"])}::jsonb,
        screen_preferred = ${json(["React"])}::jsonb,
        screen_assessment_id = ${assessmentId}
      where id = ${job.id} and company_id = ${companyId}
    `;
  }

  const have = new Set(ready.map((row) => row.application_id));
  if (!have.has(goodApp)) {
    await insertDemoApplicant(companyId, job.id, job.stage_id, "good", "Amina Okonkwo", "amina.okonkwo.screen@northstar.example", GOOD_CV);
  }
  if (!have.has(weakApp)) {
    await insertDemoApplicant(companyId, job.id, job.stage_id, "weak", "Jonah Hale", "jonah.hale.screen@northstar.example", WEAK_CV);
  }
}

async function insertDemoApplicant(
  companyId: string,
  jobId: string,
  stageId: string,
  key: string,
  name: string,
  email: string,
  text: string,
) {
  const sql = await db();
  const candidateId = demoId(companyId, `${key}-cand`);
  const applicationId = demoId(companyId, `${key}-app`);
  const fileId = demoId(companyId, `${key}-file`);
  await sql`
    insert into candidates (id, company_id, name, email, email_normalized, source)
    values (${candidateId}, ${companyId}, ${name}, ${email}, ${email}, 'CAREERS')
    on conflict (company_id, email_normalized) do nothing
  `;
  const candidate = await sql<{ id: string }>`
    select id from candidates where company_id = ${companyId} and email_normalized = ${email}
  `;
  if (!candidate[0]) return;
  await sql`
    insert into applications (id, company_id, job_id, candidate_id, current_stage_id, lifecycle, source)
    values (${applicationId}, ${companyId}, ${jobId}, ${candidate[0].id}, ${stageId}, 'ACTIVE', 'CAREERS')
    on conflict do nothing
  `;
  const stored = await sql<{ id: string }>`
    select id from applications where id = ${applicationId} and company_id = ${companyId}
  `;
  if (!stored[0]) return;
  await sql`
    insert into file_objects (
      id, company_id, owner_scope, owner_id, display_name, mime, size_bytes, content, scan_state, scan_note
    ) values (
      ${fileId}, ${companyId}, 'application', ${applicationId}, ${`${key}-cv.txt`}, 'text/plain',
      ${text.length}, ${Buffer.from(text).toString("base64")}, 'CLEAN',
      'Local demo scanner. Not a commercial antivirus.'
    )
    on conflict do nothing
  `;
  await sql`
    insert into stage_events (id, company_id, application_id, to_stage_id, to_lifecycle, reason)
    values (${demoId(companyId, `${key}-event`)}, ${companyId}, ${applicationId}, ${stageId}, 'ACTIVE', 'Application submitted')
    on conflict do nothing
  `;
  await runCvScreen({ companyId, applicationId, actorUserId: null });
}

export async function rescreenCv(userId: string, input: { slug: string; applicationId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.assign");
  return runCvScreen({ companyId: actor.companyId, applicationId: input.applicationId, actorUserId: actor.userId });
}

export async function runCvScreen(input: { companyId: string; applicationId: string; actorUserId: string | null }) {
  const sql = await db();
  const apps = await sql<{
    id: string;
    lifecycle: string;
    job_id: string;
    stage_id: string;
    email: string;
    required: unknown;
    preferred: unknown;
    assessment_id: string | null;
  }>`
    select a.id, a.lifecycle, a.job_id, a.current_stage_id as stage_id, c.email,
      j.screen_required as required, j.screen_preferred as preferred, j.screen_assessment_id as assessment_id
    from applications a
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    where a.id = ${input.applicationId} and a.company_id = ${input.companyId}
  `;
  const app = apps[0];
  if (!app) throw new Error("Not found.");

  const files = await sql<{ id: string; mime: string; content: string; scan_state: string }>`
    select id, mime, content, scan_state from file_objects
    where company_id = ${input.companyId} and owner_id = ${input.applicationId}
    order by created_at desc
    limit 1
  `;
  const file = files[0];
  const scanState = !file ? "MISSING" : file.scan_state === "CLEAN" || file.scan_state === "INFECTED" || file.scan_state === "QUARANTINE"
    ? file.scan_state
    : "QUARANTINE";
  const extracted = file && scanState === "CLEAN"
    ? extractResumeText(file.mime, Buffer.from(file.content, "base64"))
    : { text: null, readable: false, note: "" };

  const published = app.assessment_id
    ? await sql<{ id: string; duration_seconds: number; name: string }>`
        select v.id, v.duration_seconds, s.name
        from assessment_versions v
        join assessments s on s.id = v.assessment_id and s.company_id = v.company_id
        where v.assessment_id = ${app.assessment_id} and v.company_id = ${input.companyId} and v.status = 'PUBLISHED'
        order by v.version_number desc
        limit 1
      `
    : [];

  const decision = screenResume({
    text: extracted.text,
    readable: extracted.readable,
    scanState,
    required: termsFromJson(app.required),
    preferred: termsFromJson(app.preferred),
    hasAssessment: Boolean(published[0]),
  });
  if (extracted.note && scanState === "CLEAN") decision.reasons.unshift(extracted.note);

  const prior = await sql<{ assignment_id: string | null }>`
    select assignment_id from cv_screens where company_id = ${input.companyId} and application_id = ${app.id}
  `;
  let assignmentId = prior[0]?.assignment_id ?? null;
  if (decision.action === "SEND" && published[0] && app.lifecycle === "ACTIVE") {
    assignmentId = await sendAssessment(input.companyId, app, published[0], input.actorUserId) ?? assignmentId;
  } else if (assignmentId && decision.action === "DO_NOT_SEND") {
    decision.reasons.push("An assessment already sent was not withdrawn.");
  }

  const screenId = nid();
  await sql`
    insert into cv_screens (
      id, company_id, application_id, file_id, fit, action,
      matched_required, missing_required, matched_preferred, reasons, assignment_id
    ) values (
      ${screenId}, ${input.companyId}, ${app.id}, ${file?.id ?? null}, ${decision.fit}, ${decision.action},
      ${json(decision.matchedRequired)}::jsonb, ${json(decision.missingRequired)}::jsonb,
      ${json(decision.matchedPreferred)}::jsonb, ${json(decision.reasons)}::jsonb, ${assignmentId}
    )
    on conflict (company_id, application_id) do update set
      file_id = excluded.file_id,
      fit = excluded.fit,
      action = excluded.action,
      matched_required = excluded.matched_required,
      missing_required = excluded.missing_required,
      matched_preferred = excluded.matched_preferred,
      reasons = excluded.reasons,
      assignment_id = excluded.assignment_id,
      created_at = now()
  `;
  await sql`
    insert into stage_events (id, company_id, application_id, to_stage_id, to_lifecycle, actor_user_id, reason)
    values (
      ${nid()}, ${input.companyId}, ${app.id}, ${app.stage_id}, ${app.lifecycle}, ${input.actorUserId},
      ${decision.action === "SEND" ? "CV screen: good fit, assessment sent." : `CV screen: ${decision.fit === "NOT_A_FIT" ? "not a fit" : "needs a person"}, assessment not sent.`}
    )
  `;
  await audit(
    { companyId: input.companyId, userId: input.actorUserId },
    "cv.screen",
    "application",
    app.id,
    decision.action === "SEND" ? "CV screen sent the assessment." : "CV screen did not send an assessment.",
  );
  return decision;
}

async function sendAssessment(
  companyId: string,
  app: { id: string; email: string },
  version: { id: string; duration_seconds: number; name: string },
  actorUserId: string | null,
) {
  const sql = await db();
  const existing = await sql<{ id: string }>`
    select id from assignments
    where company_id = ${companyId} and application_id = ${app.id} and assessment_version_id = ${version.id}
    limit 1
  `;
  if (existing[0]) return existing[0].id;
  const id = nid();
  const startBy = new Date(Date.now() + 14 * 86400000).toISOString();
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by,
      duration_seconds, multiplier_basis_points, extra_seconds
    ) values (
      ${id}, ${companyId}, ${app.id}, ${version.id}, 'INVITED', ${startBy},
      ${version.duration_seconds}, 10000, 0
    )
  `;
  await sql`
    insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
    values (
      ${nid()}, ${companyId}, ${app.email},
      ${"Assessment: " + version.name},
      ${"Your CV matched the must-have skills for this role. The assessment is in the candidate portal. Opening this message does not start the timer. This message was captured inside RECRUIT4US and was not delivered."},
      'CAPTURED', ${id}
    )
  `;
  await rememberEvent(companyId, "ASSESSMENT_ASSIGNED", id, { applicationId: app.id, assignmentId: id, source: "cv_screen" });
  await audit({ companyId, userId: actorUserId }, "assessment.assign", "assignment", id, "CV screen assigned the assessment.");
  return id;
}
