import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { buildSlots, claimSlot } from "@/domain/platform/booking";
import { boardStatus, canConvert } from "@/domain/platform/crm";
import { explainCutoff, invitesAfterRerank, normalizeStages, onboardingTasks, personalityCannotGate, rankCutoff, SCREEN_FIRST_PLAN, STANDARD_PLAN, type StageDraft } from "@/domain/platform/plans";
import { interpretBoardResponse, interpretHrisPush } from "@/domain/platform/adapters";
import { pushCalendar } from "./calendar.server";
import { postJson } from "./outbound.server";
import { canSeeCompensation, normalizeEmail } from "@/domain/rules";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, db, nid, requireActor, requireUser } from "./db.server";

export async function listCrm(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const prospects = await sql`select id, name, email, source, consent, status, notes, application_id from prospects where company_id = ${actor.companyId} order by created_at desc limit 80`;
  const pools = await sql`select id, name from talent_pools where company_id = ${actor.companyId} order by name`;
  const referrals = await sql`select id, employee_name, employee_email, role_title, status, incentive_note, prospect_id, application_id, hired_at from referrals where company_id = ${actor.companyId} order by created_at desc limit 40`;
  const campaigns = await sql`select id, name, status, subject, body from campaigns where company_id = ${actor.companyId} order by created_at desc limit 20`;
  const boards = await sql`select id, job_id, board, status, detail from job_distributions where company_id = ${actor.companyId} order by board`;
  return {
    prospects,
    pools,
    referrals,
    campaigns,
    boards,
    note: "Outreach uses the delivery queue, including people who are not applicants yet. A reply or a bounce stops the sequence. The sandbox board is labeled and is not LinkedIn. An outside board runs only when JOB_BOARD_URL and JOB_BOARD_TOKEN are set.",
  };
}

export async function saveProspect(userId: string, slug: string, input: { name: string; email: string; source: string; consent: string; notes: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const email = normalizeEmail(input.email);
  const id = nid();
  await sql`
    insert into prospects (id, company_id, name, email, source, consent, notes)
    values (${id}, ${actor.companyId}, ${input.name.slice(0, 120)}, ${email}, ${input.source.slice(0, 40)}, ${input.consent}, ${input.notes.slice(0, 2000)})
    on conflict (company_id, email) do update set name = excluded.name, source = excluded.source, consent = excluded.consent, notes = excluded.notes
  `;
  return { email };
}

export async function savePool(userId: string, slug: string, name: string, prospectEmail: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const poolId = nid();
  const pools = await sql<{ id: string }>`
    insert into talent_pools (id, company_id, name) values (${poolId}, ${actor.companyId}, ${name.slice(0, 80)})
    on conflict (company_id, name) do update set name = excluded.name
    returning id
  `;
  const people = await sql<{ id: string }>`select id from prospects where company_id = ${actor.companyId} and email = ${normalizeEmail(prospectEmail)}`;
  if (!people[0] || !pools[0]) throw new Error("Add the person before adding them to a pool.");
  await sql`
    insert into pool_members (company_id, pool_id, prospect_id) values (${actor.companyId}, ${pools[0].id}, ${people[0].id})
    on conflict do nothing
  `;
  return { poolId: pools[0].id };
}

export async function saveReferral(userId: string, slug: string, input: { employeeName: string; employeeEmail: string; candidateName: string; candidateEmail: string; roleTitle: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const email = normalizeEmail(input.candidateEmail);
  await saveProspect(userId, slug, { name: input.candidateName, email, source: "REFERRAL", consent: "UNKNOWN", notes: `Referred by ${input.employeeName}` });
  const sql = await db();
  const people = await sql<{ id: string }>`select id from prospects where company_id = ${actor.companyId} and email = ${email}`;
  await sql`
    insert into referrals (id, company_id, prospect_id, employee_name, employee_email, role_title, status)
    values (${nid()}, ${actor.companyId}, ${people[0]?.id ?? null}, ${input.employeeName.slice(0, 120)}, ${normalizeEmail(input.employeeEmail)}, ${input.roleTitle.slice(0, 120)}, 'REVIEW')
  `;
  await audit(actor, "referral.create", "referral", email, input.roleTitle);
  return { email, note: "The referrer cannot see notes on the application." };
}

export async function convertProspect(userId: string, slug: string, email: string, applicationId: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.move");
  const sql = await db();
  const people = await sql<{ id: string; consent: string }>`select id, consent from prospects where company_id = ${actor.companyId} and email = ${normalizeEmail(email)}`;
  const person = people[0];
  if (!person) throw new Error("That person is not in the pool.");
  const gate = canConvert(person.consent);
  if (!gate.ok) throw new Error(gate.error);
  await sql`update prospects set status = 'APPLICANT', application_id = ${applicationId} where company_id = ${actor.companyId} and id = ${person.id}`;
  await sql`
    update referrals set status = 'APPLIED', application_id = ${applicationId}
    where company_id = ${actor.companyId} and prospect_id = ${person.id}
  `;
  await audit(actor, "prospect.convert", "prospect", person.id, applicationId);
  return { applicationId };
}

export async function saveCampaign(userId: string, slug: string, input: { name: string; subject: string; body: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "workflow.manage");
  const sql = await db();
  const id = nid();
  await sql`
    insert into campaigns (id, company_id, name, subject, body) values (${id}, ${actor.companyId}, ${input.name.slice(0, 80)}, ${input.subject.slice(0, 200)}, ${input.body.slice(0, 4000)})
  `;
  return { id };
}

export async function enrollCampaign(userId: string, slug: string, campaignId: string, email: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "workflow.manage");
  const sql = await db();
  const people = await sql<{ id: string; consent: string; name: string }>`select id, consent, name from prospects where company_id = ${actor.companyId} and email = ${normalizeEmail(email)}`;
  const person = people[0];
  if (!person) throw new Error("That person is not in the pool.");
  if (person.consent !== "YES") throw new Error("Do not enroll someone who has not agreed to be contacted.");
  const campaigns = await sql<{ id: string; subject: string; body: string; status: string }>`select id, subject, body, status from campaigns where company_id = ${actor.companyId} and id = ${campaignId}`;
  const campaign = campaigns[0];
  if (!campaign || campaign.status === "PAUSED") throw new Error("That campaign is not running.");
  await sql`update campaigns set status = 'RUNNING' where company_id = ${actor.companyId} and id = ${campaignId}`;
  await sql`
    insert into campaign_enrollments (id, company_id, campaign_id, prospect_id, status)
    values (${nid()}, ${actor.companyId}, ${campaignId}, ${person.id}, 'SENT')
    on conflict (company_id, campaign_id, prospect_id) do nothing
  `;
  const { queueProspectMail } = await import("./platform.server");
  const apps = await sql<{ id: string }>`
    select a.id from applications a
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    where a.company_id = ${actor.companyId} and lower(c.email) = ${normalizeEmail(email)}
    order by a.submitted_at desc limit 1
  `;
  const queued = await queueProspectMail(userId, slug, {
    email,
    name: person.name,
    applicationId: apps[0]?.id ?? null,
    kind: "CAMPAIGN",
    subject: campaign.subject,
    body: campaign.body,
    idempotencyKey: `campaign:${campaignId}:${person.id}`,
  });
  return {
    sent: true,
    duplicate: queued.duplicate,
    note: `${queued.note} A reply or a bounce stops this sequence. Stored is not delivered.`,
  };
}

export async function pauseCampaign(userId: string, slug: string, campaignId: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "workflow.manage");
  const sql = await db();
  await sql`update campaigns set status = 'PAUSED' where company_id = ${actor.companyId} and id = ${campaignId}`;
  await sql`update campaign_enrollments set status = 'STOPPED' where company_id = ${actor.companyId} and campaign_id = ${campaignId} and status = 'QUEUED'`;
  return { status: "PAUSED" };
}

export async function setDistribution(userId: string, slug: string, jobId: string, board: string, action: "publish" | "unpublish") {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "job.manage");
  const name = board.slice(0, 40);
  let result = boardStatus(name, false, action);
  if (name.toLowerCase() === "linkedin") {
    result = { status: "CONFIG_REQUIRED", detail: "LinkedIn is not connected. Nothing was published there." };
  } else if (name !== "sandbox-board" && name !== "careers-page") {
    const url = process.env.JOB_BOARD_URL?.trim() ?? "";
    const token = process.env.JOB_BOARD_TOKEN?.trim() ?? "";
    if (!url || !token) {
      result = { status: "CONFIG_REQUIRED", detail: `${name} is not connected. Nothing was published. The sandbox board is a separate, labeled destination inside this workspace.` };
    } else {
      try {
        const response = await postJson(url, token, {
          idempotencyKey: `${jobId}:${name}:${action}`,
          jobId,
          board: name,
          action,
        });
        const interpreted = interpretBoardResponse(response.status, response.body);
        result = {
          status: action === "unpublish" && interpreted.status === "PUBLISHED" ? "UNPUBLISHED" : interpreted.status,
          detail: interpreted.detail,
        };
      } catch (error) {
        result = { status: "FAILED", detail: error instanceof Error ? error.message : "The job board could not be reached." };
      }
    }
  }
  const sql = await db();
  await sql`
    insert into job_distributions (id, company_id, job_id, board, status, detail)
    values (${nid()}, ${actor.companyId}, ${jobId}, ${name}, ${result.status}, ${result.detail})
    on conflict (company_id, job_id, board) do update set status = excluded.status, detail = excluded.detail
  `;
  return result;
}

export async function reconcileDistribution(userId: string, slug: string, jobId: string, board: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "job.manage");
  const name = board.slice(0, 40);
  const sql = await db();
  const current = await sql<{ status: string; detail: string }>`
    select status, detail from job_distributions where company_id = ${actor.companyId} and job_id = ${jobId} and board = ${name}
  `;
  if (name === "sandbox-board" || name === "careers-page") {
    return {
      status: current[0]?.status ?? "UNPUBLISHED",
      detail: current[0]?.detail || `${name} is inside this workspace. Reconcile did not call an outside board.`,
    };
  }
  if (name.toLowerCase() === "linkedin") {
    return { status: "CONFIG_REQUIRED", detail: "LinkedIn is not connected. Nothing was reconciled." };
  }
  const url = process.env.JOB_BOARD_URL?.trim() ?? "";
  const token = process.env.JOB_BOARD_TOKEN?.trim() ?? "";
  if (!url || !token) {
    return { status: "CONFIG_REQUIRED", detail: `${name} is not connected. The sandbox board is a separate labeled destination.` };
  }
  try {
    const response = await postJson(url, token, { idempotencyKey: `${jobId}:${name}:status`, jobId, board: name, action: "status" });
    const interpreted = interpretBoardResponse(response.status, response.body);
    await sql`
      insert into job_distributions (id, company_id, job_id, board, status, detail)
      values (${nid()}, ${actor.companyId}, ${jobId}, ${name}, ${interpreted.status}, ${interpreted.detail})
      on conflict (company_id, job_id, board) do update set status = excluded.status, detail = excluded.detail
    `;
    return interpreted;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The job board could not be reached.";
    return { status: "FAILED", detail };
  }
}

export async function remindHires(userId: string, slug: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "offer.manage");
  const sql = await db();
  const tasks = await sql<{ id: string; title: string; application_id: string }>`
    select t.id, t.title, h.application_id
    from onboarding_tasks t
    join pending_hires h on h.company_id = t.company_id and h.id = t.hire_id
    where t.company_id = ${actor.companyId} and t.status = 'OPEN' and t.candidate_visible = true
      and h.status = 'PENDING' and t.due_at is not null and t.due_at < now()
  `;
  const { queueMail } = await import("./platform.server");
  const day = new Date().toISOString().slice(0, 10);
  let queued = 0;
  for (const task of tasks) {
    const result = await queueMail(userId, slug, {
      applicationId: task.application_id,
      kind: "ONBOARDING",
      subject: "Reminder for {{job_title}}",
      body: `Hello {{candidate_name}},\n\nThis task is still open: ${task.title}.\n\nIt does not change your offer.\n\n{{company_name}}`,
      cc: "",
      bcc: "",
      idempotencyKey: `remind:${task.id}:${day}`,
    });
    if (!result.duplicate) queued += 1;
  }
  return { queued, seen: tasks.length, note: "A reminder is queued once per task per day. Stored is not delivered." };
}

export async function listCalendar(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "interview.manage");
  const sql = await db();
  const vendor = Boolean(process.env.CALENDAR_VENDOR_URL && process.env.CALENDAR_REFRESH_TOKEN);
  const { calendarPublicSetup } = await import("./calendar.server");
  const setup = calendarPublicSetup();
  const detail = vendor
    ? "A calendar vendor URL and token are set. A booking is pushed when someone takes a slot. A failed push stays SYNC_FAILED until you retry it. This workspace has not verified a live vendor unless that push succeeded."
    : setup.steps.join(" ");
  await sql`
    insert into calendar_connections (id, company_id, provider, status, secret_ref, last_error, user_id, detail)
    values (
      ${nid()}, ${actor.companyId}, 'external', ${vendor ? "CONNECTED" : "RECONNECT"},
      'env:CALENDAR_REFRESH_TOKEN', ${detail}, ${actor.userId}, ${detail}
    )
    on conflict (company_id, provider) do update
      set status = case when calendar_connections.refresh_token <> '' then calendar_connections.status else excluded.status end,
          last_error = excluded.last_error,
          detail = case when calendar_connections.refresh_token <> '' then calendar_connections.detail else excluded.detail end,
          user_id = excluded.user_id,
          refreshed_at = now()
  `;
  const connections = await sql`select provider, status, detail, (refresh_token <> '') as oauth_stored from calendar_connections where company_id = ${actor.companyId}`;
  const links = await sql`select id, token, title, status, timezone, duration_min, application_id from booking_links where company_id = ${actor.companyId} order by created_at desc limit 20`;
  const events = await sql`select id, provider, status, title, detail, starts_at, ends_at from calendar_events where company_id = ${actor.companyId} order by starts_at desc limit 20`;
  return { connections, links, events, steps: setup.steps, authUrl: setup.authUrl, oauthReady: setup.oauthReady };
}

export async function createBookingLink(userId: string, slug: string, input: { applicationId: string; title: string; durationMin: number; timezone: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "interview.manage");
  const sql = await db();
  const id = nid();
  const token = crypto.randomUUID();
  await sql`
    insert into booking_links (id, company_id, token, application_id, title, duration_min, timezone, expires_at)
    values (${id}, ${actor.companyId}, ${token}, ${input.applicationId}, ${input.title.slice(0, 120)}, ${input.durationMin}, ${input.timezone}, now() + interval '14 days')
  `;
  const drafts = buildSlots({
    from: new Date(),
    days: 10,
    timeZone: input.timezone,
    startHour: 9,
    endHour: 16,
    durationMin: input.durationMin,
  });
  for (const slot of drafts.slice(0, 24)) {
    await sql`
      insert into booking_slots (id, company_id, link_id, starts_at, ends_at)
      values (${nid()}, ${actor.companyId}, ${id}, ${slot.startsAt}, ${slot.endsAt})
      on conflict (company_id, link_id, starts_at) do nothing
    `;
  }
  await audit(actor, "booking.create", "booking_link", id, input.title.slice(0, 80));
  return { token };
}

export async function readBooking(userId: string, token: string) {
  const user = await requireUser(userId);
  const sql = await db();
  const found = await sql.query<{ company_id: string | null }>("select app_company_for_booking($1) as company_id", [token]);
  const companyId = found[0]?.company_id;
  if (!companyId) throw new Error("This scheduling link is not valid.");
  enterTenant({ userId: user.id, companyId });
  const links = await sql<{ id: string; title: string; timezone: string; status: string }>`
    select id, title, timezone, status from booking_links where token = ${token}
  `;
  const link = links[0];
  if (!link || link.status !== "OPEN") throw new Error("This scheduling link is closed.");
  const slots = await sql<{ id: string; starts_at: string; ends_at: string; status: string }>`
    select id, starts_at::text, ends_at::text, status from booking_slots
    where company_id = ${companyId} and link_id = ${link.id} and status = 'OPEN' and starts_at > now()
    order by starts_at limit 24
  `;
  const mine = await sql<{ id: string; starts_at: string }>`
    select id, starts_at::text as starts_at from booking_slots
    where company_id = ${companyId} and link_id = ${link.id} and status = 'BOOKED' and held_by = ${user.emailNormalized}
    order by starts_at desc limit 1
  `;
  return { title: link.title, timezone: link.timezone, slots, mine: mine[0] ?? null, email: user.email };
}

export async function bookSlot(userId: string, token: string, slotId: string) {
  assertSameSiteRequest();
  const user = await requireUser(userId);
  const view = await readBooking(userId, token);
  const slot = view.slots.find((item) => item.id === slotId);
  if (!slot) throw new Error("That time is not open.");
  const decision = claimSlot(slot.status);
  if (!decision.ok) throw new Error(decision.error);
  const sql = await db();
  const found = await sql.query<{ company_id: string }>("select app_company_for_booking($1) as company_id", [token]);
  const companyId = found[0]?.company_id;
  if (!companyId) throw new Error("This scheduling link is not valid.");
  enterTenant({ userId: user.id, companyId });
  const updated = await sql<{ id: string; starts_at: string; ends_at: string }>`
    update booking_slots set status = 'BOOKED', held_by = ${user.emailNormalized}
    where company_id = ${companyId} and id = ${slotId} and status = 'OPEN'
    returning id, starts_at::text, ends_at::text
  `;
  if (!updated[0]) throw new Error("That time was just taken. Pick another.");
  const links = await sql<{ title: string }>`select title from booking_links where company_id = ${companyId} and token = ${token}`;
  const pushed = await pushCalendar(companyId, {
    idempotencyKey: updated[0].id,
    title: links[0]?.title ?? "Interview",
    startsAt: updated[0].starts_at,
    endsAt: updated[0].ends_at,
    action: "create",
  });
  await sql`
    insert into calendar_events (id, company_id, slot_id, provider, external_id, status, title, starts_at, ends_at, detail)
    values (
      ${nid()}, ${companyId}, ${updated[0].id}, ${pushed.provider}, ${pushed.externalId}, ${pushed.status}, ${links[0]?.title ?? "Interview"},
      ${updated[0].starts_at}, ${updated[0].ends_at}, ${pushed.detail}
    )
  `;
  return { booked: true, startsAt: updated[0].starts_at, detail: pushed.detail, status: pushed.status };
}

export async function listPlans(userId: string, slug: string, jobId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "job.manage");
  const sql = await db();
  const plans = await sql<{ id: string; name: string; version: number; status: string; cutoff_percent: number; auto_cutoff: boolean }>`
    select id, name, version, status, cutoff_percent, auto_cutoff from hiring_plans
    where company_id = ${actor.companyId} and job_id = ${jobId} order by version desc
  `;
  const stages = await sql<{ plan_id: string; name: string; kind: string; position: number; reviewers: number; entry_rule: string; exit_rule: string; assessment_key: string; scorecard_focus: string }>`
    select plan_id, name, kind, position, reviewers, entry_rule, exit_rule, assessment_key, scorecard_focus from hiring_stages where company_id = ${actor.companyId} order by position
  `;
  return { plans, stages, templates: ["standard", "screen-first", "custom"] };
}

export async function savePlan(userId: string, slug: string, input: {
  jobId: string;
  template?: string;
  cutoffPercent: number;
  autoCutoff?: boolean;
  personalityIsCutoff?: boolean;
  stages?: StageDraft[];
}) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "job.manage");
  const personality = personalityCannotGate(Boolean(input.personalityIsCutoff));
  if (!personality.ok) throw new Error(personality.error);
  let stages: StageDraft[] = STANDARD_PLAN;
  let name = "standard";
  if (input.stages && input.stages.length > 0) {
    const normalized = normalizeStages(input.stages);
    if (!normalized.ok) throw new Error(normalized.error);
    stages = normalized.stages;
    name = "custom";
  } else if (input.template === "screen-first") {
    stages = SCREEN_FIRST_PLAN;
    name = "screen-first";
  }
  const sql = await db();
  const versions = await sql<{ version: number }>`select coalesce(max(version), 0) as version from hiring_plans where company_id = ${actor.companyId} and job_id = ${input.jobId}`;
  const version = Number(versions[0]?.version ?? 0) + 1;
  const id = nid();
  const automatic = input.autoCutoff !== false;
  await sql`
    insert into hiring_plans (id, company_id, job_id, version, name, status, cutoff_percent, personality_is_cutoff, auto_cutoff)
    values (${id}, ${actor.companyId}, ${input.jobId}, ${version}, ${name}, 'ACTIVE', ${input.cutoffPercent}, false, ${automatic})
  `;
  await sql`update hiring_plans set status = 'ARCHIVED' where company_id = ${actor.companyId} and job_id = ${input.jobId} and id <> ${id} and status = 'ACTIVE'`;
  let position = 0;
  for (const stage of stages) {
    await sql`
      insert into hiring_stages (id, company_id, plan_id, name, kind, position, reviewers, entry_rule, exit_rule, assessment_key, scorecard_focus)
      values (
        ${nid()}, ${actor.companyId}, ${id}, ${stage.name}, ${stage.kind}, ${position},
        ${stage.reviewers ?? 1}, ${stage.entryRule ?? ""}, ${stage.exitRule ?? ""}, ${stage.assessmentKey ?? ""}, ${stage.scorecardFocus ?? ""}
      )
    `;
    position += 1;
  }
  await audit(actor, "plan.save", "hiring_plan", id, name);
  return { id, version, keptInvites: invitesAfterRerank(["existing"]).length === 1 };
}

export async function explainJob(userId: string, slug: string, jobId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const plans = await sql<{ cutoff_percent: number; auto_cutoff: boolean }>`
    select cutoff_percent, auto_cutoff from hiring_plans
    where company_id = ${actor.companyId} and job_id = ${jobId} and status = 'ACTIVE'
    order by version desc limit 1
  `;
  const percent = plans[0]?.cutoff_percent ?? 50;
  const automatic = plans[0]?.auto_cutoff !== false;
  const ranks = await sql<{ application_id: string; score: number | null; name: string }>`
    select r.application_id, r.score, c.name
    from pipeline_ranks r
    join applications a on a.company_id = r.company_id and a.id = r.application_id
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    where r.company_id = ${actor.companyId} and r.job_id = ${jobId} and r.gate = 'EXPERTISE'
  `;
  const cutoff = rankCutoff(ranks.map((row) => ({ id: row.application_id, score: row.score })), percent, automatic);
  return {
    percent,
    automatic,
    cutoffScore: cutoff.cutoffScore,
    lines: ranks.map((row) => explainCutoff({
      name: row.name,
      score: row.score,
      advanced: cutoff.advancedIds.includes(row.application_id),
      missing: row.score == null,
      cutoffScore: cutoff.cutoffScore,
      percent,
      automatic,
    })),
    note: "Changing this cutoff does not withdraw an assessment that was already sent. A personality type is not a cutoff. A missing score stays out of the automatic advance.",
  };
}

export async function movePlanStage(userId: string, slug: string, applicationId: string, toStage: string, reason: string, decline: boolean) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.move");
  const sql = await db();
  const apps = await sql<{ stage_name: string; job_id: string }>`
    select s.name as stage_name, a.job_id
    from applications a
    join pipeline_stages s on s.company_id = a.company_id and s.id = a.current_stage_id
    where a.company_id = ${actor.companyId} and a.id = ${applicationId}
  `;
  const app = apps[0];
  if (!app) throw new Error("That application was not found.");
  await sql`
    insert into stage_history (id, company_id, application_id, from_stage, to_stage, actor_id, reason)
    values (${nid()}, ${actor.companyId}, ${applicationId}, ${app.stage_name}, ${toStage.slice(0, 80)}, ${actor.userId}, ${reason.slice(0, 300)})
  `;
  const stages = await sql<{ id: string }>`
    select id from pipeline_stages where company_id = ${actor.companyId} and job_id = ${app.job_id} and name = ${toStage} and archived = false limit 1
  `;
  if (stages[0] && !decline) {
    await sql`update applications set current_stage_id = ${stages[0].id}, version = version + 1 where company_id = ${actor.companyId} and id = ${applicationId}`;
  }
  if (decline) {
    await sql`update applications set lifecycle = 'REJECTED', closed_at = now(), rejection_reason = ${reason.slice(0, 300)}, version = version + 1 where company_id = ${actor.companyId} and id = ${applicationId} and lifecycle = 'ACTIVE'`;
  }
  await audit(actor, decline ? "stage.decline" : "stage.advance", "application", applicationId, toStage);
  return { from: app.stage_name, to: toStage, declined: decline, keptInvites: true };
}

export async function listHires(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "offer.manage");
  const sql = await db();
  const hires = await sql`select id, application_id, status, start_note from pending_hires where company_id = ${actor.companyId} order by created_at desc`;
  const tasks = await sql`select id, hire_id, title, owner_role, status, candidate_visible, position, due_at, depends_on from onboarding_tasks where company_id = ${actor.companyId} order by position`;
  return {
    hires,
    tasks,
    hris: process.env.HRIS_EXPORT_URL && process.env.HRIS_EXPORT_TOKEN
      ? "An HR endpoint is configured. A push is idempotent. Download stays available. This preview has not verified a live HR system."
      : "No HR system is connected. You can download the handoff. It is not pushed anywhere.",
  };
}

export async function openHire(userId: string, slug: string, applicationId: string, note: string, location = "", roleTitle = "") {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "offer.manage");
  const sql = await db();
  const offers = await sql<{ id: string }>`
    select id from offers where company_id = ${actor.companyId} and application_id = ${applicationId} and status = 'ACCEPTED' limit 1
  `;
  if (!offers[0]) throw new Error("Onboarding opens after the candidate accepts an offer. Accepting does not by itself mark them hired.");
  const id = nid();
  const inserted = await sql<{ id: string }>`
    insert into pending_hires (id, company_id, application_id, status, start_note, location, role_title)
    values (${id}, ${actor.companyId}, ${applicationId}, 'PENDING', ${note.slice(0, 500)}, ${location.slice(0, 80)}, ${roleTitle.slice(0, 80)})
    on conflict (company_id, application_id) do nothing
    returning id
  `;
  const hireId = inserted[0]?.id;
  if (!hireId) return { id, existed: true };
  let position = 0;
  const due = new Date(Date.now() + 7 * 86_400_000).toISOString();
  for (const task of onboardingTasks(roleTitle, location)) {
    await sql`
      insert into onboarding_tasks (id, company_id, hire_id, title, owner_role, candidate_visible, position, due_at)
      values (${nid()}, ${actor.companyId}, ${hireId}, ${task.title}, ${task.owner}, ${task.visible}, ${position}, ${due})
    `;
    position += 1;
  }
  await sql`
    update referrals set status = 'HIRED', hired_at = now(), application_id = ${applicationId}
    where company_id = ${actor.companyId}
      and prospect_id in (select id from prospects where company_id = ${actor.companyId} and application_id = ${applicationId})
  `;
  const { queueMail } = await import("./platform.server");
  await queueMail(userId, slug, {
    applicationId,
    kind: "ONBOARDING",
    subject: "Next steps for {{job_title}}",
    body: "Hello {{candidate_name}},\n\nYour offer is accepted. Open the candidate home for your tasks. This does not mean the hire is complete.\n\n{{company_name}}",
    cc: "",
    bcc: "",
    idempotencyKey: `hire:${hireId}`,
  });
  await audit(actor, "hire.open", "pending_hire", hireId, "Pending hire opened");
  return { id: hireId, existed: false };
}

export async function setTask(userId: string, slug: string, taskId: string, status: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  if (status !== "OPEN" && status !== "DONE") throw new Error("A task is open or done.");
  const sql = await db();
  await sql`update onboarding_tasks set status = ${status} where company_id = ${actor.companyId} and id = ${taskId}`;
  return { status };
}

export async function cancelHire(userId: string, slug: string, applicationId: string, reason: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "offer.manage");
  const sql = await db();
  await sql`
    update pending_hires set status = 'CANCELED', start_note = ${reason.slice(0, 500)}
    where company_id = ${actor.companyId} and application_id = ${applicationId}
  `;
  await audit(actor, "hire.cancel", "pending_hire", applicationId, reason.slice(0, 200));
  return { status: "CANCELED", offerKept: true };
}

export async function hrisPayload(userId: string, slug: string, applicationId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "offer.manage");
  const sql = await db();
  const rows = await sql<{ name: string; email: string; title: string; status: string; salary_minor: number | null; currency: string | null }>`
    select c.name, c.email, j.title, h.status, r.salary_minor, r.currency
    from pending_hires h
    join applications a on a.company_id = h.company_id and a.id = h.application_id
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    join jobs j on j.company_id = a.company_id and j.id = a.job_id
    left join offers o on o.company_id = a.company_id and o.application_id = a.id and o.status = 'ACCEPTED'
    left join offer_revisions r on r.company_id = o.company_id and r.offer_id = o.id and r.revision = o.current_revision
    where h.company_id = ${actor.companyId} and h.application_id = ${applicationId}
  `;
  const row = rows[0];
  if (!row) throw new Error("Open onboarding before exporting.");
  const showPay = canSeeCompensation(actor.role);
  const person = {
    name: row.name,
    email: row.email,
    job: row.title,
    hireStatus: row.status,
    salaryMinor: showPay ? row.salary_minor : null,
    currency: showPay ? row.currency : null,
    salaryHidden: !showPay,
  };
  const url = process.env.HRIS_EXPORT_URL?.trim() ?? "";
  const token = process.env.HRIS_EXPORT_TOKEN?.trim() ?? "";
  if (!url || !token) {
    return { destination: "DOWNLOAD_ONLY", note: "No HR system is connected. This download is the handoff. It was not pushed.", person };
  }
  const key = `hire:${applicationId}`;
  const existing = await sql<{ status: string; detail: string }>`
    select status, detail from hris_pushes where company_id = ${actor.companyId} and idempotency_key = ${key}
  `;
  if (existing[0]) {
    return { destination: existing[0].status, note: `${existing[0].detail} The same hire was not pushed again.`, person };
  }
  try {
    const response = await postJson(url, token, { idempotencyKey: key, person });
    const pushed = interpretHrisPush(response.status, response.body);
    await sql`
      insert into hris_pushes (id, company_id, application_id, idempotency_key, status, detail)
      values (${nid()}, ${actor.companyId}, ${applicationId}, ${key}, ${pushed.status}, ${pushed.detail})
    `;
    return { destination: pushed.status, note: pushed.detail, person };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The HR system could not be reached.";
    await sql`
      insert into hris_pushes (id, company_id, application_id, idempotency_key, status, detail)
      values (${nid()}, ${actor.companyId}, ${applicationId}, ${key}, 'FAILED', ${detail})
    `;
    return { destination: "FAILED", note: detail, person };
  }
}

export async function platformReport(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "report.read");
  const sql = await db();
  const mail = await sql<{ status: string; n: number }>`select status, count(*)::int as n from message_intents where company_id = ${actor.companyId} group by status`;
  const stages = await sql<{ name: string; n: number }>`
    select s.name, count(*)::int as n
    from applications a join pipeline_stages s on s.company_id = a.company_id and s.id = a.current_stage_id
    where a.company_id = ${actor.companyId} group by s.name
  `;
  const judged = await sql<{ status: string; n: number }>`select status, count(*)::int as n from judge_runs where company_id = ${actor.companyId} group by status`;
  const cases = await sql<{ status: string; n: number }>`select status, count(*)::int as n from integrity_cases where company_id = ${actor.companyId} group by status`;
  return {
    mail,
    stages,
    judged,
    cases,
    denominator: "Counts are rows in this company. A missing score is not counted as zero.",
  };
}

export async function candidateTask(userId: string, taskId: string, status: string) {
  assertSameSiteRequest();
  const user = await requireUser(userId);
  if (status !== "DONE") throw new Error("You can mark your own task done.");
  const sql = await db();
  const rows = await sql<{ id: string; company_id: string }>`
    select t.id, t.company_id from onboarding_tasks t
    join pending_hires h on h.company_id = t.company_id and h.id = t.hire_id
    join applications a on a.company_id = h.company_id and a.id = h.application_id
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    where t.id = ${taskId} and t.candidate_visible = true and lower(c.email) = ${user.emailNormalized}
  `;
  if (!rows[0]) throw new Error("That task is not yours.");
  enterTenant({ userId: user.id, companyId: rows[0].company_id });
  await sql`update onboarding_tasks set status = 'DONE' where company_id = ${rows[0].company_id} and id = ${taskId}`;
  return { status: "DONE" };
}
