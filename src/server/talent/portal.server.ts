import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { normalizeEmail } from "@/domain/rules";
import { stageNameList, trackBar } from "@/domain/sheet";
import { runnerAvailability } from "@/domain/edge";
import {
  applicationIdGateHint,
  assessmentInvitePath,
  normalizeApplicationId,
} from "@/domain/assessment-invite";
import { applicationPortalPath } from "@/domain/application-portal";
import { mintPortalAccess, verifyPortalAccess } from "@/domain/application-portal-access";
import { mintAssessAccess } from "@/domain/assessment-invite-access";
import { enterTenant } from "@/lib/tenant";
import { env } from "@/lib/env.server";
import { db, nid } from "./db.server";
import { mailText } from "@/domain/mail";

function portalAccessSecret(): string {
  return (env("BETTER_AUTH_SECRET") ?? process.env.BETTER_AUTH_SECRET ?? "recruit4us-dev-assess-access").trim();
}

async function loadApplicationGate(applicationId: string) {
  const sql = await db();
  const found = await sql.query<{
    company_id: string;
    email_normalized: string;
    candidate_name: string;
  }>("select company_id, email_normalized, candidate_name from app_application_gate($1)", [
    applicationId,
  ]);
  const row = found[0];
  if (!row?.company_id) throw new Error("No application matches that id.");
  return row;
}

async function requirePortalAccess(applicationId: string, accessToken: string) {
  const verified = verifyPortalAccess(accessToken, applicationId, portalAccessSecret());
  if (!verified.ok) {
    throw new Error("This portal link expired or is not valid. Unlock again with your email and application id.");
  }
  const gate = await loadApplicationGate(applicationId);
  if (gate.company_id !== verified.companyId) {
    throw new Error("This portal link expired or is not valid. Unlock again with your email and application id.");
  }
  enterTenant({ companyId: gate.company_id, publicSlug: "" });
  return { companyId: gate.company_id, email: gate.email_normalized, name: gate.candidate_name };
}

/**
 * Gate: email + application id must match. Returns a short-lived portal access proof (no Better Auth).
 */
export async function openApplicationPortal(input: { email: string; applicationId: string }) {
  assertSameSiteRequest();
  const email = normalizeEmail(input.email);
  const applicationId = normalizeApplicationId(input.applicationId);
  const idHint = applicationIdGateHint(applicationId);
  if (idHint) throw new Error(idHint);
  if (!email.includes("@")) {
    throw new Error("Enter the application email and application id.");
  }
  const gate = await loadApplicationGate(applicationId);
  if (normalizeEmail(gate.email_normalized) !== email) {
    throw new Error(
      "That email and application id do not match. Use the exact email from your application and the full 36-character application id.",
    );
  }
  enterTenant({ companyId: gate.company_id, publicSlug: "" });
  const accessToken = mintPortalAccess({
    applicationId,
    companyId: gate.company_id,
    secret: portalAccessSecret(),
  });
  return {
    applicationId,
    accessToken,
    portalPath: applicationPortalPath(),
    candidateName: gate.candidate_name,
  };
}

export async function getPortalApplication(applicationId: string, accessToken: string) {
  const owned = await requirePortalAccess(applicationId, accessToken);
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
    where a.id = ${applicationId} and a.company_id = ${owned.companyId}
  `;
  const application = rows[0];
  if (!application) throw new Error("Not found.");
  const bar = trackBar({
    stages: stageNameList(application.stages),
    stageName: application.stage_name,
    category: application.category,
    lifecycle: application.lifecycle,
  });
  const assignments = await sql<{
    id: string;
    status: string;
    name: string;
    duration_seconds: number;
    instructions: string;
    proctored: boolean | string;
    invite_token: string;
    start_by: string;
    active_attempt: string | null;
  }>`
    select g.id, g.status, s.name, v.duration_seconds, v.instructions, v.proctored, g.invite_token,
      to_char(g.start_by at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as start_by,
      (select t.id from attempts t
        where t.assignment_id = g.id and t.status in ('NOT_STARTED', 'IN_PROGRESS')
        order by t.ordinal desc limit 1) as active_attempt
    from assignments g
    join assessment_versions v on v.id = g.assessment_version_id
    join assessments s on s.id = v.assessment_id
    where g.application_id = ${applicationId} and g.company_id = ${owned.companyId}
    order by g.start_by
  `;
  const offers = await sql<{
    id: string;
    status: string;
    current_revision: number;
    title: string;
    salary_minor: number;
    currency: string;
    start_date: string | null;
    message: string;
  }>`
    select o.id, o.status, o.current_revision, r.title, r.salary_minor, r.currency, r.start_date::text as start_date, r.message
    from offers o
    join offer_revisions r on r.offer_id = o.id and r.revision = o.current_revision
    where o.application_id = ${applicationId} and o.company_id = ${owned.companyId}
      and o.status in ('SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')
  `;
  const interviews = await sql<{
    id: string;
    title: string;
    status: string;
    timezone: string;
    location: string;
    meeting_url: string;
    starts_at: string;
    ends_at: string;
  }>`
    select id, title, status, timezone, location, meeting_url,
      to_char(starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as starts_at,
      to_char(ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ends_at
    from interviews
    where application_id = ${applicationId} and company_id = ${owned.companyId} and status <> 'CANCELLED'
    order by starts_at
  `;
  const messages = await sql<{
    id: string;
    subject: string;
    body: string;
    from_name: string;
    author: string;
    company_name: string;
    mail_from_name: string;
    mail_footer: string;
    accent: string;
    at: string;
  }>`
    select m.id, m.subject, m.body, m.from_name, m.author,
      co.name as company_name, co.mail_from_name, co.mail_footer, co.embed_accent as accent,
      to_char(m.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from mail_messages m
    join companies co on co.id = m.company_id
    where m.company_id = ${owned.companyId} and m.application_id = ${applicationId}
      and (
        (m.author = 'STAFF' and lower(m.to_email) = lower(${owned.email}))
        or (m.author = 'CANDIDATE' and lower(m.from_email) = lower(${owned.email}))
      )
    order by m.created_at
  `;
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
    assignments: assignments.map((item) => ({
      ...item,
      invitePath: item.invite_token ? assessmentInvitePath(item.invite_token) : null,
    })),
    offers,
    interviews,
    messages,
    runner: runnerAvailability(),
  };
}

/** Start or resume an assignment under portal guest access; returns assess attempt access. */
export async function openPortalAssignment(input: {
  applicationId: string;
  accessToken: string;
  assignmentId: string;
}) {
  assertSameSiteRequest();
  const owned = await requirePortalAccess(input.applicationId, input.accessToken);
  const sql = await db();
  const rows = await sql<{ id: string; status: string }>`
    select id, status from assignments
    where id = ${input.assignmentId}
      and application_id = ${input.applicationId}
      and company_id = ${owned.companyId}
  `;
  const assignment = rows[0];
  if (!assignment) throw new Error("That assessment is not on this application.");
  if (assignment.status === "CANCELLED" || assignment.status === "EXPIRED" || assignment.status === "COMPLETED") {
    throw new Error(
      assignment.status === "COMPLETED"
        ? "This assessment is already completed."
        : "This assessment is no longer available.",
    );
  }
  const { startAttemptForAssignment } = await import("./assess.server");
  const started = await startAttemptForAssignment(owned.companyId, assignment.id, null);
  const accessToken = mintAssessAccess({
    attemptId: started.attemptId,
    assignmentId: assignment.id,
    secret: portalAccessSecret(),
  });
  return {
    attemptId: started.attemptId,
    assignmentId: assignment.id,
    created: started.created,
    accessToken,
  };
}

export async function replyPortalMail(input: {
  applicationId: string;
  accessToken: string;
  body: string;
}) {
  assertSameSiteRequest();
  const owned = await requirePortalAccess(input.applicationId, input.accessToken);
  const text = mailText(input.body, 2, 4000, "Reply");
  if ("error" in text) throw new Error(text.error);
  const sql = await db();
  const previous = await sql<{ from_email: string; subject: string }>`
    select from_email, subject from mail_messages
    where company_id = ${owned.companyId} and application_id = ${input.applicationId}
      and author = 'STAFF' and from_email <> ''
    order by created_at desc
    limit 1
  `;
  const staff = previous[0];
  if (!staff) throw new Error("A recruiter has not written yet, so there is no message to answer.");
  const id = nid();
  await sql`
    insert into mail_messages (
      id, company_id, to_email, subject, body, status, related_id,
      from_name, from_email, application_id, author
    ) values (
      ${id}, ${owned.companyId}, ${staff.from_email}, ${"Re: " + staff.subject}, ${text.text},
      'CAPTURED', ${input.applicationId}, ${owned.name}, ${owned.email}, ${input.applicationId}, 'CANDIDATE'
    )
  `;
  return { id, status: "CAPTURED" as const, note: "Reply stored for the recruiter." };
}
