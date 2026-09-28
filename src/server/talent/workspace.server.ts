import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import {
  bulkProgress,
  canReadApplication,
  canSeeCompensation,
  canSetLifecycle,
  canTransitionJob,
  candidateStageLabel,
  canDownloadFile,
  filePolicy,
  idempotencyDecision,
  normalizeEmail,
  scanDecision,
  slugify,
  toCsv,
  validateSavedViewFilters,
  isRole,
  applyScan,
  assertSameCompany,
  grantAllows,
  retentionDue,
} from "@/domain/rules";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, canonical, db, json, mapDbError, nid, requireActor, requireUser, sha256, withTransaction, type Actor } from "./db.server";
import { rememberEvent } from "./workflows.server";

const STAGES = [
  ["Applied", "APPLIED"],
  ["Recruiter review", "SCREEN"],
  ["Assessment", "ASSESSMENT"],
  ["Interview", "INTERVIEW"],
  ["Offer", "OFFER"],
  ["Decision", "DECISION"],
] as const;

function defaultForm() {
  return [
    { id: "website", type: "url", label: "Portfolio or website", required: false, help: "Optional" },
    { id: "why", type: "long_text", label: "Why this role?", required: false, help: "A short note is enough." },
  ];
}

async function assigned(actor: Actor, applicationId: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql<{ ok: number }>`
    select 1 as ok from interview_participants p
    join interviews i on i.id = p.interview_id and i.company_id = p.company_id
    where i.application_id = ${applicationId} and i.company_id = ${actor.companyId} and p.user_id = ${actor.userId}
    union
    select 1 from review_tasks r
    where r.application_id = ${applicationId} and r.company_id = ${actor.companyId}
      and (r.assignee_user_id = ${actor.userId} or r.assignee_user_id is null)
  `;
  return Boolean(rows[0]);
}

export async function listMyCompanies(userId: string) {
  const sql = await db();
  return sql<{ id: string; name: string; slug: string; role: string; demo: boolean }>`
    select c.id, c.name, c.slug, m.role, c.demo
    from memberships m
    join companies c on c.id = m.company_id
    where m.user_id = ${userId} and m.status = 'ACTIVE'
    order by c.name
  `;
}

export async function createCompany(userId: string, input: { name: string; timezone: string }) {
  assertSameSiteRequest();
  const user = await requireUser(userId);
  const sql = await db();
  const companyId = nid();
  enterTenant({ userId: user.id, companyId, publicSlug: "" });
  let slug = slugify(input.name);
  const taken = await sql<{ taken: boolean }>`select app_slug_taken(${slug}) as taken`;
  if (taken[0]?.taken) slug = `${slug}-${companyId.slice(0, 6)}`;
  try {
    await sql`
      insert into companies (id, name, slug, timezone, created_by)
      values (${companyId}, ${input.name.trim()}, ${slug}, ${input.timezone}, ${user.id})
    `;
    await sql`
      insert into memberships (id, company_id, user_id, role)
      values (${nid()}, ${companyId}, ${user.id}, 'OWNER')
    `;
  } catch (error) {
    mapDbError(error);
  }
  await audit({ companyId, userId }, "company.create", "company", companyId, "Company created.");
  return { slug };
}

const maintainedAt = new Map<string, number>();

function scheduleMaintenance(companyId: string) {
  const now = Date.now();
  if (now - (maintainedAt.get(companyId) ?? 0) < 30_000) return;
  maintainedAt.set(companyId, now);
  setTimeout(() => {
    void (async () => {
      try {
        const { drain } = await import("./workflows.server");
        await drain(companyId);
        const { sweepCompany } = await import("./assess.server");
        await sweepCompany(companyId);
      } catch (error) {
        console.error("maintenance", error instanceof Error ? error.message.slice(0, 180) : "failed");
      }
    })();
  }, 400);
}

export async function getWorkspace(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  scheduleMaintenance(actor.companyId);
  const sql = await db();
  const counts = await sql<{
    jobs: number;
    applications: number;
    reviews: number;
    interviews: number;
  }>`
    select
      (select count(*) from jobs where company_id = ${actor.companyId} and status = 'PUBLISHED') as jobs,
      (select count(*) from applications where company_id = ${actor.companyId} and lifecycle = 'ACTIVE') as applications,
      (select count(*) from review_tasks where company_id = ${actor.companyId} and status = 'OPEN') as reviews,
      (select count(*) from interviews where company_id = ${actor.companyId} and status = 'SCHEDULED'
        and starts_at >= now()) as interviews
  `;
  const activity = await sql<{ id: string; summary: string; action: string; at: string }>`
    select id, summary, action,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from audit_events where company_id = ${actor.companyId}
    order by created_at desc limit 8
  `;
  const overdue = await sql<{ id: string; title: string; deadline: string }>`
    select a.id, s.name as title,
      to_char(a.deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as deadline
    from attempts a
    join assignments g on g.id = a.assignment_id
    join assessment_versions v on v.id = g.assessment_version_id
    join assessments s on s.id = v.assessment_id
    where a.company_id = ${actor.companyId} and a.status = 'IN_PROGRESS' and a.deadline < now()
    limit 6
  `;
  return {
    company: {
      name: actor.companyName,
      slug: actor.slug,
      timezone: actor.timezone,
      role: actor.role,
      demo: actor.demo,
      retentionDays: actor.retentionDays,
    },
    counts: counts[0],
    activity,
    overdue,
  };
}

export async function updateCompany(
  userId: string,
  input: { slug: string; name: string; timezone: string; retentionDays: number },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "integration.manage");
  if (actor.role !== "OWNER" && actor.role !== "ADMIN") {
    throw new Error("You do not have permission to do that.");
  }
  const sql = await db();
  await sql`
    update companies set name = ${input.name.trim()}, timezone = ${input.timezone},
      retention_days = ${input.retentionDays}, updated_at = now()
    where id = ${actor.companyId}
  `;
  await audit(actor, "company.update", "company", actor.companyId, "Company settings updated.");
  return { ok: true };
}

export async function listMembers(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "member.manage");
  const sql = await db();
  const members = await sql<{ id: string; role: string; email: string; name: string; status: string }>`
    select m.id, m.role, u.email, u.name, m.status
    from memberships m
    join "user" u on u.id = m.user_id
    where m.company_id = ${actor.companyId}
    order by u.name
  `;
  const invites = await sql<{ id: string; email: string; role: string; expires_at: string; revoked: boolean; accepted: boolean }>`
    select id, email, role,
      to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at,
      revoked_at is not null as revoked,
      accepted_at is not null as accepted
    from invitations where company_id = ${actor.companyId}
    order by created_at desc limit 20
  `;
  return { members, invites };
}

export async function inviteMember(userId: string, input: { slug: string; email: string; role: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "member.manage");
  if (!isRole(input.role) || input.role === "OWNER") throw new Error("Choose a role other than owner.");
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const sql = await db();
  const inviteId = nid();
  await sql`
    insert into invitations (id, company_id, email, role, token_hash, expires_at, created_by)
    values (
      ${inviteId}, ${actor.companyId}, ${normalizeEmail(input.email)}, ${input.role},
      ${sha256(token)}, now() + interval '7 days', ${actor.userId}
    )
  `;
  await sql`
    insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
    values (
      ${nid()}, ${actor.companyId}, ${normalizeEmail(input.email)},
      ${"You're invited to " + actor.companyName},
      ${"Open RECRUIT4US and accept invite token " + token + ". The link itself does not join the company until you accept."},
      'CAPTURED', ${inviteId}
    )
  `;
  await audit(actor, "member.invite", "invitation", inviteId, `Invited a ${input.role}.`);
  return { token, inviteId };
}

export async function revokeInvite(userId: string, input: { slug: string; inviteId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "member.manage");
  const sql = await db();
  await sql`
    update invitations set revoked_at = now()
    where id = ${input.inviteId} and company_id = ${actor.companyId} and accepted_at is null
  `;
  return { ok: true };
}

export async function acceptInvite(userId: string, token: string) {
  assertSameSiteRequest();
  const user = await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    id: string;
    company_id: string;
    email: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
    slug: string;
  }>`
    select id, company_id, email, role, expires_at::text as expires_at,
      accepted_at::text as accepted_at, revoked_at::text as revoked_at, slug
    from app_invite(${sha256(token)})
  `;
  const invite = rows[0];
  if (!invite) throw new Error("This invitation is not valid.");
  if (invite.accepted_at || invite.revoked_at) throw new Error("This invitation can no longer be used.");
  if (new Date(invite.expires_at).getTime() <= Date.now()) throw new Error("This invitation has expired.");
  if (normalizeEmail(invite.email) !== user.emailNormalized) {
    throw new Error("Sign in with the invited email address.");
  }
  if (!isRole(invite.role)) throw new Error("This invitation is not valid.");
  enterTenant({ userId: user.id, companyId: invite.company_id, publicSlug: "" });
  const owners = await sql<{ n: number }>`
    select count(*) as n from memberships
    where company_id = ${invite.company_id} and role = 'OWNER' and status = 'ACTIVE'
  `;
  void owners;
  try {
    await sql`
      insert into memberships (id, company_id, user_id, role)
      values (${nid()}, ${invite.company_id}, ${user.id}, ${invite.role})
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.toLowerCase().includes("duplicate") && !message.includes("23505")) mapDbError(error);
  }
  await sql`update invitations set accepted_at = now() where id = ${invite.id} and accepted_at is null`;
  await audit(
    { companyId: invite.company_id, userId },
    "member.accept",
    "membership",
    user.id,
    "Invitation accepted.",
  );
  return { slug: invite.slug };
}

export async function removeMember(userId: string, input: { slug: string; membershipId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "member.manage");
  const sql = await db();
  const target = await sql<{ role: string; user_id: string }>`
    select role, user_id from memberships where id = ${input.membershipId} and company_id = ${actor.companyId}
  `;
  if (!target[0]) throw new Error("Not found.");
  if (target[0].role === "OWNER") {
    const owners = await sql<{ n: number }>`
      select count(*) as n from memberships
      where company_id = ${actor.companyId} and role = 'OWNER' and status = 'ACTIVE'
    `;
    if (Number(owners[0]?.n ?? 0) <= 1) throw new Error("The last owner cannot be removed.");
    if (actor.role !== "OWNER") throw new Error("Only an owner can change another owner.");
  }
  await sql`
    update memberships set status = 'REMOVED' where id = ${input.membershipId} and company_id = ${actor.companyId}
  `;
  await audit(actor, "member.remove", "membership", input.membershipId, "Membership removed.");
  return { ok: true };
}

export async function listJobs(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const showPay = canSeeCompensation(actor.role);
  const rows = await sql<{
    id: string;
    title: string;
    slug: string;
    department: string;
    locations: string;
    work_arrangement: string;
    status: string;
    openings: number;
    active: number;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    salary_visible: boolean;
  }>`
    select j.id, j.title, j.slug, j.department, j.locations, j.work_arrangement, j.status, j.openings,
      j.salary_min, j.salary_max, j.salary_currency, j.salary_visible,
      (select count(*) from applications a where a.job_id = j.id and a.lifecycle = 'ACTIVE') as active
    from jobs j where j.company_id = ${actor.companyId}
    order by j.created_at desc
  `;
  return rows.map((job) => ({
    ...job,
    salary_min: showPay ? job.salary_min : null,
    salary_max: showPay ? job.salary_max : null,
  }));
}

export async function getJob(userId: string, slug: string, jobId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const rows = await sql`
    select id, title, slug as job_slug, department, locations, work_arrangement, employment_type,
      description, skills, salary_min, salary_max, salary_currency, salary_visible, openings, status,
      form_schema
    from jobs where id = ${jobId} and company_id = ${actor.companyId}
  `;
  const job = rows[0] as Record<string, unknown> | undefined;
  if (!job) throw new Error("Not found.");
  if (!canSeeCompensation(actor.role)) {
    job.salary_min = null;
    job.salary_max = null;
  }
  const stages = await sql`
    select id, name, category, position, archived
    from pipeline_stages where job_id = ${jobId} and company_id = ${actor.companyId}
    order by position
  `;
  return { job, stages };
}

export async function createJob(
  userId: string,
  input: {
    slug: string;
    title: string;
    department: string;
    locations: string;
    workArrangement: string;
    employmentType: string;
    description: string;
    skills: string;
  },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "job.manage");
  const sql = await db();
  const jobId = nid();
  let jobSlug = slugify(input.title);
  const clash = await sql`select id from jobs where company_id = ${actor.companyId} and slug = ${jobSlug}`;
  if (clash[0]) jobSlug = `${jobSlug}-${jobId.slice(0, 4)}`;
  try {
    await sql`
      insert into jobs (
        id, company_id, title, slug, department, locations, work_arrangement, employment_type,
        description, skills, form_schema
      ) values (
        ${jobId}, ${actor.companyId}, ${input.title.trim()}, ${jobSlug}, ${input.department.trim()},
        ${input.locations.trim()}, ${input.workArrangement}, ${input.employmentType},
        ${input.description}, ${input.skills}, ${json(defaultForm())}::jsonb
      )
    `;
    for (let i = 0; i < STAGES.length; i += 1) {
      const stage = STAGES[i]!;
      await sql`
        insert into pipeline_stages (id, company_id, job_id, name, category, position)
        values (${nid()}, ${actor.companyId}, ${jobId}, ${stage[0]}, ${stage[1]}, ${i})
      `;
    }
  } catch (error) {
    mapDbError(error);
  }
  await audit(actor, "job.create", "job", jobId, "Draft job created.");
  return { jobId };
}

export async function updateJob(userId: string, input: Record<string, unknown>) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, String(input.slug));
  allow(actor, "job.manage");
  const sql = await db();
  const jobId = String(input.jobId);
  const current = await sql<{ status: string }>`
    select status from jobs where id = ${jobId} and company_id = ${actor.companyId}
  `;
  if (!current[0] || current[0].status === "ARCHIVED") throw new Error("This job can no longer be edited.");
  await sql`
    update jobs set
      title = ${String(input.title).trim()},
      department = ${String(input.department ?? "")},
      locations = ${String(input.locations ?? "")},
      work_arrangement = ${String(input.workArrangement)},
      employment_type = ${String(input.employmentType)},
      description = ${String(input.description ?? "")},
      skills = ${String(input.skills ?? "")},
      salary_min = ${input.salaryMin == null || input.salaryMin === "" ? null : Number(input.salaryMin)},
      salary_max = ${input.salaryMax == null || input.salaryMax === "" ? null : Number(input.salaryMax)},
      salary_currency = ${String(input.salaryCurrency ?? "USD")},
      salary_visible = ${Boolean(input.salaryVisible)},
      openings = ${Number(input.openings) || 1},
      form_schema = ${json(input.formSchema ?? defaultForm())}::jsonb,
      updated_at = now()
    where id = ${jobId} and company_id = ${actor.companyId}
  `;
  await audit(actor, "job.update", "job", jobId, "Job draft saved.");
  return { ok: true };
}

export async function setJobStatus(userId: string, input: { slug: string; jobId: string; status: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "job.manage");
  const sql = await db();
  const rows = await sql<{
    status: string;
    title: string;
    description: string;
    form_schema: unknown;
    salary_visible: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
  }>`
    select status, title, description, form_schema, salary_visible, salary_min, salary_max, salary_currency
    from jobs where id = ${input.jobId} and company_id = ${actor.companyId}
  `;
  const job = rows[0];
  if (!job) throw new Error("Not found.");
  if (input.status === "PUBLISHED") {
    if (job.status !== "DRAFT" && job.status !== "PAUSED" && job.status !== "PUBLISHED") {
      throw new Error("Republish is only available from draft, paused, or the current published version.");
    }
    if (!job.description.trim()) throw new Error("Add a description before publishing.");
    const versions = await sql<{ n: number }>`
      select coalesce(max(version_number), 0) as n from job_revisions
      where job_id = ${input.jobId} and company_id = ${actor.companyId}
    `;
    const revisionId = nid();
    const version = Number(versions[0]?.n ?? 0) + 1;
    await sql`
      insert into job_revisions (
        id, company_id, job_id, version_number, title, description, form_schema,
        salary_visible, salary_min, salary_max, salary_currency
      ) values (
        ${revisionId}, ${actor.companyId}, ${input.jobId}, ${version}, ${job.title}, ${job.description},
        ${json(job.form_schema)}::jsonb, ${job.salary_visible}, ${job.salary_min}, ${job.salary_max},
        ${job.salary_currency}
      )
    `;
    await sql`
      update jobs set status = 'PUBLISHED', published_revision_id = ${revisionId}, updated_at = now()
      where id = ${input.jobId} and company_id = ${actor.companyId}
    `;
    await audit(actor, "job.publish", "job", input.jobId, `Published revision ${version}.`);
    return { ok: true };
  }
  if (!canTransitionJob(job.status, input.status)) throw new Error("That status change is not allowed.");
  await sql`
    update jobs set status = ${input.status}, updated_at = now()
    where id = ${input.jobId} and company_id = ${actor.companyId}
  `;
  await audit(actor, "job.status", "job", input.jobId, `Status set to ${input.status}.`);
  return { ok: true };
}

export async function archiveStage(userId: string, input: { slug: string; stageId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "job.manage");
  const sql = await db();
  const used = await sql<{ n: number }>`
    select count(*) as n from applications
    where company_id = ${actor.companyId} and current_stage_id = ${input.stageId} and lifecycle = 'ACTIVE'
  `;
  if (Number(used[0]?.n ?? 0) > 0) {
    throw new Error("Move active applications before archiving this stage.");
  }
  const updated = await sql`
    update pipeline_stages set archived = true
    where id = ${input.stageId} and company_id = ${actor.companyId} and archived = false
    returning id
  `;
  if (!updated[0]) throw new Error("Not found.");
  await audit(actor, "stage.archive", "stage", input.stageId, "Stage archived. History is unchanged.");
  return { ok: true };
}

export async function listPipeline(userId: string, slug: string, jobId: string) {
  const actor = await requireActor(userId, slug);
  const sql = await db();
  const stages = await sql<{ id: string; name: string; category: string; position: number; archived: boolean }>`
    select id, name, category, position, archived from pipeline_stages
    where company_id = ${actor.companyId} and job_id = ${jobId}
    order by position
  `;
  if (!stages.length) throw new Error("Not found.");
  const cards = await sql<{
    id: string;
    version: number;
    lifecycle: string;
    stage_id: string;
    name: string;
    email: string;
    source: string;
  }>`
    select a.id, a.version, a.lifecycle, a.current_stage_id as stage_id, c.name, c.email, a.source
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    where a.company_id = ${actor.companyId} and a.job_id = ${jobId}
    order by a.submitted_at desc
  `;
  const visible = [];
  for (const card of cards) {
    const isAssigned = await assigned(actor, card.id);
    if (!canReadApplication({ role: actor.role, assignedToActor: isAssigned })) continue;
    visible.push({
      ...card,
      email: actor.role === "INTERVIEWER" ? "" : card.email,
    });
  }
  return { stages, cards: visible };
}

export async function moveApplication(
  userId: string,
  input: { slug: string; applicationId: string; toStageId: string; expectedVersion: number; reason?: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.move");
  const sql = await db();
  const current = await sql<{ version: number; job_id: string; stage_id: string; lifecycle: string }>`
    select version, job_id, current_stage_id as stage_id, lifecycle
    from applications where id = ${input.applicationId} and company_id = ${actor.companyId}
  `;
  const app = current[0];
  if (!app) throw new Error("Not found.");
  if (app.lifecycle !== "ACTIVE") throw new Error("Only active applications can change stage.");
  const stage = await sql<{ id: string }>`
    select id from pipeline_stages
    where id = ${input.toStageId} and company_id = ${actor.companyId} and job_id = ${app.job_id} and archived = false
  `;
  if (!stage[0]) throw new Error("Choose a stage on this job.");
  return withTransaction(async () => {
    const updated = await sql<{ version: number }>`
      update applications set current_stage_id = ${input.toStageId}, version = version + 1
      where id = ${input.applicationId} and company_id = ${actor.companyId} and version = ${input.expectedVersion}
      returning version
    `;
    if (!updated[0]) {
      throw new Error(`Version conflict. Reload and try again. Current version is ${app.version}.`);
    }
    await sql`
      insert into stage_events (id, company_id, application_id, from_stage_id, to_stage_id, actor_user_id, reason)
      values (
        ${nid()}, ${actor.companyId}, ${input.applicationId}, ${app.stage_id}, ${input.toStageId},
        ${actor.userId}, ${input.reason ?? ""}
      )
    `;
    await rememberEvent(actor.companyId, "STAGE_CHANGED", input.applicationId, {
      applicationId: input.applicationId,
      jobId: app.job_id,
      stageId: input.toStageId,
    });
    await audit(actor, "application.move", "application", input.applicationId, "Stage updated.");
    return { version: updated[0].version };
  });
}

export async function setLifecycle(
  userId: string,
  input: { slug: string; applicationId: string; lifecycle: string; expectedVersion: number; reason: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.move");
  if (!input.reason.trim()) throw new Error("A reason is required.");
  const sql = await db();
  const current = await sql<{ version: number; lifecycle: string; job_id: string }>`
    select version, lifecycle, job_id from applications
    where id = ${input.applicationId} and company_id = ${actor.companyId}
  `;
  const app = current[0];
  if (!app) throw new Error("Not found.");
  if (!canSetLifecycle(app.lifecycle, input.lifecycle)) throw new Error("That decision is not allowed.");
  const updated = await sql<{ version: number }>`
    update applications
    set lifecycle = ${input.lifecycle},
        version = version + 1,
        rejection_reason = ${input.lifecycle === "REJECTED" ? input.reason : null},
        closed_at = case when ${input.lifecycle} = 'ACTIVE' then null else now() end
    where id = ${input.applicationId} and company_id = ${actor.companyId} and version = ${input.expectedVersion}
    returning version
  `;
  if (!updated[0]) throw new Error(`Version conflict. Current version is ${app.version}.`);
  await sql`
    insert into stage_events (
      id, company_id, application_id, from_lifecycle, to_lifecycle, actor_user_id, reason
    ) values (
      ${nid()}, ${actor.companyId}, ${input.applicationId}, ${app.lifecycle}, ${input.lifecycle},
      ${actor.userId}, ${input.reason}
    )
  `;
  await rememberEvent(actor.companyId, "LIFECYCLE_CHANGED", input.applicationId, {
    applicationId: input.applicationId,
    jobId: app.job_id,
    lifecycle: input.lifecycle,
  });
  await audit(actor, "application.lifecycle", "application", input.applicationId, input.lifecycle);
  return { version: updated[0].version };
}

export async function bulkMove(
  userId: string,
  input: { slug: string; applicationIds: string[]; toStageId: string; reason: string },
) {
  const results: { id: string; ok: boolean; message: string }[] = [];
  for (const applicationId of input.applicationIds.slice(0, 50)) {
    const sql = await db();
    const actor = await requireActor(userId, input.slug);
    const rows = await sql<{ version: number }>`
      select version from applications where id = ${applicationId} and company_id = ${actor.companyId}
    `;
    if (!rows[0]) {
      results.push({ id: applicationId, ok: false, message: "Not found." });
      continue;
    }
    try {
      await moveApplication(userId, {
        slug: input.slug,
        applicationId,
        toStageId: input.toStageId,
        expectedVersion: rows[0].version,
        reason: input.reason,
      });
      results.push({ id: applicationId, ok: true, message: "Moved." });
    } catch (error) {
      results.push({
        id: applicationId,
        ok: false,
        message: error instanceof Error ? error.message : "Failed",
      });
    }
  }
  const sql = await db();
  const actor = await requireActor(userId, input.slug);
  const planned = input.applicationIds.slice(0, 50);
  const progress = bulkProgress(planned, planned.length);
  const runId = nid();
  await sql`
    insert into bulk_runs (id, company_id, cursor_index, total, results)
    values (${runId}, ${actor.companyId}, ${planned.length}, ${planned.length}, ${json(results)}::jsonb)
  `;
  return {
    results,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    runId,
    cursor: results.length,
    remaining: progress.remaining,
    done: progress.done,
  };
}

export async function listCandidates(userId: string, input: { slug: string; query?: string; source?: string; tag?: string }) {
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.read");
  if (actor.role === "INTERVIEWER" || actor.role === "ASSESSMENT_REVIEWER") {
    throw new Error("You do not have permission to do that.");
  }
  const sql = await db();
  const q = `%${(input.query ?? "").trim().toLowerCase()}%`;
  const rows = await sql<{
    id: string;
    name: string;
    email: string;
    source: string;
    applications: number;
    tags: string | null;
  }>`
    select c.id, c.name, c.email, c.source,
      (select count(*) from applications a where a.candidate_id = c.id and a.company_id = c.company_id) as applications,
      (
        select string_agg(t.name, ', ' order by t.name)
        from candidate_tags ct
        join tags t on t.id = ct.tag_id and t.company_id = ct.company_id
        where ct.candidate_id = c.id and ct.company_id = c.company_id
      ) as tags
    from candidates c
    where c.company_id = ${actor.companyId}
      and (${input.query ?? ""} = '' or lower(c.name) like ${q} or lower(c.email) like ${q})
      and (${input.source ?? ""} = '' or c.source = ${input.source ?? ""})
      and (
        ${input.tag ?? ""} = '' or exists (
          select 1 from candidate_tags ct
          join tags t on t.id = ct.tag_id
          where ct.candidate_id = c.id and ct.company_id = c.company_id and t.name = ${input.tag ?? ""}
        )
      )
    order by c.created_at desc
    limit 100
  `;
  return rows;
}

export async function getApplication(userId: string, slug: string, applicationId: string) {
  const actor = await requireActor(userId, slug);
  const isAssigned = await assigned(actor, applicationId);
  if (!canReadApplication({ role: actor.role, assignedToActor: isAssigned })) throw new Error("Not found.");
  const sql = await db();
  const rows = await sql<{
    id: string;
    version: number;
    lifecycle: string;
    source: string;
    rejection_reason: string | null;
    submitted_at: string;
    job_id: string;
    job_title: string;
    stage_id: string;
    stage_name: string;
    stage_category: string;
    candidate_id: string;
    name: string;
    email: string;
    phone: string | null;
    anonymized: boolean;
  }>`
    select a.id, a.version, a.lifecycle, a.source, a.rejection_reason,
      to_char(a.submitted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as submitted_at,
      j.id as job_id, j.title as job_title,
      s.id as stage_id, s.name as stage_name, s.category as stage_category,
      c.id as candidate_id, c.name, c.email, c.phone, c.anonymized
    from applications a
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    join pipeline_stages s on s.id = a.current_stage_id and s.company_id = a.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    where a.id = ${applicationId} and a.company_id = ${actor.companyId}
  `;
  const application = rows[0];
  if (!application) throw new Error("Not found.");
  const answers = await sql<{ field_id: string; value: unknown }>`
    select field_id, value from application_answers
    where application_id = ${applicationId} and company_id = ${actor.companyId}
  `;
  const events = await sql`
    select id, reason, from_lifecycle, to_lifecycle,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from stage_events where application_id = ${applicationId} and company_id = ${actor.companyId}
    order by created_at desc limit 40
  `;
  const limited = actor.role === "INTERVIEWER" || actor.role === "ASSESSMENT_REVIEWER";
  const notes = limited
    ? []
    : await sql`
        select id, body, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
        from notes where application_id = ${applicationId} and company_id = ${actor.companyId}
        order by created_at desc
      `;
  const stages = await sql`
    select id, name, category from pipeline_stages
    where job_id = ${application.job_id} and company_id = ${actor.companyId} and archived = false
    order by position
  `;
  const assignments = await sql`
    select g.id, g.status, s.name as assessment_name,
      to_char(g.start_by at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as start_by,
      v.score_release,
      (select count(*) from attempts t where t.assignment_id = g.id) as attempts,
      (select t.id from attempts t where t.assignment_id = g.id order by t.ordinal desc limit 1) as attempt_id,
      (select e.status from evaluations e
        where e.company_id = g.company_id
          and e.attempt_id = (select t.id from attempts t where t.assignment_id = g.id order by t.ordinal desc limit 1)
        order by e.revision desc limit 1) as score_status,
      (select e.origin from evaluations e
        where e.company_id = g.company_id
          and e.attempt_id = (select t.id from attempts t where t.assignment_id = g.id order by t.ordinal desc limit 1)
        order by e.revision desc limit 1) as score_origin,
      (select e.basis_points from evaluations e
        where e.company_id = g.company_id
          and e.attempt_id = (select t.id from attempts t where t.assignment_id = g.id order by t.ordinal desc limit 1)
        order by e.revision desc limit 1) as basis_points
    from assignments g
    join assessment_versions v on v.id = g.assessment_version_id
    join assessments s on s.id = v.assessment_id
    where g.application_id = ${applicationId} and g.company_id = ${actor.companyId}
  `;
  const interviews = await sql`
    select id, title, status, timezone, location, meeting_url, ics_uid, ics_sequence,
      to_char(starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as starts_at,
      to_char(ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ends_at
    from interviews where application_id = ${applicationId} and company_id = ${actor.companyId}
    order by starts_at
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
    select o.id, o.status, o.current_revision, r.title, r.salary_minor, r.currency,
      r.start_date::text as start_date, r.message
    from offers o
    join offer_revisions r on r.offer_id = o.id and r.revision = o.current_revision and r.company_id = o.company_id
    where o.application_id = ${applicationId} and o.company_id = ${actor.companyId}
  `;
  const files = await sql<{ id: string; display_name: string; scan_state: string; size_bytes: number }>`
    select id, display_name, scan_state, size_bytes from file_objects
    where company_id = ${actor.companyId} and owner_id = ${applicationId}
  `;
  const showPay = canSeeCompensation(actor.role);
  return {
    application: limited ? { ...application, email: "", phone: null, rejection_reason: null } : application,
    answers,
    events,
    notes,
    stages,
    assignments,
    interviews,
    offers: offers.map((offer) =>
      showPay ? offer : { ...offer, salary_minor: null, message: limited ? "" : offer.message },
    ),
    files,
    canMove: actor.role !== "INTERVIEWER" && actor.role !== "ASSESSMENT_REVIEWER",
    canSeePay: showPay,
  };
}

export async function addNote(userId: string, input: { slug: string; applicationId: string; body: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.note");
  const body = input.body.trim();
  if (!body) throw new Error("Write a note first.");
  const sql = await db();
  const found = await sql`select id from applications where id = ${input.applicationId} and company_id = ${actor.companyId}`;
  if (!found[0]) throw new Error("Not found.");
  await sql`
    insert into notes (id, company_id, application_id, author_user_id, body)
    values (${nid()}, ${actor.companyId}, ${input.applicationId}, ${actor.userId}, ${body.slice(0, 4000)})
  `;
  return { ok: true };
}

export async function addTag(userId: string, input: { slug: string; applicationId: string; tag: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.note");
  const name = input.tag.trim().slice(0, 40);
  if (!name) throw new Error("Enter a tag.");
  const sql = await db();
  const apps = await sql<{ candidate_id: string }>`
    select candidate_id from applications where id = ${input.applicationId} and company_id = ${actor.companyId}
  `;
  if (!apps[0]) throw new Error("Not found.");
  await sql`
    insert into tags (id, company_id, name) values (${nid()}, ${actor.companyId}, ${name})
    on conflict (company_id, name) do nothing
  `;
  const tags = await sql<{ id: string }>`select id from tags where company_id = ${actor.companyId} and name = ${name}`;
  await sql`
    insert into candidate_tags (company_id, candidate_id, tag_id)
    values (${actor.companyId}, ${apps[0].candidate_id}, ${tags[0]!.id})
    on conflict do nothing
  `;
  return { ok: true };
}

export async function exportCsv(userId: string, slug: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "candidate.export");
  const sql = await db();
  const rows = await sql<{ name: string; email: string; title: string; stage: string; lifecycle: string; source: string }>`
    select c.name, c.email, j.title, s.name as stage, a.lifecycle, a.source
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    join pipeline_stages s on s.id = a.current_stage_id
    where a.company_id = ${actor.companyId}
    order by a.submitted_at desc
    limit 2000
  `;
  const csv = toCsv([
    ["name", "email", "job", "stage", "lifecycle", "source"],
    ...rows.map((row) => [row.name, row.email, row.title, row.stage, row.lifecycle, row.source]),
  ]);
  await audit(actor, "export.csv", "company", actor.companyId, `Exported ${rows.length} applications.`);
  return { csv, rows: rows.length };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const char = src[i]!;
    if (quoted) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function importCsv(userId: string, input: { slug: string; csv: string; commit: boolean }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "candidate.export");
  const table = parseCsv(input.csv);
  if (table.length < 2) throw new Error("The file needs a header and at least one row.");
  if (table.length > 201) throw new Error("Import at most 200 rows at a time.");
  const header = table[0]!.map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  if (nameIdx < 0 || emailIdx < 0) throw new Error("Required headers: name, email.");
  const sourceIdx = header.indexOf("source");
  const report: { row: number; status: string; message: string }[] = [];
  const sql = await db();
  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i]!;
    const name = (cells[nameIdx] ?? "").trim();
    const email = (cells[emailIdx] ?? "").trim();
    const source = sourceIdx >= 0 ? (cells[sourceIdx] ?? "IMPORT").trim() || "IMPORT" : "IMPORT";
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      report.push({ row: i + 1, status: "invalid", message: "Name and a valid email are required." });
      continue;
    }
    if (!input.commit) {
      report.push({ row: i + 1, status: "preview", message: `${name} <${normalizeEmail(email)}>` });
      continue;
    }
    try {
      await sql`
        insert into candidates (id, company_id, name, email, email_normalized, source)
        values (${nid()}, ${actor.companyId}, ${name}, ${email}, ${normalizeEmail(email)}, ${source.slice(0, 40)})
        on conflict (company_id, email_normalized) do nothing
      `;
      report.push({ row: i + 1, status: "saved", message: "Stored or already present in this company." });
    } catch (error) {
      report.push({ row: i + 1, status: "error", message: error instanceof Error ? error.message : "Failed" });
    }
  }
  if (input.commit) await audit(actor, "import.csv", "company", actor.companyId, "Candidate import finished.");
  return { report, committed: input.commit };
}

export async function saveView(userId: string, input: { slug: string; name: string; filters: { field: string; op: string; value: string }[] }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  const check = validateSavedViewFilters(input.filters);
  if (!check.ok) throw new Error(check.message);
  const sql = await db();
  await sql`
    insert into saved_views (id, company_id, user_id, name, filters)
    values (${nid()}, ${actor.companyId}, ${actor.userId}, ${input.name.trim().slice(0, 60)}, ${json(input.filters)}::jsonb)
  `;
  return { ok: true };
}

export async function listViews(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  const sql = await db();
  return sql`select id, name, filters from saved_views where company_id = ${actor.companyId} and user_id = ${actor.userId} order by created_at desc`;
}

export async function listPublicJobs(input: { companySlug: string; q?: string; department?: string; workArrangement?: string }) {
  enterTenant({ publicSlug: input.companySlug, companyId: "", userId: "" });
  const sql = await db();
  const q = `%${(input.q ?? "").trim().toLowerCase()}%`;
  const companies = await sql<{ id: string; name: string; timezone: string }>`
    select id, name, timezone from companies where slug = ${input.companySlug} and status = 'ACTIVE'
  `;
  const company = companies[0];
  if (!company) return { company: null, jobs: [] };
  const jobs = await sql<{
    id: string;
    title: string;
    slug: string;
    department: string;
    locations: string;
    work_arrangement: string;
    employment_type: string;
    salary_visible: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
  }>`
    select id, title, slug, department, locations, work_arrangement, employment_type,
      salary_visible, salary_min, salary_max, salary_currency
    from jobs
    where company_id = ${company.id} and status = 'PUBLISHED'
      and (${input.q ?? ""} = '' or lower(title) like ${q} or lower(department) like ${q})
      and (${input.department ?? ""} = '' or department = ${input.department ?? ""})
      and (${input.workArrangement ?? ""} = '' or work_arrangement = ${input.workArrangement ?? ""})
    order by title
  `;
  return {
    company: { name: company.name, slug: input.companySlug, timezone: company.timezone },
    jobs: jobs.map((job) => ({
      ...job,
      salary_min: job.salary_visible ? job.salary_min : null,
      salary_max: job.salary_visible ? job.salary_max : null,
    })),
  };
}

export async function getPublicJob(companySlug: string, jobSlug: string) {
  enterTenant({ publicSlug: companySlug, companyId: "", userId: "" });
  const sql = await db();
  const rows = await sql<{
    company_name: string;
    timezone: string;
    title: string;
    department: string;
    locations: string;
    work_arrangement: string;
    employment_type: string;
    description: string;
    form_schema: { id: string; type: string; label: string; required: boolean; options?: string[] }[];
    salary_visible: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    status: string;
  }>`
    select c.name as company_name, c.timezone, r.title, j.department, j.locations, j.work_arrangement,
      j.employment_type, r.description, r.form_schema, r.salary_visible, r.salary_min, r.salary_max,
      r.salary_currency, j.status
    from jobs j
    join companies c on c.id = j.company_id
    join job_revisions r on r.id = j.published_revision_id and r.company_id = j.company_id
    where c.slug = ${companySlug} and j.slug = ${jobSlug}
  `;
  const job = rows[0];
  if (!job || job.status !== "PUBLISHED") return null;
  return {
    ...job,
    salary_min: job.salary_visible ? job.salary_min : null,
    salary_max: job.salary_visible ? job.salary_max : null,
  };
}

type ApplyInput = {
  companySlug: string;
  jobSlug: string;
  name: string;
  email: string;
  phone?: string;
  answers: Record<string, string>;
  idempotencyKey: string;
  resume?: { name: string; mime: string; dataBase64: string } | null;
  sessionUserId?: string | null;
};

export async function submitApplication(input: ApplyInput) {
  assertSameSiteRequest();
  enterTenant({ publicSlug: input.companySlug, companyId: "", userId: "" });
  const sql = await db();
  const jobs = await sql<{
    company_id: string;
    job_id: string;
    revision_id: string;
    form_schema: { id: string; type: string; label: string; required: boolean; options?: string[] }[];
    status: string;
    stage_id: string;
  }>`
    select j.company_id, j.id as job_id, j.published_revision_id as revision_id, r.form_schema, j.status,
      (
        select id from pipeline_stages s
        where s.job_id = j.id and s.company_id = j.company_id and s.category = 'APPLIED' and s.archived = false
        order by position limit 1
      ) as stage_id
    from jobs j
    join companies c on c.id = j.company_id
    join job_revisions r on r.id = j.published_revision_id
    where c.slug = ${input.companySlug} and j.slug = ${input.jobSlug}
  `;
  const job = jobs[0];
  if (!job || job.status !== "PUBLISHED" || !job.stage_id) {
    throw new Error("This job is not accepting applications.");
  }
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  let sessionEmail: string | null = null;
  if (input.sessionUserId) {
    const user = await requireUser(input.sessionUserId);
    sessionEmail = user.emailNormalized;
    if (sessionEmail !== email) throw new Error("Apply with the email on your account.");
  }
  const recent = await sql<{ n: number }>`
    select count(*) as n from applications a
    join candidates c on c.id = a.candidate_id
    where c.email_normalized = ${email} and a.submitted_at > now() - interval '1 hour'
  `;
  if (Number(recent[0]?.n ?? 0) > 20) throw new Error("Too many applications from this email. Try again later.");
  const payloadHash = sha256(canonical({
    name: input.name.trim(),
    email,
    phone: input.phone ?? "",
    answers: input.answers,
    job: job.job_id,
  }));
  const actorKey = `apply:${email}`;
  const prior = await sql<{ payload_hash: string; result: { applicationId: string; alreadyApplied: boolean } }>`
    select payload_hash, result from idempotency_records
    where actor_key = ${actorKey} and operation = 'apply' and idem_key = ${input.idempotencyKey}
  `;
  if (prior[0]) {
    const decision = idempotencyDecision({ payloadHash: prior[0].payload_hash }, payloadHash);
    if (decision === "conflict") throw new Error("This submission key was already used with different answers.");
    return prior[0].result;
  }
  for (const field of job.form_schema ?? []) {
    const value = (input.answers[field.id] ?? "").trim();
    if (field.required && !value) throw new Error(`“${field.label}” is required.`);
    if (value && field.type === "url" && !/^https?:\/\//i.test(value)) {
      throw new Error(`“${field.label}” must be a full http(s) URL.`);
    }
    if (value && field.type === "select" && field.options && !field.options.includes(value)) {
      throw new Error(`“${field.label}” has an unsupported choice.`);
    }
  }
  const active = await sql<{ id: string }>`
    select a.id from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    where a.company_id = ${job.company_id} and a.job_id = ${job.job_id}
      and c.email_normalized = ${email} and a.lifecycle = 'ACTIVE'
  `;
  if (active[0]) {
    const result = { applicationId: active[0].id, alreadyApplied: true };
    await sql`
      insert into idempotency_records (id, actor_key, operation, idem_key, payload_hash, result)
      values (${nid()}, ${actorKey}, 'apply', ${input.idempotencyKey}, ${payloadHash}, ${json(result)}::jsonb)
      on conflict (actor_key, operation, idem_key) do nothing
    `;
    return result;
  }
  const candidateId = nid();
  const applicationId = nid();
  try {
    await sql`
      insert into candidates (id, company_id, name, email, email_normalized, phone, source, user_id)
      values (
        ${candidateId}, ${job.company_id}, ${input.name.trim()}, ${input.email.trim()}, ${email},
        ${input.phone ?? null}, 'CAREERS', ${sessionEmail ? input.sessionUserId! : null}
      )
      on conflict (company_id, email_normalized) do update
      set user_id = coalesce(candidates.user_id, excluded.user_id)
    `;
    const candidate = await sql<{ id: string }>`
      select id from candidates where company_id = ${job.company_id} and email_normalized = ${email}
    `;
    await sql`
      insert into applications (
        id, company_id, job_id, candidate_id, job_revision_id, current_stage_id, source
      ) values (
        ${applicationId}, ${job.company_id}, ${job.job_id}, ${candidate[0]!.id}, ${job.revision_id},
        ${job.stage_id}, 'CAREERS'
      )
    `;
    for (const field of job.form_schema ?? []) {
      const value = input.answers[field.id] ?? "";
      if (!value.trim()) continue;
      await sql`
        insert into application_answers (id, company_id, application_id, field_id, value)
        values (${nid()}, ${job.company_id}, ${applicationId}, ${field.id}, ${json({ text: value.slice(0, 8000) })}::jsonb)
      `;
    }
    if (input.resume?.dataBase64) {
      await storeResume(job.company_id, applicationId, input.resume);
    }
    await sql`
      insert into stage_events (id, company_id, application_id, to_stage_id, to_lifecycle, reason)
      values (${nid()}, ${job.company_id}, ${applicationId}, ${job.stage_id}, 'ACTIVE', 'Application submitted')
    `;
  } catch (error) {
    const again = await sql<{ id: string }>`
      select a.id from applications a
      join candidates c on c.id = a.candidate_id
      where a.company_id = ${job.company_id} and a.job_id = ${job.job_id}
        and c.email_normalized = ${email} and a.lifecycle = 'ACTIVE'
    `;
    if (again[0]) return { applicationId: again[0].id, alreadyApplied: true };
    mapDbError(error);
  }
  const result = { applicationId, alreadyApplied: false };
  await sql`
    insert into idempotency_records (id, actor_key, operation, idem_key, payload_hash, result)
    values (${nid()}, ${actorKey}, 'apply', ${input.idempotencyKey}, ${payloadHash}, ${json(result)}::jsonb)
    on conflict (actor_key, operation, idem_key) do nothing
  `;
  await rememberEvent(job.company_id, "APPLICATION_SUBMITTED", applicationId, {
    applicationId,
    jobId: job.job_id,
    source: "CAREERS",
  });
  await audit({ companyId: job.company_id, userId: input.sessionUserId ?? null }, "application.submit", "application", applicationId, "Public application stored.");
  return result;
}

async function storeResume(
  companyId: string,
  applicationId: string,
  resume: { name: string; mime: string; dataBase64: string },
) {
  const bytes = Buffer.from(resume.dataBase64, "base64");
  const problem = filePolicy({ name: resume.name, mime: resume.mime, size: bytes.length });
  if (problem) throw new Error(problem);
  const sample = bytes.subarray(0, 400).toString("utf8");
  const sql = await db();
  const fileId = nid();
  await sql`
    insert into file_objects (
      id, company_id, owner_scope, owner_id, display_name, mime, size_bytes, content, scan_state, scan_note
    ) values (
      ${fileId}, ${companyId}, 'application', ${applicationId}, ${resume.name.slice(0, 180)}, ${resume.mime},
      ${bytes.length}, ${resume.dataBase64}, 'QUARANTINE',
      'Held for the local demo scanner. Not a commercial antivirus.'
    )
  `;
  let scanner: "CLEAN" | "INFECTED" | "ERROR" = "ERROR";
  try {
    scanner = scanDecision({ name: resume.name, textSample: sample });
  } catch {
    scanner = "ERROR";
  }
  const verdict = applyScan(scanner);
  if (verdict !== "QUARANTINE") {
    await sql`
      update file_objects set scan_state = ${verdict},
        scan_note = ${verdict === "CLEAN" ? "Local demo scanner. Not a commercial antivirus." : "Local demo scanner rejected this file."}
      where id = ${fileId} and company_id = ${companyId}
    `;
  }
}

export async function readFile(userId: string, slug: string, fileId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const rows = await sql<{ display_name: string; mime: string; content: string; scan_state: string }>`
    select display_name, mime, content, scan_state from file_objects
    where id = ${fileId} and company_id = ${actor.companyId}
  `;
  const file = rows[0];
  if (!file) throw new Error("Not found.");
  if (!canDownloadFile(file.scan_state)) throw new Error("This file is not available until it passes review.");
  const grantId = nid();
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  await sql`
    insert into file_grants (id, company_id, file_id, user_id, expires_at)
    values (${grantId}, ${actor.companyId}, ${fileId}, ${actor.userId}, ${expires.toISOString()})
  `;
  return {
    grantId,
    expiresAt: expires.toISOString(),
    name: file.display_name,
    mime: file.mime,
    dataBase64: file.content,
  };
}

export async function readGrantedFile(userId: string, grantId: string) {
  await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    company_id: string;
    file_id: string;
    user_id: string;
    expires_at: string;
    scan_state: string;
    display_name: string;
    mime: string;
    content: string;
  }>`
    select g.company_id, g.file_id, g.user_id, g.expires_at::text as expires_at,
      f.scan_state, f.display_name, f.mime, f.content
    from file_grants g
    join file_objects f on f.id = g.file_id and f.company_id = g.company_id
    where g.id = ${grantId}
  `;
  const grant = rows[0];
  if (!grant) throw new Error("Not found.");
  const allowed = grantAllows({
    now: new Date(),
    expiresAt: new Date(grant.expires_at),
    fileId: grant.file_id,
    grantFileId: grant.file_id,
    companyId: grant.company_id,
    grantCompanyId: grant.company_id,
    userId,
    grantUserId: grant.user_id,
  });
  if (!allowed || !canDownloadFile(grant.scan_state)) throw new Error("This download link has expired.");
  return { name: grant.display_name, mime: grant.mime, dataBase64: grant.content };
}

export async function mergeCandidates(
  userId: string,
  input: { slug: string; keepId: string; dropEmail: string; commit: boolean },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.move");
  const sql = await db();
  const people = await sql<{ id: string; company_id: string; name: string; email: string }>`
    select id, company_id, name, email from candidates
    where company_id = ${actor.companyId}
      and (id = ${input.keepId} or email_normalized = ${normalizeEmail(input.dropEmail)})
  `;
  const keep = people.find((person) => person.id === input.keepId);
  const drop = people.find((person) => person.id !== input.keepId && person.email.toLowerCase() === normalizeEmail(input.dropEmail));
  if (!keep || !drop) throw new Error("Both people must already exist in this company.");
  assertSameCompany(keep.company_id, drop.company_id);
  const overlap = await sql<{ job_id: string }>`
    select a.job_id from applications a
    join applications b on b.job_id = a.job_id and b.company_id = a.company_id and b.lifecycle = 'ACTIVE'
    where a.company_id = ${actor.companyId} and a.candidate_id = ${keep.id} and a.lifecycle = 'ACTIVE'
      and b.candidate_id = ${drop.id}
  `;
  if (!input.commit) {
    return { ok: true, committed: false, keep: keep.name, drop: drop.email, conflicts: overlap.length };
  }
  if (overlap.length) throw new Error("Resolve overlapping active applications before merging.");
  const removed = `merged-${nid().slice(0, 8)}@deleted.example`;
  await withTransaction(async () => {
    await sql`
      update applications set candidate_id = ${keep.id}
      where company_id = ${actor.companyId} and candidate_id = ${drop.id}
    `;
    await sql`
      update candidates set name = 'Merged candidate', email = ${removed}, email_normalized = ${removed},
        phone = null, anonymized = true, user_id = null
      where id = ${drop.id} and company_id = ${actor.companyId}
    `;
  });
  await audit(actor, "candidate.merge", "candidate", keep.id, "Merged a duplicate profile inside this company.");
  return { ok: true, committed: true, keep: keep.name, drop: drop.email, conflicts: 0 };
}

export async function runRetention(userId: string, slug: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw new Error("You do not have permission to do that.");
  const sql = await db();
  const files = await sql<{ id: string; created_at: string }>`
    select id, created_at::text as created_at from file_objects where company_id = ${actor.companyId}
  `;
  const now = new Date();
  const due = files.filter((file) => retentionDue(new Date(file.created_at), now, actor.retentionDays));
  for (const file of due) {
    await sql`delete from file_objects where id = ${file.id} and company_id = ${actor.companyId}`;
  }
  await audit(actor, "privacy.retention", "company", actor.companyId, `Removed ${due.length} files past retention.`);
  return { removed: due.length };
}

export async function listAudit(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw new Error("You do not have permission to do that.");
  const sql = await db();
  return sql`
    select id, action, entity_type, summary,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from audit_events where company_id = ${actor.companyId}
    order by created_at desc limit 80
  `;
}

export async function listMail(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "workflow.manage");
  const sql = await db();
  return sql`
    select id, to_email, subject, body, status,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from mail_messages where company_id = ${actor.companyId}
    order by created_at desc limit 50
  `;
}

export async function anonymizeCandidate(userId: string, input: { slug: string; candidateId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw new Error("You do not have permission to do that.");
  const sql = await db();
  const token = `removed-${nid().slice(0, 8)}@deleted.example`;
  const updated = await sql`
    update candidates set name = 'Removed candidate', email = ${token}, email_normalized = ${token},
      phone = null, anonymized = true, user_id = null
    where id = ${input.candidateId} and company_id = ${actor.companyId}
    returning id
  `;
  if (!updated[0]) throw new Error("Not found.");
  await sql`
    delete from file_objects where company_id = ${actor.companyId} and owner_id in (
      select id from applications where candidate_id = ${input.candidateId} and company_id = ${actor.companyId}
    )
  `;
  await sql`
    update deletion_requests set status = 'COMPLETED'
    where company_id = ${actor.companyId} and candidate_id = ${input.candidateId}
  `;
  await audit(actor, "privacy.anonymize", "candidate", input.candidateId, "Candidate profile anonymized in this company.");
  return { ok: true };
}

export async function listDeletionRequests(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw new Error("You do not have permission to do that.");
  const sql = await db();
  return sql`
    select d.id, d.candidate_id, d.status, c.name,
      to_char(d.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from deletion_requests d
    join candidates c on c.id = d.candidate_id
    where d.company_id = ${actor.companyId}
    order by d.created_at desc limit 40
  `;
}

export async function integrationStatus(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  return {
    companyName: actor.companyName,
    timezone: actor.timezone,
    retentionDays: actor.retentionDays,
    items: [
      { name: "Email", state: "Configured", detail: "Messages are captured in this workspace. Nothing is sent to the public internet." },
      { name: "Files", state: "Configured", detail: "Uploads stay in the database, quarantined until the local demo scanner marks them clean. This is not a commercial antivirus." },
      { name: "Code execution", state: "Local sandbox", detail: "No remote runner key is configured. A sample run uses a separate process with filesystem access denied, a 1.5 second timeout, and truncated output. It is not a virtual machine and it is not a score." },
      { name: "Calendar", state: "Reconnect until a credential exists", detail: "Refresh records a reconnect state and does not store a token. A vendor URL and refresh token are the only missing connector." },
      { name: "Provider callbacks", state: "Refused", detail: "Callbacks are refused and nothing is stored until PROVIDER_CALLBACK_SECRET is set. The body cannot choose the company." },
      { name: "Webhooks", state: "Refused", detail: "Webhook events are refused and nothing is stored until WEBHOOK_SECRET is set." },
      { name: "External assessments", state: "Manual", detail: "Import a result with its original scale. There is no live vendor connector." },
    ],
  };
}

export function candidateLabel(category: string, lifecycle: string) {
  return candidateStageLabel(category, lifecycle);
}
