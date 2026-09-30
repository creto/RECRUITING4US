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
import {
  generatePortalOtpCode,
  hashPortalOtp,
  isPortalOtpCodeShape,
  maskEmail,
  normalizePortalOtpCode,
  portalOtpCodesEqual,
  portalOtpExpiresAt,
  portalOtpMailCopy,
  PORTAL_OTP_MAX_ATTEMPTS,
  PORTAL_OTP_REQUEST_LIMIT,
  PORTAL_OTP_TTL_SECONDS,
} from "@/domain/portal-otp";
import { enterTenant } from "@/lib/tenant";
import { env } from "@/lib/env.server";
import { db, nid } from "./db.server";
import { mailText } from "@/domain/mail";

function portalAccessSecret(): string {
  return (env("BETTER_AUTH_SECRET") ?? process.env.BETTER_AUTH_SECRET ?? "recruit4us-dev-assess-access").trim();
}

const CODE_SENT =
  "If that email has applications with this employer, we sent a one-time code. It expires in about 12 minutes.";

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
    throw new Error("This portal link expired or is not valid. Unlock again with your email and the one-time code.");
  }
  const gate = await loadApplicationGate(applicationId);
  if (gate.company_id !== verified.companyId) {
    throw new Error("This portal link expired or is not valid. Unlock again with your email and the one-time code.");
  }
  enterTenant({ companyId: gate.company_id, publicSlug: "" });
  return { companyId: gate.company_id, email: gate.email_normalized, name: gate.candidate_name };
}

async function companiesForEmail(email: string) {
  const sql = await db();
  return sql.query<{ company_id: string; company_slug: string; company_name: string }>(
    "select company_id, company_slug, company_name from app_portal_companies_for_email($1)",
    [email],
  );
}

async function assertOtpRequestAllowed(companyId: string, email: string) {
  const sql = await db();
  const recent = await sql<{ n: number }>`
    select count(*)::int as n from portal_otp_challenges
    where company_id = ${companyId}
      and email_normalized = ${email}
      and purpose = 'portal'
      and created_at > now() - interval '15 minutes'
  `;
  if ((recent[0]?.n ?? 0) >= PORTAL_OTP_REQUEST_LIMIT) {
    throw new Error("Too many codes were requested. Wait a few minutes and try again.");
  }
}

async function createAndSendPortalOtp(input: {
  companyId: string;
  companyName: string;
  email: string;
  applicationId?: string | null;
}) {
  await assertOtpRequestAllowed(input.companyId, input.email);
  enterTenant({ companyId: input.companyId, publicSlug: "" });
  const sql = await db();
  await sql`
    update portal_otp_challenges
    set consumed_at = coalesce(consumed_at, now())
    where company_id = ${input.companyId}
      and email_normalized = ${input.email}
      and purpose = 'portal'
      and consumed_at is null
  `;
  const id = nid();
  const code = generatePortalOtpCode();
  const codeHash = hashPortalOtp({
    secret: portalAccessSecret(),
    challengeId: id,
    code,
  });
  const expires = portalOtpExpiresAt();
  await sql`
    insert into portal_otp_challenges (
      id, company_id, email_normalized, purpose, code_hash, invite_token,
      expires_at, attempt_count, max_attempts
    ) values (
      ${id}, ${input.companyId}, ${input.email}, ${"portal"}, ${codeHash}, ${""},
      ${expires.toISOString()}, ${0}, ${PORTAL_OTP_MAX_ATTEMPTS}
    )
  `;
  const mail = portalOtpMailCopy({
    companyName: input.companyName,
    code,
    purpose: "portal",
    ttlMinutes: Math.round(PORTAL_OTP_TTL_SECONDS / 60),
  });
  const { queueSystemMail } = await import("./platform.server");
  await queueSystemMail({
    companyId: input.companyId,
    toEmail: input.email,
    subject: mail.subject,
    body: mail.body,
    kind: "PORTAL_OTP",
    idempotencyKey: `portal-otp:${id}`,
    applicationId: input.applicationId ?? null,
  });
  return { challengeId: id, emailMasked: maskEmail(input.email) };
}

/**
 * Step 1: email only (optional company slug when the same address exists in more than one tenant).
 * Always company-scoped; never unlocks applications across companies.
 */
export async function requestPortalOtp(input: { email: string; companySlug?: string }) {
  assertSameSiteRequest();
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) throw new Error("Enter the email you applied with.");
  const companies = await companiesForEmail(email);
  const slug = (input.companySlug ?? "").trim().toLowerCase();

  if (companies.length === 0) {
    return { status: "code_sent" as const, emailMasked: maskEmail(email), note: CODE_SENT };
  }

  if (!slug && companies.length > 1) {
    return {
      status: "pick_company" as const,
      emailMasked: maskEmail(email),
      companies: companies.map((row) => ({
        slug: row.company_slug,
        name: row.company_name,
      })),
    };
  }

  const chosen = slug
    ? companies.find((row) => row.company_slug === slug)
    : companies[0];
  if (!chosen) {
    // Fail closed: do not reveal whether the slug exists elsewhere.
    return { status: "code_sent" as const, emailMasked: maskEmail(email), note: CODE_SENT };
  }

  const sent = await createAndSendPortalOtp({
    companyId: chosen.company_id,
    companyName: chosen.company_name,
    email,
  });
  return {
    status: "code_sent" as const,
    emailMasked: sent.emailMasked,
    companySlug: chosen.company_slug,
    companyName: chosen.company_name,
    note: CODE_SENT,
  };
}

/**
 * Step 2: verify OTP and mint per-application portal access tokens for that company only.
 */
export async function verifyPortalOtp(input: {
  email: string;
  code: string;
  companySlug: string;
}) {
  assertSameSiteRequest();
  const email = normalizeEmail(input.email);
  const code = normalizePortalOtpCode(input.code);
  const slug = input.companySlug.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Enter the email you applied with.");
  if (!isPortalOtpCodeShape(code)) throw new Error("Enter the 6-digit code from your email.");
  if (!slug) throw new Error("Choose the employer this application belongs to.");

  const companies = await companiesForEmail(email);
  const company = companies.find((row) => row.company_slug === slug);
  if (!company) {
    throw new Error("That code is not valid or has expired. Request a new code.");
  }

  enterTenant({ companyId: company.company_id, publicSlug: "" });
  const sql = await db();
  const challenges = await sql<{
    id: string;
    code_hash: string;
    attempt_count: number;
    max_attempts: number;
    expires_at: string;
  }>`
    select id, code_hash, attempt_count, max_attempts,
      to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at
    from portal_otp_challenges
    where company_id = ${company.company_id}
      and email_normalized = ${email}
      and purpose = 'portal'
      and consumed_at is null
    order by created_at desc
    limit 1
  `;
  const challenge = challenges[0];
  if (!challenge) {
    throw new Error("That code is not valid or has expired. Request a new code.");
  }
  if (Date.parse(challenge.expires_at) < Date.now()) {
    await sql`
      update portal_otp_challenges set consumed_at = now()
      where company_id = ${company.company_id} and id = ${challenge.id}
    `;
    throw new Error("That code expired. Request a new code.");
  }
  if (challenge.attempt_count >= challenge.max_attempts) {
    throw new Error("Too many incorrect attempts. Request a new code.");
  }

  const expected = hashPortalOtp({
    secret: portalAccessSecret(),
    challengeId: challenge.id,
    code,
  });
  if (!portalOtpCodesEqual(expected, challenge.code_hash)) {
    await sql`
      update portal_otp_challenges
      set attempt_count = attempt_count + 1
      where company_id = ${company.company_id} and id = ${challenge.id}
    `;
    throw new Error("That code is not valid. Check the email and try again.");
  }

  await sql`
    update portal_otp_challenges set consumed_at = now()
    where company_id = ${company.company_id} and id = ${challenge.id}
  `;

  const apps = await sql<{
    id: string;
    job_title: string;
    candidate_name: string;
    lifecycle: string;
    stage_name: string;
  }>`
    select a.id, j.title as job_title, c.name as candidate_name, a.lifecycle, s.name as stage_name
    from applications a
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    join jobs j on j.company_id = a.company_id and j.id = a.job_id
    join pipeline_stages s on s.company_id = a.company_id and s.id = a.current_stage_id
    where a.company_id = ${company.company_id}
      and c.email_normalized = ${email}
    order by a.submitted_at desc
    limit 40
  `;

  const applications = apps.map((row) => ({
    id: row.id,
    jobTitle: row.job_title,
    candidateName: row.candidate_name,
    lifecycle: row.lifecycle,
    stageName: row.stage_name,
    companyName: company.company_name,
    companySlug: company.company_slug,
    accessToken: mintPortalAccess({
      applicationId: row.id,
      companyId: company.company_id,
      secret: portalAccessSecret(),
    }),
  }));

  return {
    email,
    emailMasked: maskEmail(email),
    companySlug: company.company_slug,
    companyName: company.company_name,
    portalPath: applicationPortalPath(),
    applications,
  };
}

/**
 * Fallback gate: email + application UUID (kept so old invites / receipts still unlock).
 * Primary path is requestPortalOtp + verifyPortalOtp.
 */
export async function openApplicationPortal(input: { email: string; applicationId: string }) {
  assertSameSiteRequest();
  const email = normalizeEmail(input.email);
  const applicationId = input.applicationId.trim();
  const normalizedId = normalizeApplicationId(applicationId);
  const idHint = applicationIdGateHint(normalizedId);
  if (idHint) throw new Error(idHint);
  if (!email.includes("@")) {
    throw new Error("Enter the application email and application id.");
  }
  const gate = await loadApplicationGate(normalizedId);
  if (normalizeEmail(gate.email_normalized) !== email) {
    throw new Error(
      "That email and application id do not match. Use the exact email from your application and the full 36-character application id.",
    );
  }
  enterTenant({ companyId: gate.company_id, publicSlug: "" });
  const accessToken = mintPortalAccess({
    applicationId: normalizedId,
    companyId: gate.company_id,
    secret: portalAccessSecret(),
  });
  return {
    applicationId: normalizedId,
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
