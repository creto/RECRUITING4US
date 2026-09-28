import { outboxDisposition, triAnd, triEq, triScoreAtLeast, type Tri } from "@/domain/rules";
import { signBody, webhookVerdict } from "@/domain/completion";
import { providerCallbackDecision } from "@/domain/edge";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, db, enqueue, nid, requireActor } from "./db.server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";

type EventRow = {
  id: string;
  company_id: string;
  event_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  depth: number;
};

type RuleRow = {
  id: string;
  name: string;
  enabled: boolean;
  trigger_name: string;
  conditions: { field: string; op: string; value: string }[];
  actions: { type: string; tag?: string; category?: string; subject?: string; body?: string }[];
  version: number;
};

export async function drain(companyId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const sql = await db();
  if (outboxDisposition(5, false) === "fail") {
    await sql`
      update outbox_events set status = 'FAILED', last_error = 'Retry limit reached.'
      where company_id = ${companyId} and status = 'PENDING' and attempts >= 5
    `;
  }
  const events = await sql<EventRow>`
    update outbox_events e
    set lease_until = now() + interval '2 minutes',
        attempts = attempts + 1
    from (
      select id from outbox_events
      where company_id = ${companyId}
        and status = 'PENDING'
        and attempts < 5
        and (lease_until is null or lease_until < now())
      order by created_at
      limit 20
      for update skip locked
    ) claimed
    where e.id = claimed.id
    returning e.id, e.company_id, e.event_type, e.aggregate_id, e.payload, e.depth
  `;
  for (const event of events) {
    try {
      await applyEvent(event);
      await sql`
        update outbox_events
        set status = 'PROCESSED', processed_at = now(), lease_until = null, last_error = ''
        where id = ${event.id} and status = 'PENDING'
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow failed";
      await sql`
        update outbox_events
        set status = case when attempts >= 5 then 'FAILED' else 'PENDING' end,
            lease_until = null,
            last_error = ${message.slice(0, 240)}
        where id = ${event.id}
      `;
      await audit(
        { companyId, userId: null },
        "workflow.failed",
        "outbox",
        event.id,
        message.slice(0, 240),
      );
    }
  }
}

async function applyEvent(event: EventRow) {
  if (event.depth > 4) {
    await audit(
      { companyId: event.company_id, userId: null },
      "workflow.depth",
      "outbox",
      event.id,
      "Stopped a workflow chain that exceeded the depth limit.",
    );
    return;
  }
  const sql = await db();
  const rules = await sql<RuleRow>`
    select id, name, enabled, trigger_name, conditions, actions, version
    from workflow_rules
    where company_id = ${event.company_id} and enabled = true and trigger_name = ${event.event_type}
  `;
  for (const rule of rules) {
    if (explainRule(rule.conditions ?? [], event.payload).verdict !== "true") continue;
    const actions = rule.actions ?? [];
    for (let index = 0; index < actions.length; index += 1) {
      const seen = await sql<{ id: string }>`
        select id from workflow_action_receipts
        where company_id = ${event.company_id} and event_id = ${event.id}
          and rule_id = ${rule.id} and action_index = ${index}
      `;
      if (seen[0]) continue;
      const detail = await perform(event, actions[index]!);
      await sql`
        insert into workflow_action_receipts
          (id, company_id, event_id, rule_id, action_index, status, detail)
        values (${nid()}, ${event.company_id}, ${event.id}, ${rule.id}, ${index}, 'DONE', ${detail.slice(0, 300)})
      `;
    }
  }
}

export function explainRule(
  conditions: { field: string; op: string; value: string }[],
  payload: Record<string, unknown>,
): { verdict: Tri; lines: string[] } {
  if (!conditions.length) return { verdict: "true", lines: ["No conditions — the trigger is enough."] };
  const lines: string[] = [];
  const values: Tri[] = [];
  for (const condition of conditions) {
    const tri = evaluate(condition, payload);
    values.push(tri);
    lines.push(`${condition.field} ${condition.op} ${condition.value}: ${tri}`);
  }
  return { verdict: triAnd(values), lines };
}

function evaluate(condition: { field: string; op: string; value: string }, payload: Record<string, unknown>): Tri {
  if (condition.field === "score") {
    const status = payload.scoreStatus === "FINAL" || payload.scoreStatus === "PENDING" || payload.scoreStatus === "FAILED"
      ? payload.scoreStatus
      : "PENDING";
    const basis = typeof payload.basisPoints === "number" ? payload.basisPoints : null;
    return triScoreAtLeast(basis, status, Number(condition.value));
  }
  const actual = payload[condition.field];
  const text = typeof actual === "string" ? actual : null;
  if (condition.op === "eq") return triEq(text, condition.value);
  return "unknown";
}

async function perform(event: EventRow, action: RuleRow["actions"][number]): Promise<string> {
  const sql = await db();
  const applicationId = String(event.payload.applicationId ?? "");
  if (action.type === "create_review") {
    const attemptId = String(event.payload.attemptId ?? "");
    if (!attemptId) return "No attempt on this event.";
    return ensureReview(event.company_id, attemptId, applicationId);
  }
  if (action.type === "pipe_analytics") {
    const { recordWorkflowFact } = await import("./ops.server");
    return recordWorkflowFact(event.company_id, {
      eventType: event.event_type,
      applicationId,
      basisPoints: event.payload.basisPoints,
      scoreStatus: event.payload.scoreStatus,
    });
  }
  if (!applicationId) return "No application on this event.";
  const apps = await sql<{ lifecycle: string; candidate_id: string; job_id: string }>`
    select lifecycle, candidate_id, job_id from applications
    where id = ${applicationId} and company_id = ${event.company_id}
  `;
  const app = apps[0];
  if (!app) return "Application no longer exists.";
  if (app.lifecycle !== "ACTIVE" && action.type !== "add_tag") {
    return "Skipped because the application is not active.";
  }
  if (action.type === "add_tag" && action.tag) {
    const tagId = nid();
    await sql`
      insert into tags (id, company_id, name) values (${tagId}, ${event.company_id}, ${action.tag})
      on conflict (company_id, name) do nothing
    `;
    const tags = await sql<{ id: string }>`
      select id from tags where company_id = ${event.company_id} and name = ${action.tag}
    `;
    if (tags[0]) {
      await sql`
        insert into candidate_tags (company_id, candidate_id, tag_id)
        values (${event.company_id}, ${app.candidate_id}, ${tags[0].id})
        on conflict do nothing
      `;
    }
    return `Tag ${action.tag} added.`;
  }
  if (action.type === "move_stage" && action.category) {
    const stages = await sql<{ id: string }>`
      select id from pipeline_stages
      where company_id = ${event.company_id} and job_id = ${app.job_id}
        and category = ${action.category} and archived = false
      order by position limit 1
    `;
    if (!stages[0]) return "No matching stage.";
    await sql`
      update applications set current_stage_id = ${stages[0].id}, version = version + 1
      where id = ${applicationId} and company_id = ${event.company_id} and lifecycle = 'ACTIVE'
    `;
    await sql`
      insert into stage_events (id, company_id, application_id, to_stage_id, actor_user_id, reason)
      values (${nid()}, ${event.company_id}, ${applicationId}, ${stages[0].id}, null, ${"Workflow rule"})
    `;
    return `Moved toward ${action.category}.`;
  }
  if (action.type === "send_email") {
    const people = await sql<{ email: string }>`
      select c.email from candidates c
      join applications a on a.candidate_id = c.id and a.company_id = c.company_id
      where a.id = ${applicationId} and a.company_id = ${event.company_id}
    `;
    const to = people[0]?.email;
    if (!to) return "No recipient.";
    await sql`
      insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
      values (
        ${nid()}, ${event.company_id}, ${to},
        ${action.subject ?? "Update on your application"},
        ${action.body ?? "There is an update on your application."},
        'CAPTURED', ${applicationId}
      )
    `;
    return "Email captured locally. It was not sent to the public internet.";
  }
  if (action.type === "send_text") {
    const { captureTextForApplication } = await import("./ops.server");
    return captureTextForApplication(event.company_id, applicationId, action.body ?? "");
  }
  return "Unsupported action skipped.";
}

export async function ensureReview(companyId: string, attemptId: string, applicationId: string) {
  const sql = await db();
  const existing = await sql<{ id: string }>`
    select id from review_tasks
    where company_id = ${companyId} and attempt_id = ${attemptId} and status = 'OPEN'
  `;
  if (existing[0]) return "Review task already open.";
  const manual = await sql<{ id: string }>`
    select i.id
    from attempt_items i
    join question_versions q on q.id = i.question_version_id and q.company_id = i.company_id
    join questions qu on qu.id = q.question_id and qu.company_id = q.company_id
    where i.attempt_id = ${attemptId} and i.company_id = ${companyId}
      and qu.type in ('text', 'code', 'file', 'sql', 'spreadsheet', 'recording')
  `;
  if (!manual.length) return "No human-graded items.";
  await sql`
    insert into review_tasks (id, company_id, attempt_id, application_id, status)
    values (${nid()}, ${companyId}, ${attemptId}, ${applicationId}, 'OPEN')
  `;
  return "Review task created.";
}

export async function simulate(companyId: string, ruleId: string, applicationId: string) {
  const sql = await db();
  const rules = await sql<RuleRow>`
    select id, name, enabled, trigger_name, conditions, actions, version
    from workflow_rules where id = ${ruleId} and company_id = ${companyId}
  `;
  const rule = rules[0];
  if (!rule) throw new Error("Not found.");
  const apps = await sql<{ lifecycle: string; source: string; job_id: string }>`
    select lifecycle, source, job_id from applications
    where id = ${applicationId} and company_id = ${companyId}
  `;
  const app = apps[0];
  if (!app) throw new Error("Not found.");
  const payload = {
    applicationId,
    jobId: app.job_id,
    source: app.source,
    lifecycle: app.lifecycle,
    scoreStatus: "PENDING",
    basisPoints: null,
  };
  const explained = explainRule(rule.conditions ?? [], payload);
  return {
    sideEffects: false,
    enabled: rule.enabled,
    verdict: explained.verdict,
    lines: explained.lines,
    actions: (rule.actions ?? []).map((action) => action.type),
    note: "Simulation does not change records or send mail.",
  };
}

export async function rememberEvent(
  companyId: string,
  eventType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  depth = 0,
) {
  await enqueue(companyId, eventType, aggregateId, payload, depth);
  await drain(companyId);
}

export async function receiveWebhook(
  userId: string,
  input: { slug: string; provider: string; eventKey: string; body: string; signature: string | null },
) {
  assertSameSiteRequest();
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return { accepted: false, reason: "No webhook secret is configured. The event was not stored." };
  }
  const actor = await requireActor(userId, input.slug);
  allow(actor, "integration.manage");
  const sql = await db();
  const seen = await sql`
    select id from webhook_receipts
    where company_id = ${actor.companyId} and provider = ${input.provider} and event_key = ${input.eventKey}
  `;
  const verdict = webhookVerdict({
    signature: input.signature,
    expected: signBody(secret, input.body),
    seen: Boolean(seen[0]),
  });
  if (verdict !== "accept") throw new Error(`Webhook ${verdict}.`);
  await sql`
    insert into webhook_receipts (id, company_id, provider, event_key)
    values (${nid()}, ${actor.companyId}, ${input.provider.slice(0, 40)}, ${input.eventKey.slice(0, 120)})
  `;
  return { accepted: true, companyId: actor.companyId };
}

/** Provider completion. Without a secret, nothing is stored. The company comes from the attempt, not the body. */
export async function receiveProviderCallback(input: {
  attemptId: string;
  eventKey: string;
  body: string;
  signature: string | null;
  bodyCompanyId: string;
  bodyAssignmentId: string;
  incoming: "RUNNING" | "SUCCEEDED" | "FAILED";
}) {
  const secret = process.env.PROVIDER_CALLBACK_SECRET;
  if (!secret) return { accepted: false, stored: false, reason: "No provider callback secret is configured. Nothing was stored." };
  const sql = await db();
  const owners = await sql<{ company_id: string; assignment_id: string; status: string }>`
    select company_id, assignment_id, status from app_attempt_owner(${input.attemptId})
  `;
  const owner = owners[0];
  if (!owner) return { accepted: false, stored: false, reason: "That attempt is not on record." };
  enterTenant({ companyId: owner.company_id, publicSlug: "" });
  const seenRows = await sql<{ id: string }>`
    select id from provider_callbacks
    where company_id = ${owner.company_id} and event_key = ${input.eventKey}
  `;
  const latest = await sql<{ status: string }>`
    select status from provider_callbacks
    where company_id = ${owner.company_id} and attempt_id = ${input.attemptId}
    order by created_at desc limit 1
  `;
  const current = latest[0]?.status === "RUNNING" || latest[0]?.status === "SUCCEEDED" || latest[0]?.status === "FAILED"
    ? latest[0].status
    : null;
  const decision = providerCallbackDecision({
    secretConfigured: true,
    signatureOk: webhookVerdict({
      signature: input.signature,
      expected: signBody(secret, input.body),
      seen: false,
    }) === "accept",
    bodyCompanyId: input.bodyCompanyId,
    recordCompanyId: owner.company_id,
    bodyAssignmentId: input.bodyAssignmentId,
    recordAssignmentId: owner.assignment_id,
    seen: Boolean(seenRows[0]),
    current,
    incoming: input.incoming,
  });
  if (decision !== "accept") return { accepted: false, stored: false, reason: decision };
  await sql`
    insert into provider_callbacks (id, company_id, attempt_id, event_key, status)
    values (${nid()}, ${owner.company_id}, ${input.attemptId}, ${input.eventKey.slice(0, 120)}, ${input.incoming})
  `;
  return { accepted: true, stored: true, companyId: owner.company_id };
}
