import { assertSafeOutboundUrl, roleHas } from "@/domain/rules";
import { biLocalPlan, sandboxSpec, textPlan } from "@/domain/ops";
import { integrationHealth } from "@/domain/platform/adapters";
import { isolateAvailable } from "./runner.server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, db, json, nid, requireActor } from "./db.server";

const DATASETS = ["pipeline", "scores", "assignments"] as const;
type Dataset = (typeof DATASETS)[number];

export async function ensureOpsDefaults(companyId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  const profileId = nid();
  await sql`
    insert into sandbox_profiles (id, company_id, name, timeout_ms, max_output_chars, note)
    select ${profileId}, ${companyId}, 'Node sample', 1500, 4000,
      'Separate Node process. Network and filesystem stay denied. Output is not a score.'
    where not exists (
      select 1 from sandbox_profiles where company_id = ${companyId} and name = 'Node sample'
    )
  `;
  await sql`
    update assessments a
    set sandbox_profile_id = p.id
    from sandbox_profiles p
    where a.company_id = ${companyId}
      and p.company_id = a.company_id
      and p.name = 'Node sample'
      and a.name = 'Timed coding screen'
      and a.sandbox_profile_id is null
  `;
  await sql`
    insert into company_configs (company_id) values (${companyId})
    on conflict (company_id) do nothing
  `;
  await sql`
    insert into workflow_rules (id, company_id, name, enabled, trigger_name, conditions, actions)
    select ${nid()}, ${companyId}, 'Text when an assessment is completed', false, 'ASSESSMENT_COMPLETED',
      '[]'::jsonb, ${json([{ type: "send_text", body: "Your assessment was received. A person still reviews the result." }])}::jsonb
    where not exists (
      select 1 from workflow_rules
      where company_id = ${companyId} and name = 'Text when an assessment is completed'
    )
  `;
  await sql`
    insert into workflow_rules (id, company_id, name, enabled, trigger_name, conditions, actions)
    select ${nid()}, ${companyId}, 'Pipe a fact when an assessment is completed', false, 'ASSESSMENT_COMPLETED',
      '[]'::jsonb, ${json([{ type: "pipe_analytics" }])}::jsonb
    where not exists (
      select 1 from workflow_rules
      where company_id = ${companyId} and name = 'Pipe a fact when an assessment is completed'
    )
  `;
}

export async function listSandboxes(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  const { ensureCodingBank } = await import("./bank.server");
  await ensureCodingBank(actor.companyId);
  await ensureOpsDefaults(actor.companyId);
  const sql = await db();
  const profiles = await sql<{
    id: string;
    name: string;
    runtime: string;
    timeout_ms: number;
    max_output_chars: number;
    network: string;
    filesystem: string;
    note: string;
  }>`
    select id, name, runtime, timeout_ms, max_output_chars, network, filesystem, note
    from sandbox_profiles where company_id = ${actor.companyId}
    order by created_at
  `;
  const assessments = await sql<{ id: string; name: string; sandbox_profile_id: string | null }>`
    select id, name, sandbox_profile_id from assessments
    where company_id = ${actor.companyId} and archived = false
    order by name
  `;
  return {
    canEdit: roleHas(actor.role, "assessment.publish"),
    profiles,
    assessments,
  };
}

export async function saveSandbox(
  userId: string,
  input: { slug: string; name: string; timeoutMs: number; maxOutputChars: number },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.publish");
  const spec = sandboxSpec({ timeoutMs: input.timeoutMs, maxOutputChars: input.maxOutputChars });
  if ("error" in spec) throw new Error(spec.error);
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) throw new Error("Name the sandbox.");
  const sql = await db();
  const id = nid();
  try {
    await sql`
      insert into sandbox_profiles (id, company_id, name, timeout_ms, max_output_chars, note)
      values (
        ${id}, ${actor.companyId}, ${name}, ${spec.timeoutMs}, ${spec.maxOutputChars},
        ${"Node only. Network denied. Filesystem denied. A run is not a score."}
      )
    `;
  } catch {
    throw new Error("A sandbox with that name already exists.");
  }
  await audit(actor, "sandbox.create", "sandbox", id, name);
  return { id };
}

export async function attachSandbox(userId: string, input: { slug: string; assessmentId: string; sandboxId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "assessment.publish");
  const sql = await db();
  const sandboxId = input.sandboxId.trim();
  if (sandboxId) {
    const found = await sql`select id from sandbox_profiles where id = ${sandboxId} and company_id = ${actor.companyId}`;
    if (!found[0]) throw new Error("That sandbox is not in this company.");
  }
  const updated = await sql`
    update assessments set sandbox_profile_id = ${sandboxId || null}
    where id = ${input.assessmentId} and company_id = ${actor.companyId}
    returning id
  `;
  if (!updated[0]) throw new Error("Not found.");
  return { ok: true };
}

export async function sandboxForAttempt(companyId: string, attemptId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  const rows = await sql<{ name: string; timeout_ms: number; max_output_chars: number }>`
    select p.name, p.timeout_ms, p.max_output_chars
    from attempts t
    join assignments g on g.id = t.assignment_id and g.company_id = t.company_id
    join assessment_versions v on v.id = g.assessment_version_id and v.company_id = g.company_id
    join assessments a on a.id = v.assessment_id and a.company_id = v.company_id
    join sandbox_profiles p on p.id = a.sandbox_profile_id and p.company_id = a.company_id
    where t.id = ${attemptId} and t.company_id = ${companyId}
  `;
  return rows[0] ?? null;
}

async function configRow(companyId: string) {
  const sql = await db();
  await sql`insert into company_configs (company_id) values (${companyId}) on conflict (company_id) do nothing`;
  const rows = await sql<{ text_sender_label: string; bi_destination: string; bi_dataset: string }>`
    select text_sender_label, bi_destination, bi_dataset from company_configs where company_id = ${companyId}
  `;
  return rows[0] ?? { text_sender_label: "RECRUIT4US", bi_destination: "", bi_dataset: "pipeline" };
}

export async function getConnectors(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  await ensureOpsDefaults(actor.companyId);
  const config = await configRow(actor.companyId);
  const canText = roleHas(actor.role, "workflow.manage");
  const canPipe = roleHas(actor.role, "report.read");
  const sql = await db();
  const texts = canText
    ? await sql<{ id: string; to_phone: string; body: string; status: string; reason: string; at: string }>`
        select id, to_phone, body, status, reason,
          to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
        from text_messages where company_id = ${actor.companyId}
        order by created_at desc limit 40
      `
    : [];
  const deliveries = canPipe
    ? await sql<{ id: string; dataset: string; row_count: number; status: string; destination: string; detail: string; at: string }>`
        select id, dataset, row_count, status, destination, detail,
          to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
        from bi_deliveries where company_id = ${actor.companyId}
        order by created_at desc limit 40
      `
    : [];
  return {
    canConfigure: roleHas(actor.role, "integration.manage"),
    canText,
    canPipe,
    senderLabel: config.text_sender_label,
    destination: config.bi_destination,
    dataset: config.bi_dataset,
    texts: texts.map((row) => ({
      id: row.id,
      toPhone: row.to_phone,
      body: row.body,
      status: row.status,
      reason: row.reason,
      at: row.at,
    })),
    deliveries: deliveries.map((row) => ({
      id: row.id,
      dataset: row.dataset,
      rowCount: Number(row.row_count),
      status: row.status,
      destination: row.destination,
      detail: row.detail,
      at: row.at,
    })),
    health: integrationHealth({
      smtpHost: Boolean(process.env.MAIL_SMTP_HOST),
      mailFrom: Boolean(process.env.MAIL_FROM),
      inboundSecret: Boolean(process.env.MAIL_INBOUND_SECRET),
      calendarVendor: Boolean(process.env.CALENDAR_VENDOR_URL),
      calendarToken: Boolean(process.env.CALENDAR_REFRESH_TOKEN),
      jobBoard: Boolean(process.env.JOB_BOARD_URL && process.env.JOB_BOARD_TOKEN),
      hris: Boolean(process.env.HRIS_EXPORT_URL && process.env.HRIS_EXPORT_TOKEN),
      unshare: isolateAvailable(),
    }),
    queue: await sql<{ status: string; n: number }>`
      select status, count(*)::int as n from message_intents where company_id = ${actor.companyId} group by status order by status
    `,
  };
}

export async function saveConnectorConfig(
  userId: string,
  input: { slug: string; senderLabel: string; destination: string; dataset: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "integration.manage");
  const destination = input.destination.trim().slice(0, 300);
  if (destination) assertSafeOutboundUrl(destination, false);
  const dataset = (DATASETS as readonly string[]).includes(input.dataset) ? input.dataset : "pipeline";
  const label = input.senderLabel.trim().slice(0, 40) || "RECRUIT4US";
  const sql = await db();
  await sql`
    insert into company_configs (company_id, text_sender_label, bi_destination, bi_dataset)
    values (${actor.companyId}, ${label}, ${destination}, ${dataset})
    on conflict (company_id) do update
      set text_sender_label = ${label}, bi_destination = ${destination}, bi_dataset = ${dataset}
  `;
  await audit(actor, "connector.config", "company", actor.companyId, destination ? "Analytics destination saved." : "Analytics destination cleared.");
  return { ok: true };
}

async function insertText(companyId: string, plan: ReturnType<typeof textPlan>, relatedId: string | null) {
  const sql = await db();
  const config = await configRow(companyId);
  const reason = plan.status === "CAPTURED" ? `Sender label ${config.text_sender_label}. ${plan.reason}` : plan.reason;
  await sql`
    insert into text_messages (id, company_id, to_phone, body, status, reason, related_id)
    values (${nid()}, ${companyId}, ${plan.to}, ${plan.body}, ${plan.status}, ${reason}, ${relatedId})
  `;
  return reason;
}

export async function sendDirectText(userId: string, input: { slug: string; phone: string; body: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "workflow.manage");
  const plan = textPlan(input.phone, input.body);
  const reason = await insertText(actor.companyId, plan, null);
  await audit(actor, "text.capture", "company", actor.companyId, reason);
  return { status: plan.status, reason };
}

export async function sendApplicationText(userId: string, input: { slug: string; applicationId: string; body: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "workflow.manage");
  const reason = await captureTextForApplication(actor.companyId, input.applicationId, input.body);
  await audit(actor, "text.capture", "application", input.applicationId, reason);
  return { reason };
}

export async function captureTextForApplication(companyId: string, applicationId: string, body: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  const people = await sql<{ phone: string | null }>`
    select c.phone from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    where a.id = ${applicationId} and a.company_id = ${companyId}
  `;
  if (!people[0]) return "Application no longer exists.";
  return insertText(companyId, textPlan(people[0].phone, body), applicationId);
}

export async function recordWorkflowFact(
  companyId: string,
  fact: { eventType: string; applicationId: string; basisPoints: unknown; scoreStatus: unknown },
) {
  enterTenant({ companyId, publicSlug: "" });
  const config = await configRow(companyId);
  const row = {
    eventType: fact.eventType,
    applicationId: fact.applicationId || null,
    basisPoints: typeof fact.basisPoints === "number" ? fact.basisPoints : null,
    scoreStatus: typeof fact.scoreStatus === "string" ? fact.scoreStatus : null,
  };
  const result = await deliver(companyId, "workflow", [row], config.bi_destination);
  return result.detail;
}

export async function pipeAnalytics(userId: string, input: { slug: string; dataset: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "report.read");
  if (!(DATASETS as readonly string[]).includes(input.dataset)) throw new Error("That extract is not available.");
  const dataset = input.dataset as Dataset;
  await ensureOpsDefaults(actor.companyId);
  const config = await configRow(actor.companyId);
  const rows = await extract(actor.companyId, dataset);
  const result = await deliver(actor.companyId, dataset, rows, config.bi_destination);
  await audit(actor, "analytics.pipe", "company", actor.companyId, result.detail);
  return result;
}

async function extract(companyId: string, dataset: Dataset): Promise<Record<string, unknown>[]> {
  const sql = await db();
  if (dataset === "pipeline") {
    const rows = await sql<{ stage: string; applications: number }>`
      select s.category as stage, count(*)::int as applications
      from applications a
      join pipeline_stages s on s.id = a.current_stage_id and s.company_id = a.company_id
      where a.company_id = ${companyId} and a.lifecycle = 'ACTIVE'
      group by s.category
      order by s.category
    `;
    return rows.map((row) => ({ stage: row.stage, applications: Number(row.applications) }));
  }
  if (dataset === "scores") {
    const rows = await sql<{ application_id: string; basis_points: number; origin: string }>`
      select g.application_id, e.basis_points, e.origin
      from evaluations e
      join attempts t on t.id = e.attempt_id and t.company_id = e.company_id
      join assignments g on g.id = t.assignment_id and g.company_id = t.company_id
      where e.company_id = ${companyId} and e.status = 'FINAL' and e.basis_points is not null
        and e.revision = (select max(e2.revision) from evaluations e2 where e2.attempt_id = e.attempt_id and e2.company_id = e.company_id)
      order by e.created_at desc
      limit 200
    `;
    return rows.map((row) => ({
      applicationId: row.application_id,
      basisPoints: Number(row.basis_points),
      origin: row.origin,
    }));
  }
  const rows = await sql<{ assessment: string; status: string; n: number }>`
    select s.name as assessment, g.status, count(*)::int as n
    from assignments g
    join assessment_versions v on v.id = g.assessment_version_id and v.company_id = g.company_id
    join assessments s on s.id = v.assessment_id and s.company_id = v.company_id
    where g.company_id = ${companyId}
    group by s.name, g.status
    order by s.name, g.status
  `;
  return rows.map((row) => ({ assessment: row.assessment, status: row.status, count: Number(row.n) }));
}

async function deliver(companyId: string, dataset: string, rows: Record<string, unknown>[], destination: string) {
  const plan = biLocalPlan(destination, rows.length);
  let status: "CAPTURED" | "DELIVERED" | "REFUSED" | "FAILED" = plan.status === "ATTEMPT" ? "FAILED" : plan.status;
  let detail = plan.detail;
  let storedDestination = "";
  if (plan.status === "ATTEMPT") {
    let url: URL | null = null;
    try {
      url = assertSafeOutboundUrl(destination, false);
    } catch (error) {
      status = "REFUSED";
      detail = error instanceof Error ? error.message : "That destination is not allowed.";
    }
    if (url) {
      storedDestination = url.toString().slice(0, 300);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dataset, rows, namesIncluded: false }),
          signal: AbortSignal.timeout(4000),
        });
        status = response.ok ? "DELIVERED" : "FAILED";
        detail = response.ok
          ? `Delivered ${rows.length} rows. No API key was attached. Names are not included.`
          : `The destination responded ${response.status}. The extract is stored here. No API key was attached.`;
      } catch (error) {
        status = "FAILED";
        const message = error instanceof Error ? error.message : "The destination could not be reached.";
        detail = `${message} The extract is stored here and was not delivered.`;
      }
    }
  }
  const sql = await db();
  await sql`
    insert into bi_deliveries (id, company_id, dataset, row_count, status, destination, detail, payload)
    values (
      ${nid()}, ${companyId}, ${dataset}, ${rows.length}, ${status}, ${storedDestination || destination.trim().slice(0, 300)},
      ${detail.slice(0, 400)}, ${json({ dataset, rows, namesIncluded: false })}::jsonb
    )
  `;
  return { status, detail, rowCount: rows.length };
}
