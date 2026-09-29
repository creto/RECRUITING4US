import { createHmac, timingSafeEqual } from "node:crypto";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { estimateComplexity } from "@/domain/judge";
import { applyDocument, applyOpChain, canSeeNote, type Edit } from "@/domain/platform/collab";
import { classifySandboxAddress, chooseMailApplication, deliveryLabel, isTerminal, nextState, renderTokens, retryDelayMinutes, stripQuotedReply, webhookFresh, brandHtml, brandPlain, type DeliveryState, type MailBrand } from "@/domain/platform/delivery";
import { htmlToPlain, looksLikeHtml, prepareMailBody } from "@/domain/mail-html";
import { extractOffice } from "@/domain/platform/docx";
import { disposeCase, similarityOpensCase, similarityPercent, signalChangesScore } from "@/domain/platform/integrity";
import { candidateCases, type Grade } from "@/domain/platform/score";
import { parseResumeProfile } from "@/domain/cv-index";
import { normalizeEmail, roleHas } from "@/domain/rules";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, db, json, mapDbError, nid, requireActor, requireUser, type Actor } from "./db.server";
import { judgeIsolated, JUDGE_RUNTIME } from "./runner.server";
import { sendSmtp, smtpConfigFromEnv } from "./smtp.server";
import { QUESTION_CORPUS } from "./question-corpus";
import { storeFileBytes } from "./object-store.server";

const AT = `to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

function mailMode(): { provider: "sandbox" | "smtp"; note: string } {
  if (smtpConfigFromEnv()) {
    return { provider: "smtp", note: "SMTP is configured. A 250 from the server is acceptance, not delivery. Delivery is recorded only when a signed provider event says so." };
  }
  return {
    provider: "sandbox",
    note: "No outside mail server is configured. A message is stored in the mailbox inside this workspace. Stored is not delivered, and it is not sent to an outside inbox.",
  };
}

async function companyOf(fn: "app_company_for_code" | "app_company_for_live" | "app_company_for_booking" | "app_company_for_thread", token: string): Promise<string | null> {
  const sql = await db();
  const found = await sql.query<{ company_id: string | null }>(`select ${fn}($1) as company_id`, [token]);
  return found[0]?.company_id ?? null;
}

async function companyBrand(companyId: string): Promise<MailBrand & { logoMime: string; logoBytes: string }> {
  const sql = await db();
  const rows = await sql<{
    name: string;
    mail_from_name: string;
    mail_footer: string;
    mail_logo_url: string;
    mail_logo_mime: string;
    mail_logo_bytes: string;
    embed_accent: string;
  }>`
    select name, mail_from_name, mail_footer, mail_logo_url, mail_logo_mime, mail_logo_bytes, embed_accent
    from companies where id = ${companyId}
  `;
  const row = rows[0];
  return {
    companyName: row?.name ?? "",
    fromName: row?.mail_from_name ?? "",
    footer: row?.mail_footer ?? "",
    logoUrl: row?.mail_logo_url ?? "",
    accent: row?.embed_accent ?? "",
    logoMime: row?.mail_logo_mime ?? "",
    logoBytes: row?.mail_logo_bytes ?? "",
  };
}

async function drain(actor: Actor) {
  const sql = await db();
  const mode = mailMode();
  const brand = await companyBrand(actor.companyId);
  const queued = await sql<{
    id: string;
    status: string;
    to_email: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    attempt_count: number;
    thread_token: string;
  }>`
    select id, status, to_email, cc, bcc, subject, body, attempt_count, thread_token
    from message_intents
    where company_id = ${actor.companyId}
      and status in ('QUEUED', 'DEFERRED')
      and (scheduled_for is null or scheduled_for <= now())
    order by created_at
    limit 15
  `;
  for (const row of queued) {
    const locked = await sql<{ id: string }>`
      update message_intents set status = 'SENDING'
      where company_id = ${actor.companyId} and id = ${row.id} and status in ('QUEUED', 'DEFERRED')
      returning id
    `;
    if (!locked[0]) continue;
    const suppressed = await sql<{ email: string }>`
      select email from mail_suppressions
      where company_id = ${actor.companyId} and email = ${normalizeEmail(row.to_email)}
    `;
    const attemptNo = row.attempt_count + 1;
    let providerResult: "accepted" | "delivered" | "stored" | "deferred" | "bounced" | "failed" = "stored";
    let detail = "";
    let providerId = "";
    if (suppressed[0]) {
      providerResult = "failed";
    } else if (mode.provider === "sandbox") {
      const kind = classifySandboxAddress(row.to_email);
      if (kind === "bounce") providerResult = "bounced";
      else if (kind === "fail") providerResult = "failed";
      else if (kind === "defer" && row.attempt_count === 0) providerResult = "deferred";
      else providerResult = "stored";
    } else {
      const sent = await smtpSend(row, brand);
      providerResult = sent.result;
      detail = sent.detail;
      providerId = sent.providerId;
    }
    const step = nextState({
      current: "SENDING",
      attemptNo,
      suppressed: Boolean(suppressed[0]),
      provider: suppressed[0] ? mode.provider : mode.provider,
      providerResult: suppressed[0] ? "none" : providerResult,
    });
    const finalDetail = suppressed[0] ? step.detail : detail || step.detail;
    const delay = step.retry ? retryDelayMinutes(attemptNo) : 0;
    await sql`
      update message_intents set
        status = ${step.state},
        provider = ${mode.provider},
        attempt_count = ${attemptNo},
        provider_message_id = ${providerId},
        last_error = ${finalDetail},
        scheduled_for = case when ${step.retry} then now() + make_interval(mins => ${delay}) else scheduled_for end
      where company_id = ${actor.companyId} and id = ${row.id}
    `;
    await sql`
      insert into delivery_attempts (id, company_id, intent_id, attempt_no, provider, state, detail)
      values (${nid()}, ${actor.companyId}, ${row.id}, ${attemptNo}, ${mode.provider}, ${step.state}, ${finalDetail})
    `;
    if (step.state === "STORED" && mode.provider === "sandbox") {
      const copy = mailCopy(row.body);
      await sql`
        insert into sandbox_mailbox (id, company_id, intent_id, to_email, subject, body)
        values (${nid()}, ${actor.companyId}, ${row.id}, ${row.to_email}, ${row.subject}, ${brandPlain(copy.text, brand)})
      `;
    }
    if (step.state === "BOUNCED") {
      await sql`
        insert into mail_suppressions (company_id, email, reason)
        values (${actor.companyId}, ${normalizeEmail(row.to_email)}, 'bounce')
        on conflict (company_id, email) do nothing
      `;
      await sql`
        update campaign_enrollments set status = 'BOUNCED'
        where company_id = ${actor.companyId} and status in ('QUEUED', 'SENT')
          and prospect_id in (
            select id from prospects where company_id = ${actor.companyId} and email = ${normalizeEmail(row.to_email)}
          )
      `;
    }
  }
}

async function smtpSend(
  row: { id: string; to_email: string; cc: string; bcc: string; subject: string; body: string },
  brand: MailBrand & { logoMime: string; logoBytes: string },
): Promise<{ result: "accepted" | "deferred" | "bounced" | "failed"; detail: string; providerId: string }> {
  const config = smtpConfigFromEnv();
  if (!config) return { result: "failed", detail: "SMTP is not configured.", providerId: "" };
  const recipients = [row.to_email, ...row.cc.split(","), ...row.bcc.split(",")]
    .map((item) => item.trim())
    .filter((item) => item.includes("@"));
  const copy = mailCopy(row.body);
  const logo = brand.logoBytes && (brand.logoMime === "image/png" || brand.logoMime === "image/jpeg")
    ? { mime: brand.logoMime, base64: brand.logoBytes }
    : null;
  const sent = await sendSmtp(config, {
    to: recipients,
    cc: row.cc,
    subject: row.subject,
    body: brandPlain(copy.text, brand),
    messageId: `${row.id}@recruit4us`,
    fromName: brand.fromName || brand.companyName,
    html: brandHtml(copy.htmlBody, brand, Boolean(logo), copy.rich),
    logo,
  });
  return { result: sent.result === "accepted" ? "accepted" : sent.result, detail: sent.detail, providerId: sent.result === "accepted" ? row.id : "" };
}

function mailCopy(body: string): { text: string; htmlBody: string; rich: boolean } {
  const prepared = prepareMailBody(body);
  const rich = looksLikeHtml(prepared);
  return { text: rich ? htmlToPlain(prepared) || " " : body, htmlBody: rich ? prepared : body, rich };
}

export async function listInbox(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  await drain(actor);
  const sql = await db();
  const mode = mailMode();
  const intents = await sql.query<Record<string, unknown>>(
    `select i.id, i.kind, i.to_email, i.cc, i.bcc, i.subject, i.status, i.provider, i.attempt_count, i.last_error, i.thread_token, i.application_id,
            c.name as candidate_name, j.title as job_title,
            ${AT.replaceAll("created_at", "i.created_at")} as created_at
     from message_intents i
     left join applications a on a.id = i.application_id and a.company_id = i.company_id
     left join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
     left join jobs j on j.id = a.job_id and j.company_id = a.company_id
     where i.company_id = $1 order by i.created_at desc limit 80`,
    [actor.companyId],
  );
  const inbound = await sql.query<Record<string, unknown>>(
    `select id, from_email, subject, body, matched, quarantine_reason, application_id, ${AT} as created_at
     from inbound_messages where company_id = $1 order by created_at desc limit 40`,
    [actor.companyId],
  );
  const suppressions = await sql.query<Record<string, unknown>>(
    `select email, reason, ${AT} as created_at
     from mail_suppressions where company_id = $1 order by created_at desc limit 80`,
    [actor.companyId],
  );
  const config = smtpConfigFromEnv();
  return {
    note: mode.note,
    provider: mode.provider,
    sender: config?.from ?? "",
    externalBlocked: !config,
    setup: config
      ? "SMTP is configured. A 250 is accepted, not delivered. Delivery, bounce, and complaint come from a signed POST /api/mail/events."
      : "External delivery is blocked until MAIL_SMTP_HOST, MAIL_SMTP_PORT, and MAIL_FROM are set. Optional: MAIL_SMTP_USER, MAIL_SMTP_PASSWORD, MAIL_INBOUND_SECRET.",
    intents: intents.map((row) => ({ ...row, state_label: deliveryLabel(String(row.status ?? "")) })),
    inbound,
    suppressions,
    secretConfigured: Boolean(process.env.MAIL_INBOUND_SECRET),
  };
}

export async function queueMail(userId: string, slug: string, input: {
  applicationId: string;
  kind: string;
  subject: string;
  body: string;
  cc: string;
  bcc: string;
  idempotencyKey: string;
}) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const recent = await sql<{ n: number }>`
    select count(*)::int as n from message_intents
    where company_id = ${actor.companyId} and created_at > now() - interval '1 minute'
  `;
  if ((recent[0]?.n ?? 0) >= 30) throw new Error("Too many messages were queued in the last minute. Wait and try again.");
  const apps = await sql<{ email: string; name: string; title: string; candidate_id: string; job_id: string }>`
    select c.email, c.name, j.title, a.candidate_id, a.job_id
    from applications a
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    join jobs j on j.company_id = a.company_id and j.id = a.job_id
    where a.company_id = ${actor.companyId} and a.id = ${input.applicationId}
  `;
  const app = apps[0];
  if (!app?.email) throw new Error("This application has no email address.");
  const tokens = {
    candidate_name: app.name,
    job_title: app.title,
    company_name: actor.companyName,
    recruiter_name: actor.name,
  };
  const subject = renderTokens(input.subject, tokens).slice(0, 200);
  const body = prepareMailBody(renderTokens(input.body, tokens));
  const bodyPlain = looksLikeHtml(body) ? htmlToPlain(body) : body;
  if (subject.trim().length < 2 || bodyPlain.trim().length < 2) throw new Error("Write a subject and a message.");
  const id = nid();
  const thread = nid().replace(/-/g, "");
  try {
    const inserted = await sql<{ id: string }>`
      insert into message_intents (
        id, company_id, application_id, candidate_id, job_id, kind, subject, body, to_email, cc, bcc,
        idempotency_key, status, provider, thread_token, created_by
      ) values (
        ${id}, ${actor.companyId}, ${input.applicationId}, ${app.candidate_id}, ${app.job_id}, ${input.kind},
        ${subject}, ${body}, ${app.email}, ${input.cc.slice(0, 500)}, ${input.bcc.slice(0, 500)},
        ${input.idempotencyKey}, 'QUEUED', ${mailMode().provider}, ${thread}, ${actor.userId}
      )
      on conflict (company_id, idempotency_key) do nothing
      returning id
    `;
    await audit(actor, "mail.queue", "message_intent", inserted[0]?.id ?? id, `Queued ${input.kind} to ${app.email}`);
    await drain(actor);
    return { id: inserted[0]?.id ?? id, duplicate: !inserted[0], note: mailMode().note };
  } catch (error) {
    mapDbError(error);
  }
}

export async function resolveApplicationId(
  companyId: string,
  input: { applicationId?: string; candidateName?: string },
): Promise<string> {
  const sql = await db();
  const applicationId = (input.applicationId ?? "").trim();
  const name = (input.candidateName ?? "").trim();
  if (applicationId.length >= 8) {
    const hit = await sql<{ id: string }>`
      select id from applications where company_id = ${companyId} and id = ${applicationId}
    `;
    if (!hit[0]) throw new Error("No application matches that id.");
    return hit[0].id;
  }
  if (name.length < 2) throw new Error("Give an application id or a candidate name.");
  const key = name.toLowerCase().replace(/\s+/g, " ");
  const rows = await sql<{ id: string; lifecycle: string; title: string; name: string }>`
    select a.id, a.lifecycle, j.title, c.name
    from applications a
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    join jobs j on j.company_id = a.company_id and j.id = a.job_id
    where a.company_id = ${companyId}
      and lower(regexp_replace(trim(c.name), '\\s+', ' ', 'g')) = ${key}
    order by a.submitted_at desc
    limit 30
  `;
  const chosen = chooseMailApplication(rows);
  if ("error" in chosen) throw new Error(chosen.error);
  return chosen.id;
}

export async function queueNamedMail(userId: string, slug: string, input: {
  applicationId?: string;
  candidateName?: string;
  kind: string;
  subject: string;
  body: string;
  cc: string;
  bcc: string;
  idempotencyKey: string;
}) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const applicationId = await resolveApplicationId(actor.companyId, input);
  return queueMail(userId, slug, { ...input, applicationId });
}

export async function queueProspectMail(userId: string, slug: string, input: {
  email: string;
  name: string;
  kind: string;
  subject: string;
  body: string;
  idempotencyKey: string;
  applicationId?: string | null;
}) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const recent = await sql<{ n: number }>`
    select count(*)::int as n from message_intents
    where company_id = ${actor.companyId} and created_at > now() - interval '1 minute'
  `;
  if ((recent[0]?.n ?? 0) >= 30) throw new Error("Too many messages were queued in the last minute. Wait and try again.");
  const to = normalizeEmail(input.email);
  if (!to.includes("@")) throw new Error("That address is not usable.");
  const tokens = { candidate_name: input.name, company_name: actor.companyName, recruiter_name: actor.name, job_title: "" };
  const subject = renderTokens(input.subject, tokens).slice(0, 200);
  const body = prepareMailBody(renderTokens(input.body, tokens));
  const bodyPlain = looksLikeHtml(body) ? htmlToPlain(body) : body;
  if (subject.trim().length < 2 || bodyPlain.trim().length < 2) throw new Error("Write a subject and a message.");
  const id = nid();
  const thread = nid().replace(/-/g, "");
  const inserted = await sql<{ id: string }>`
    insert into message_intents (
      id, company_id, application_id, kind, subject, body, to_email, cc, bcc,
      idempotency_key, status, provider, thread_token, created_by
    ) values (
      ${id}, ${actor.companyId}, ${input.applicationId ?? null}, ${input.kind},
      ${subject}, ${body}, ${to}, '', '',
      ${input.idempotencyKey}, 'QUEUED', ${mailMode().provider}, ${thread}, ${actor.userId}
    )
    on conflict (company_id, idempotency_key) do nothing
    returning id
  `;
  await audit(actor, "mail.queue", "message_intent", inserted[0]?.id ?? id, `Queued ${input.kind} to ${to}`);
  await drain(actor);
  return { id: inserted[0]?.id ?? id, duplicate: !inserted[0], note: mailMode().note };
}

export async function suppressAddress(userId: string, slug: string, email: string, reason: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const normalized = normalizeEmail(email);
  await sql`
    insert into mail_suppressions (company_id, email, reason)
    values (${actor.companyId}, ${normalized}, ${reason.slice(0, 200)})
    on conflict (company_id, email) do update set reason = excluded.reason
  `;
  await audit(actor, "mail.suppress", "suppression", normalized, reason.slice(0, 200));
  return { email: normalized };
}

export async function unsuppressAddress(userId: string, slug: string, email: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const normalized = normalizeEmail(email);
  const removed = await sql<{ email: string }>`
    delete from mail_suppressions
    where company_id = ${actor.companyId} and email = ${normalized}
    returning email
  `;
  if (!removed[0]) throw new Error("That address is not suppressed.");
  await audit(actor, "mail.unsuppress", "suppression", normalized, "Suppression removed.");
  return { email: normalized };
}

export async function receiveMailEvent(input: { body: string; timestamp: string; signature: string | null }) {
  const secret = process.env.MAIL_INBOUND_SECRET ?? "";
  if (!secret) return { accepted: false, stored: false, reason: "MAIL_INBOUND_SECRET is not set. The event was not stored." };
  if (!input.signature || !webhookFresh(Date.now(), Number(input.timestamp))) {
    return { accepted: false, stored: false, reason: "The signature or timestamp was rejected." };
  }
  const mac = createHmac("sha256", secret).update(`${input.timestamp}.${input.body}`).digest("hex");
  const left = Buffer.from(mac);
  const right = Buffer.from(input.signature);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { accepted: false, stored: false, reason: "The signature did not match." };
  }
  let parsed: { eventId?: string; threadToken?: string; type?: string; from?: string; subject?: string; text?: string } = {};
  try {
    parsed = JSON.parse(input.body) as typeof parsed;
  } catch {
    return { accepted: false, stored: false, reason: "The body is not JSON." };
  }
  if (!parsed.eventId || !parsed.threadToken || !parsed.type) {
    return { accepted: false, stored: false, reason: "The event is missing an id, thread, or type." };
  }
  const companyId = await companyOf("app_company_for_thread", parsed.threadToken);
  if (!companyId) return { accepted: false, stored: false, reason: "No message matches that thread." };
  enterTenant({ companyId });
  const sql = await db();
  const intents = await sql<{ id: string; application_id: string | null; to_email: string; status: string }>`
    select id, application_id, to_email, status from message_intents
    where company_id = ${companyId} and thread_token = ${parsed.threadToken}
  `;
  const intent = intents[0];
  if (!intent) return { accepted: false, stored: false, reason: "No message matches that thread." };
  if (parsed.type !== "inbound") {
    const seen = await sql<{ id: string }>`
      select id from delivery_attempts
      where company_id = ${companyId} and intent_id = ${intent.id} and detail = ${`Webhook ${parsed.eventId}`}
    `;
    if (seen[0]) return { accepted: true, stored: false, reason: "This event was already stored." };
  }
  const duplicate = await sql<{ provider_event_id: string }>`
    select provider_event_id from inbound_messages
    where company_id = ${companyId} and provider_event_id = ${parsed.eventId}
  `;
  if (duplicate[0] && parsed.type === "inbound") return { accepted: true, stored: false, reason: "This event was already stored." };
  if (parsed.type === "inbound") {
    const from = (parsed.from ?? "").trim().toLowerCase();
    const matched = from.length > 3 && from === intent.to_email.trim().toLowerCase();
    const body = stripQuotedReply(parsed.text ?? "");
    await sql`
      insert into inbound_messages (id, company_id, intent_id, application_id, provider_event_id, from_email, subject, body, matched, quarantine_reason)
      values (
        ${nid()}, ${companyId}, ${intent.id}, ${intent.application_id}, ${parsed.eventId}, ${from},
        ${(parsed.subject ?? "").slice(0, 200)}, ${body.slice(0, 8000)}, ${matched},
        ${matched ? "" : "The sender did not match the candidate address. It is quarantined."}
      )
    `;
    if (matched) {
      await sql`
        update campaign_enrollments set status = 'REPLIED'
        where company_id = ${companyId} and status in ('QUEUED', 'SENT')
          and prospect_id in (select id from prospects where company_id = ${companyId} and email = ${from})
      `;
    }
    return { accepted: true, stored: true, reason: matched ? "Reply stored on the application." : "Reply quarantined." };
  }
  const map: Record<string, DeliveryState> = { delivered: "DELIVERED", bounced: "BOUNCED", complained: "COMPLAINED" };
  const next = map[parsed.type];
  if (!next) return { accepted: false, stored: false, reason: "That event type is not handled." };
  if (!isTerminal(intent.status) || intent.status === "ACCEPTED" || intent.status === "STORED") {
    await sql`
      update message_intents set status = ${next}, last_error = ${`Provider event ${parsed.type}`}
      where company_id = ${companyId} and id = ${intent.id}
    `;
  }
  if (next === "BOUNCED" || next === "COMPLAINED") {
    await sql`
      insert into mail_suppressions (company_id, email, reason)
      values (${companyId}, ${normalizeEmail(intent.to_email)}, ${next === "BOUNCED" ? "bounce" : "complaint"})
      on conflict (company_id, email) do nothing
    `;
  }
  await sql`
    insert into delivery_attempts (id, company_id, intent_id, attempt_no, provider, state, detail)
    values (${nid()}, ${companyId}, ${intent.id}, 0, 'provider', ${next}, ${`Webhook ${parsed.eventId}`})
    on conflict (company_id, intent_id, attempt_no) do nothing
  `;
  return { accepted: true, stored: true, reason: `Status set to ${next}.` };
}

type CaseRow = { name: string; visibility: "SAMPLE" | "HIDDEN"; args: unknown[]; expected: unknown; weight: number };

async function loadCases(companyId: string, versionId: string): Promise<{ entry: string; prompt: string; starter: string; cases: CaseRow[] }> {
  const sql = await db();
  const versions = await sql<{ entry_name: string; prompt: string; starter: string }>`
    select entry_name, prompt, starter from coding_question_versions
    where company_id = ${companyId} and id = ${versionId}
  `;
  const version = versions[0];
  if (!version) throw new Error("That question version is gone.");
  const cases = await sql<CaseRow>`
    select name, visibility, args, expected, weight from coding_cases
    where company_id = ${companyId} and version_id = ${versionId}
    order by position
  `;
  return { entry: version.entry_name, prompt: version.prompt, starter: version.starter, cases };
}

async function execute(source: string, entry: string, cases: CaseRow[]): Promise<Grade> {
  if (cases.length === 0) {
    return { status: "EMPTY", score: null, maxScore: 0, passed: null, total: 0, detail: "This question has no cases.", cases: [] };
  }
  let judged;
  try {
    judged = await judgeIsolated(source, entry, cases.map((row) => (Array.isArray(row.args) ? row.args : [])));
  } catch {
    const { gradeCases } = await import("@/domain/platform/score");
    return gradeCases({ infra: true, timedOut: false, compileError: "", rows: cases });
  }
  const { gradeCases } = await import("@/domain/platform/score");
  if (judged.status === "TIMED_OUT") return gradeCases({ infra: false, timedOut: true, compileError: "", rows: cases });
  if (judged.status === "OUTPUT") return gradeCases({ infra: false, timedOut: false, compileError: "OUTPUT", rows: cases });
  if (judged.status === "COMPILE") return gradeCases({ infra: false, timedOut: false, compileError: judged.error || "The source did not load.", rows: cases });
  if (judged.status !== "JUDGED") return gradeCases({ infra: true, timedOut: false, compileError: "", rows: cases });
  return gradeCases({
    infra: false,
    timedOut: false,
    compileError: "",
    rows: cases.map((row, index) => ({
      name: row.name,
      visibility: row.visibility,
      weight: row.weight,
      expected: row.expected,
      value: judged.results[index]?.value,
      error: judged.results[index]?.error,
    })),
  });
}

async function storeRun(companyId: string, inviteId: string, applicationId: string | null, versionId: string, source: string, kind: "SAMPLE" | "FINAL", cases: CaseRow[]) {
  const sql = await db();
  const submissionId = nid();
  await sql`
    insert into coding_submissions (id, company_id, invite_id, application_id, version_id, source, kind)
    values (${submissionId}, ${companyId}, ${inviteId}, ${applicationId}, ${versionId}, ${source.slice(0, 20_000)}, ${kind})
  `;
  const loaded = await loadCases(companyId, versionId);
  const grade = await execute(source, loaded.entry, cases);
  const visible = candidateCases(grade).map((row, index) => ({ ...row, weight: grade.cases[index]?.weight ?? 1 }));
  await sql`
    insert into judge_runs (id, company_id, submission_id, status, score, max_score, passed, total, infra, detail, cases, judge_version)
    values (
      ${nid()}, ${companyId}, ${submissionId}, ${grade.status}, ${grade.score}, ${grade.maxScore}, ${grade.passed}, ${grade.total},
      ${grade.status === "INFRA"}, ${grade.detail}, ${json(visible)}::jsonb, ${JUDGE_RUNTIME}
    )
  `;
  const complexity = estimateComplexity(source);
  return {
    status: grade.status,
    score: grade.score,
    maxScore: grade.maxScore,
    passed: grade.passed,
    total: grade.total,
    detail: grade.detail,
    cases: visible,
    complexity: { timeClass: complexity.timeClass, spaceClass: complexity.spaceClass, reasons: complexity.reasons, label: "Heuristic, not a proof." },
  };
}

export async function listQuestions(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  if (!roleHas(actor.role, "assessment.author") && !roleHas(actor.role, "assessment.assign")) {
    throw new Error("You cannot view coding questions.");
  }
  const sql = await db();
  const rows = await sql<{ id: string; slug: string; title: string; difficulty: string; status: string; skill_tags: string }>`
    select id, slug, title, difficulty, status, skill_tags from coding_questions
    where company_id = ${actor.companyId} order by title
  `;
  return { questions: rows, catalog: QUESTION_CORPUS.length };
}

export async function importQuestionCatalog(userId: string, slug: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "assessment.author");
  const sql = await db();
  let added = 0;
  for (const question of QUESTION_CORPUS) {
    const id = nid();
    const versionId = nid();
    const inserted = await sql<{ id: string }>`
      insert into coding_questions (id, company_id, slug, title, difficulty, skill_tags, status, current_version)
      values (${id}, ${actor.companyId}, ${question.slug}, ${question.title}, ${question.difficulty}, ${question.tags.join(", ")}, 'PUBLISHED', 1)
      on conflict (company_id, slug) do nothing
      returning id
    `;
    if (!inserted[0]) continue;
    await sql`
      insert into coding_question_versions (id, company_id, question_id, version, prompt, starter, entry_name, explanation, languages)
      values (${versionId}, ${actor.companyId}, ${inserted[0].id}, 1, ${question.prompt}, ${question.starter}, 'solve', ${question.explanation}, 'javascript')
    `;
    let position = 0;
    for (const item of question.cases) {
      await sql`
        insert into coding_cases (id, company_id, version_id, name, visibility, args, expected, weight, position)
        values (${nid()}, ${actor.companyId}, ${versionId}, ${item.name}, ${item.visibility}, ${json(item.args)}::jsonb, ${json(item.expected)}::jsonb, ${item.weight}, ${position})
      `;
      position += 1;
    }
    added += 1;
  }
  await audit(actor, "question.import", "coding_question", actor.companyId, `Imported ${added} questions`);
  return { added };
}

export async function inviteToCode(userId: string, slug: string, applicationId: string, questionId: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "assessment.assign");
  const sql = await db();
  const questions = await sql<{ id: string; title: string; status: string }>`
    select id, title, status from coding_questions where company_id = ${actor.companyId} and id = ${questionId}
  `;
  const question = questions[0];
  if (!question || question.status !== "PUBLISHED") throw new Error("Publish the question before sending it.");
  const versions = await sql<{ id: string }>`
    select id from coding_question_versions
    where company_id = ${actor.companyId} and question_id = ${questionId}
    order by version desc limit 1
  `;
  const version = versions[0];
  if (!version) throw new Error("This question has no version.");
  const apps = await sql<{ email: string; name: string; title: string }>`
    select c.email, c.name, j.title from applications a
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    join jobs j on j.company_id = a.company_id and j.id = a.job_id
    where a.company_id = ${actor.companyId} and a.id = ${applicationId}
  `;
  const app = apps[0];
  if (!app?.email) throw new Error("This application has no email.");
  const token = crypto.randomUUID();
  const inviteId = nid();
  await sql`
    insert into code_invites (id, company_id, application_id, question_id, version_id, token, candidate_email, expires_at)
    values (${inviteId}, ${actor.companyId}, ${applicationId}, ${questionId}, ${version.id}, ${token}, ${normalizeEmail(app.email)}, now() + interval '7 days')
  `;
  await queueMail(userId, slug, {
    applicationId,
    kind: "ASSESSMENT",
    subject: "Coding exercise for {{job_title}}",
    body: `Hello {{candidate_name}},\n\nPlease open the coding exercise "${question.title}" from your candidate home. The link expires in seven days. Sample cases are visible. Hidden cases are not.\n\n{{company_name}}`,
    cc: "",
    bcc: "",
    idempotencyKey: `code:${inviteId}`,
  });
  await audit(actor, "code.invite", "code_invite", inviteId, question.title);
  return { token, inviteId };
}

async function openInvite(userId: string, token: string) {
  const user = await requireUser(userId);
  const companyId = await companyOf("app_company_for_code", token);
  if (!companyId) throw new Error("This exercise link is not valid.");
  enterTenant({ userId: user.id, companyId });
  const sql = await db();
  const rows = await sql<{
    id: string;
    company_id: string;
    application_id: string | null;
    version_id: string;
    candidate_email: string;
    expires_at: string;
  }>`
    select id, company_id, application_id, version_id, candidate_email,
           to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at
    from code_invites where token = ${token}
  `;
  const invite = rows[0];
  if (!invite) throw new Error("This exercise link is not valid.");
  if (normalizeEmail(user.email) !== invite.candidate_email) throw new Error("This exercise belongs to a different email address.");
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("This exercise link has expired.");
  return { user, invite };
}

export async function getCodeExercise(userId: string, token: string) {
  const { invite } = await openInvite(userId, token);
  const loaded = await loadCases(invite.company_id, invite.version_id);
  const sql = await db();
  const policy = await sql<{ consent_text: string; accommodation_text: string; webcam_requested: boolean }>`
    select consent_text, accommodation_text, webcam_requested from integrity_policies
    where company_id = ${invite.company_id} and assessment_key = 'coding'
  `;
  return {
    prompt: loaded.prompt,
    starter: loaded.starter,
    entry: loaded.entry,
    expiresAt: invite.expires_at,
    samples: loaded.cases.filter((row) => row.visibility === "SAMPLE").map((row) => ({ name: row.name, args: row.args })),
    consentText: policy[0]?.consent_text ?? "",
    accommodationText: policy[0]?.accommodation_text ?? "",
    webcamRequested: Boolean(policy[0]?.webcam_requested),
    note: "JavaScript on Node, one file, inside a user, mount, pid, and network namespace. The workspace and host files are not visible. Hidden cases stay on the server. A timeout, a compile error, and a judge failure are different, and a judge failure is not stored as zero. Python is not executed.",
  };
}

export async function runCode(userId: string, token: string, source: string, final: boolean, consented = false) {
  assertSameSiteRequest();
  const { invite, user } = await openInvite(userId, token);
  const sql = await db();
  const policy = await sql<{ consent_text: string }>`
    select consent_text from integrity_policies where company_id = ${invite.company_id} and assessment_key = 'coding'
  `;
  if ((policy[0]?.consent_text ?? "").trim() && !consented) {
    throw new Error("Read the integrity notice and confirm it before running. You can ask for an accommodation instead. Refusing does not reject you by itself.");
  }
  if (consented) {
    await sql`
      insert into integrity_events (id, company_id, application_id, attempt_key, kind, detail)
      values (${nid()}, ${invite.company_id}, ${invite.application_id}, ${invite.id}, 'CONSENT', ${"Candidate confirmed the coding notice. This does not prove a camera or a single device."})
    `;
  }
  void user;
  const loaded = await loadCases(invite.company_id, invite.version_id);
  const cases = final ? loaded.cases : loaded.cases.filter((row) => row.visibility === "SAMPLE");
  return storeRun(invite.company_id, invite.id, invite.application_id, invite.version_id, source, final ? "FINAL" : "SAMPLE", cases);
}

export async function listCodeResults(userId: string, slug: string, applicationId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const rows = await sql.query<Record<string, unknown>>(
    `select s.id, s.kind, s.source, q.title, r.status, r.score, r.max_score, r.passed, r.total, r.detail, r.cases, r.infra,
            ${AT.replace("created_at", "s.created_at")} as created_at
     from coding_submissions s
     join code_invites i on i.company_id = s.company_id and i.id = s.invite_id
     join coding_questions q on q.company_id = i.company_id and q.id = i.question_id
     left join lateral (
       select status, score, max_score, passed, total, detail, cases, infra
       from judge_runs where company_id = s.company_id and submission_id = s.id
       order by created_at desc limit 1
     ) r on true
     where s.company_id = $1 and s.application_id = $2
     order by s.created_at desc limit 20`,
    [actor.companyId, applicationId],
  );
  return { results: rows };
}

export async function rejudgeSubmission(userId: string, slug: string, submissionId: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const sql = await db();
  const rows = await sql<{ source: string; version_id: string; application_id: string | null }>`
    select source, version_id, application_id from coding_submissions
    where company_id = ${actor.companyId} and id = ${submissionId}
  `;
  const row = rows[0];
  if (!row) throw new Error("That submission is not in this company.");
  const loaded = await loadCases(actor.companyId, row.version_id);
  const grade = await execute(row.source, loaded.entry, loaded.cases);
  const visible = candidateCases(grade);
  await sql`
    insert into judge_runs (id, company_id, submission_id, status, score, max_score, passed, total, infra, detail, cases, judge_version)
    values (
      ${nid()}, ${actor.companyId}, ${submissionId}, ${grade.status}, ${grade.score}, ${grade.maxScore}, ${grade.passed}, ${grade.total},
      ${grade.status === "INFRA"}, ${grade.detail}, ${json(visible)}::jsonb, ${JUDGE_RUNTIME}
    )
  `;
  await audit(actor, "code.rejudge", "coding_submission", submissionId, grade.status);
  return { status: grade.status, score: grade.score, detail: grade.detail, keptHistory: true };
}

export async function openLive(userId: string, slug: string, applicationId: string, title: string, prompt: string, meetingUrl: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "interview.manage");
  const sql = await db();
  const id = nid();
  const token = crypto.randomUUID();
  const starter = "function solve() {\n  return null;\n}\n";
  await sql`
    insert into live_sessions (id, company_id, application_id, token, title, prompt, meeting_url, source, files, revealed, active_file, status, expires_at)
    values (
      ${id}, ${actor.companyId}, ${applicationId}, ${token}, ${title.slice(0, 120)}, ${prompt.slice(0, 8000)}, ${meetingUrl.slice(0, 300)},
      ${starter}, ${json([{ name: "solve.js", body: starter }, { name: "notes.md", body: "# Walk through the approach\n" }])}::jsonb,
      false, 'solve.js', 'WAITING', now() + interval '2 days'
    )
  `;
  await sql`
    insert into live_people (id, company_id, session_id, role, name, user_id, admitted, last_seen)
    values (${nid()}, ${actor.companyId}, ${id}, 'INTERVIEWER', ${actor.name}, ${actor.userId}, true, now())
  `;
  await audit(actor, "live.open", "live_session", id, title.slice(0, 120));
  return { token, id, meeting: meetingUrl ? "A meeting link was saved. This product does not place the video call." : "No video provider is connected. The shared editor still works." };
}

async function liveRole(userId: string, token: string): Promise<{ companyId: string; sessionId: string; role: "CANDIDATE" | "INTERVIEWER"; name: string; userId: string }> {
  const user = await requireUser(userId);
  const companyId = await companyOf("app_company_for_live", token);
  if (!companyId) throw new Error("This interview room does not exist.");
  enterTenant({ userId: user.id, companyId });
  const sql = await db();
  const sessions = await sql<{ id: string; application_id: string | null; status: string }>`
    select id, application_id, status from live_sessions where company_id = ${companyId} and token = ${token}
  `;
  const session = sessions[0];
  if (!session) throw new Error("This interview room does not exist.");
  const members = await sql<{ role: string }>`
    select role from memberships where company_id = ${companyId} and user_id = ${user.id} and status = 'ACTIVE'
  `;
  const staff = Boolean(members[0]);
  let candidate = false;
  if (session.application_id) {
    const apps = await sql<{ email: string }>`
      select c.email from applications a
      join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
      where a.company_id = ${companyId} and a.id = ${session.application_id}
    `;
    candidate = normalizeEmail(apps[0]?.email ?? "") === normalizeEmail(user.email);
  }
  if (!staff && !candidate) throw new Error("You are not on this interview.");
  const role = candidate && !staff ? "CANDIDATE" : "INTERVIEWER";
  return { companyId, sessionId: session.id, role, name: user.name || user.email, userId: user.id };
}

export async function readLive(userId: string, token: string) {
  const who = await liveRole(userId, token);
  const sql = await db();
  await sql`
    insert into live_people (id, company_id, session_id, role, name, user_id, admitted, last_seen)
    values (${nid()}, ${who.companyId}, ${who.sessionId}, ${who.role}, ${who.name}, ${who.userId}, ${who.role === "INTERVIEWER"}, now())
    on conflict (company_id, session_id, role, name) do update set last_seen = now(), user_id = excluded.user_id
  `;
  const sessions = await sql<{
    title: string; prompt: string; source: string; revision: number; board: unknown; board_revision: number;
    meeting_url: string; status: string; revealed: boolean; files: unknown; active_file: string;
  }>`
    select title, prompt, source, revision, board, board_revision, meeting_url, status, revealed, files, active_file
    from live_sessions where company_id = ${who.companyId} and id = ${who.sessionId}
  `;
  const session = sessions[0];
  if (!session) throw new Error("This interview room does not exist.");
  const people = await sql<{ role: string; name: string; admitted: boolean; cursor_at: number }>`
    select role, name, admitted, cursor_at from live_people where company_id = ${who.companyId} and session_id = ${who.sessionId}
  `;
  const me = people.find((person) => person.role === who.role && person.name === who.name);
  const admitted = who.role === "INTERVIEWER" || Boolean(me?.admitted) || session.status === "LIVE";
  const chat = await sql<{ author: string; body: string; private_note: boolean }>`
    select author, body, private_note from live_chat
    where company_id = ${who.companyId} and session_id = ${who.sessionId}
    order by created_at limit 200
  `;
  return {
    role: who.role,
    title: session.title,
    admitted,
    meetingUrl: session.meeting_url,
    meetingNote: session.meeting_url ? "The meeting link opens an outside call. This page does not host video." : "No video call is connected. The shared editor does not require one.",
    status: session.status,
    revealed: Boolean(session.revealed),
    prompt: admitted && (who.role === "INTERVIEWER" || session.revealed) ? session.prompt : "",
    promptHidden: admitted && who.role === "CANDIDATE" && !session.revealed,
    source: admitted ? session.source : "",
    revision: session.revision,
    activeFile: session.active_file,
    files: admitted ? session.files : [],
    board: admitted ? session.board : [],
    boardRevision: session.board_revision,
    people,
    chat: chat.filter((line) => canSeeNote(who.role, line.private_note)),
  };
}

export async function syncLive(userId: string, token: string, input: {
  baseRevision: number;
  source: string;
  boardRevision: number;
  board: string;
  chat: string;
  privateNote: boolean;
  useEdit?: boolean;
  editAt?: number;
  editDel?: number;
  editInsert?: string;
  cursor?: number;
  reveal?: boolean;
  fileName?: string;
}) {
  assertSameSiteRequest();
  const who = await liveRole(userId, token);
  const current = await readLive(userId, token);
  if (!current.admitted) throw new Error("Wait until an interviewer admits you.");
  const sql = await db();
  if (typeof input.cursor === "number") {
    await sql`
      update live_people set cursor_at = ${Math.max(0, Math.trunc(input.cursor))}, last_seen = now()
      where company_id = ${who.companyId} and session_id = ${who.sessionId} and role = ${who.role} and name = ${who.name}
    `;
  }
  if (input.reveal) {
    if (who.role !== "INTERVIEWER") throw new Error("Only an interviewer can reveal the question.");
    await sql`update live_sessions set revealed = true where company_id = ${who.companyId} and id = ${who.sessionId}`;
  }
  let saved = false;
  let conflict = "";
  if (input.useEdit) {
    const edit: Edit = { at: input.editAt ?? 0, del: input.editDel ?? 0, insert: input.editInsert ?? "" };
    const missed = await sql<{ at_pos: number; del_count: number; insert_text: string }>`
      select at_pos, del_count, insert_text from live_ops
      where company_id = ${who.companyId} and session_id = ${who.sessionId} and revision > ${input.baseRevision}
      order by revision
    `;
    const chained = applyOpChain(
      current.source,
      missed.map((row) => ({ at: row.at_pos, del: row.del_count, insert: row.insert_text })),
      edit,
    );
    const nextRevision = current.revision + 1;
    const updated = await sql<{ revision: number }>`
      update live_sessions set source = ${chained.body}, revision = ${nextRevision}
      where company_id = ${who.companyId} and id = ${who.sessionId} and revision = ${current.revision}
      returning revision
    `;
    if (updated[0]) {
      await sql`
        insert into live_ops (id, company_id, session_id, revision, author, at_pos, del_count, insert_text)
        values (${nid()}, ${who.companyId}, ${who.sessionId}, ${nextRevision}, ${who.name}, ${chained.edit.at}, ${chained.edit.del}, ${chained.edit.insert})
      `;
      saved = true;
    } else {
      conflict = "Someone else saved first. The editor reloaded their version.";
    }
  } else if (input.source && input.source !== current.source) {
    const applied = applyDocument({ revision: current.revision, body: current.source }, { baseRevision: input.baseRevision, body: input.source });
    if (applied.ok) {
      const updated = await sql<{ revision: number }>`
        update live_sessions set source = ${applied.body}, revision = ${applied.revision}
        where company_id = ${who.companyId} and id = ${who.sessionId} and revision = ${input.baseRevision}
        returning revision
      `;
      saved = Boolean(updated[0]);
      if (!saved) conflict = "Someone else saved first. The editor reloaded their version. Yours was not overwritten.";
    } else {
      conflict = applied.reason;
    }
  }
  if (input.fileName && /^[a-z0-9._-]{1,40}$/i.test(input.fileName) && input.fileName !== current.activeFile) {
    const files = Array.isArray(current.files) ? [...(current.files as { name: string; body: string }[])] : [];
    const edited = saved ? (await readLive(userId, token)).source : current.source;
    const withCurrent = files.map((file) => (file.name === current.activeFile ? { ...file, body: edited } : file));
    if (current.activeFile && !withCurrent.some((file) => file.name === current.activeFile)) {
      withCurrent.push({ name: current.activeFile, body: edited });
    }
    let target = withCurrent.find((file) => file.name === input.fileName);
    if (!target) {
      if (who.role !== "INTERVIEWER") throw new Error("Only an interviewer can add a file.");
      target = { name: input.fileName, body: input.fileName.endsWith(".md") ? "# Notes\n" : "" };
      withCurrent.push(target);
    }
    const latest = await readLive(userId, token);
    await sql`
      update live_sessions set files = ${json(withCurrent)}::jsonb, active_file = ${target.name}, source = ${target.body}, revision = ${latest.revision + 1}
      where company_id = ${who.companyId} and id = ${who.sessionId} and revision = ${latest.revision}
    `;
  } else if (saved) {
    const latest = await readLive(userId, token);
    const files = Array.isArray(latest.files) ? [...(latest.files as { name: string; body: string }[])] : [];
    const nextFiles = files.some((file) => file.name === latest.activeFile)
      ? files.map((file) => (file.name === latest.activeFile ? { ...file, body: latest.source } : file))
      : [...files, { name: latest.activeFile || "solve.js", body: latest.source }];
    await sql`
      update live_sessions set files = ${json(nextFiles)}::jsonb
      where company_id = ${who.companyId} and id = ${who.sessionId}
    `;
  }
  if (input.board) {
    const board = applyDocument({ revision: current.boardRevision, body: JSON.stringify(current.board ?? []) }, { baseRevision: input.boardRevision, body: input.board });
    if (board.ok) {
      await sql`
        update live_sessions set board = ${board.body}::jsonb, board_revision = ${board.revision}
        where company_id = ${who.companyId} and id = ${who.sessionId} and board_revision = ${input.boardRevision}
      `;
    }
  }
  if (input.chat.trim()) {
    if (input.privateNote && who.role !== "INTERVIEWER") throw new Error("Only interviewers can write private notes.");
    await sql`
      insert into live_chat (id, company_id, session_id, author, body, private_note)
      values (${nid()}, ${who.companyId}, ${who.sessionId}, ${who.name}, ${input.chat.trim().slice(0, 1000)}, ${input.privateNote})
    `;
  }
  const next = await readLive(userId, token);
  return { ...next, saved, conflict };
}

export async function admitLive(userId: string, token: string, name: string) {
  assertSameSiteRequest();
  const who = await liveRole(userId, token);
  if (who.role !== "INTERVIEWER") throw new Error("Only an interviewer can admit someone.");
  const sql = await db();
  await sql`
    update live_people set admitted = true
    where company_id = ${who.companyId} and session_id = ${who.sessionId} and name = ${name}
  `;
  await sql`
    update live_sessions set status = 'LIVE' where company_id = ${who.companyId} and id = ${who.sessionId}
  `;
  return { admitted: name };
}

export async function livePackage(userId: string, token: string) {
  const who = await liveRole(userId, token);
  if (who.role !== "INTERVIEWER") throw new Error("Only an interviewer can open the review package.");
  const room = await readLive(userId, token);
  return {
    title: room.title,
    prompt: room.prompt,
    source: room.source,
    files: room.files,
    revision: room.revision,
    chat: room.chat,
    people: room.people,
    note: "This package does not submit a scorecard. Each interviewer still writes their own on the interviews page. Runs in the chat are from the secure judge.",
  };
}

export async function endLive(userId: string, token: string) {
  assertSameSiteRequest();
  const who = await liveRole(userId, token);
  if (who.role !== "INTERVIEWER") throw new Error("Only an interviewer can end the room.");
  const sql = await db();
  await sql`update live_sessions set status = 'ENDED' where company_id = ${who.companyId} and id = ${who.sessionId}`;
  return readLive(userId, token);
}

export async function runLiveSample(userId: string, token: string) {
  assertSameSiteRequest();
  const who = await liveRole(userId, token);
  const room = await readLive(userId, token);
  if (!room.admitted) throw new Error("Wait until an interviewer admits you.");
  const files = Array.isArray(room.files) ? (room.files as { name: string; body: string }[]) : [];
  const solve = files.find((file) => file.name === "solve.js");
  const program = solve?.body || room.source;
  const judged = await judgeIsolated(program, "solve", [[]]);
  const detail = judged.status === "TIMED_OUT"
    ? "The run was stopped at the time limit. No score was stored."
    : judged.status === "JUDGED"
      ? `Returned ${JSON.stringify(judged.results[0]?.value ?? null).slice(0, 400)}`
      : judged.error;
  const sql = await db();
  await sql`
    insert into live_chat (id, company_id, session_id, author, body, private_note)
    values (${nid()}, ${who.companyId}, ${who.sessionId}, 'Runner', ${detail.slice(0, 500)}, false)
  `;
  return { status: judged.status, detail };
}

export async function saveIntegrityPolicy(userId: string, slug: string, input: { assessmentKey: string; consentText: string; allowPaste: boolean; webcamRequested: boolean; threshold: number; accommodationText?: string; retentionDays?: number }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "assessment.publish");
  if (input.threshold < 50 || input.threshold > 100) throw new Error("The similarity threshold must be from 50 to 100.");
  const days = Math.min(365, Math.max(1, Math.trunc(input.retentionDays ?? 30)));
  const sql = await db();
  await sql`
    insert into integrity_policies (company_id, assessment_key, consent_text, allow_paste, webcam_requested, similarity_threshold, accommodation_text, retention_days)
    values (${actor.companyId}, ${input.assessmentKey}, ${input.consentText.slice(0, 2000)}, ${input.allowPaste}, ${input.webcamRequested}, ${input.threshold}, ${(input.accommodationText ?? "").slice(0, 1000)}, ${days})
    on conflict (company_id, assessment_key) do update set
      consent_text = excluded.consent_text,
      allow_paste = excluded.allow_paste,
      webcam_requested = excluded.webcam_requested,
      similarity_threshold = excluded.similarity_threshold,
      accommodation_text = excluded.accommodation_text,
      retention_days = excluded.retention_days
  `;
  return { saved: true, scoreUnchanged: signalChangesScore() };
}

export async function recordIntegrity(userId: string, slug: string, input: { applicationId: string; attemptKey: string; kind: string; detail: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  const sql = await db();
  await sql`
    insert into integrity_events (id, company_id, application_id, attempt_key, kind, detail)
    values (${nid()}, ${actor.companyId}, ${input.applicationId}, ${input.attemptKey.slice(0, 80)}, ${input.kind.slice(0, 40)}, ${input.detail.slice(0, 300)})
  `;
  const note = input.kind === "ACCOMMODATION"
    ? "Accommodation request stored. It does not change a score or reject an application."
    : "This is a signal only. It does not change a score or reject an application.";
  return { stored: true, rejected: false, note };
}

export async function compareSubmissions(userId: string, slug: string, leftId: string, rightId: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const sql = await db();
  const rows = await sql<{ id: string; source: string; application_id: string | null }>`
    select id, source, application_id from coding_submissions
    where company_id = ${actor.companyId} and id in (${leftId}, ${rightId})
  `;
  if (rows.length < 2) throw new Error("Both submissions must be in this company.");
  const score = similarityPercent(rows[0]!.source, rows[1]!.source);
  const policy = await sql<{ similarity_threshold: number }>`
    select similarity_threshold from integrity_policies where company_id = ${actor.companyId} limit 1
  `;
  const threshold = policy[0]?.similarity_threshold ?? 80;
  let caseId: string | null = null;
  if (similarityOpensCase(score, threshold)) {
    caseId = nid();
    await sql`
      insert into integrity_cases (id, company_id, application_id, summary, score)
      values (${caseId}, ${actor.companyId}, ${rows[0]!.application_id}, ${`Similarity ${score} against another submission. This does not change either score.`}, ${score})
    `;
  }
  return { score, threshold, caseId, note: "Similar structure can be a shared exercise, not proof of copying. A person decides." };
}

export async function listIntegrity(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const sql = await db();
  await sql`
    delete from integrity_events
    where company_id = ${actor.companyId}
      and created_at < now() - make_interval(days => coalesce((select min(retention_days) from integrity_policies where company_id = ${actor.companyId}), 30))
  `;
  const cases = await sql.query<Record<string, unknown>>(
    `select id, application_id, status, summary, score, disposition, ${AT} as created_at
     from integrity_cases where company_id = $1 order by created_at desc limit 50`,
    [actor.companyId],
  );
  const events = await sql.query<Record<string, unknown>>(
    `select id, application_id, kind, detail, ${AT} as created_at
     from integrity_events where company_id = $1 order by created_at desc limit 50`,
    [actor.companyId],
  );
  return { cases, events, webcam: "No snapshots are stored. A camera is not required. Focus changes and a camera flag do not prove cheating and never reject an application." };
}

export async function disposeIntegrity(userId: string, slug: string, caseId: string, next: string, note: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "evaluation.grade");
  const sql = await db();
  const rows = await sql<{ status: string }>`select status from integrity_cases where company_id = ${actor.companyId} and id = ${caseId}`;
  const decision = disposeCase(rows[0]?.status ?? "", next);
  if (!decision.ok) throw new Error(decision.error);
  await sql`
    update integrity_cases set status = ${decision.status}, disposition = ${note.slice(0, 500)}, false_positive = ${decision.status === "DISMISSED"}
    where company_id = ${actor.companyId} and id = ${caseId}
  `;
  await audit(actor, "integrity.dispose", "integrity_case", caseId, decision.status);
  return { status: decision.status, scoreUnchanged: true };
}

export async function indexDocx(userId: string, slug: string, applicationId: string, filename: string, base64: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  if (base64.length > 2_200_000) throw new Error("That file is too large.");
  const bytes = Buffer.from(base64, "base64");
  const extracted = await extractOffice(filename, bytes);
  const sql = await db();
  const fileId = nid();
  const content = await storeFileBytes({
    companyId: actor.companyId,
    fileId,
    bytes,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  await sql`
    insert into file_objects (id, company_id, owner_scope, owner_id, display_name, mime, size_bytes, content, scan_state, scan_note)
    values (
      ${fileId}, ${actor.companyId}, 'APPLICATION', ${applicationId}, ${filename.slice(0, 180)},
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ${bytes.length}, ${content},
      ${extracted.status === "OK" ? "CLEAN" : "QUARANTINE"},
      ${"Macros were not executed. No malware scanner is connected. " + extracted.reason}
    )
  `;
  await sql`
    insert into file_extracts (id, company_id, application_id, filename, mime, status, confidence, text_excerpt)
    values (${nid()}, ${actor.companyId}, ${applicationId}, ${filename.slice(0, 180)}, 'docx', ${extracted.status}, ${extracted.confidence}, ${extracted.text.slice(0, 4000)})
  `;
  if (extracted.status === "OK") {
    const profile = parseResumeProfile(extracted.text);
    await sql`
      insert into candidate_profiles (
        id, company_id, application_id, file_id, titles, skills, education, locations, years, history, indexed_text, note
      ) values (
        ${nid()}, ${actor.companyId}, ${applicationId}, ${fileId},
        ${json(profile.titles)}::jsonb, ${json(profile.skills)}::jsonb, ${json(profile.education)}::jsonb,
        ${json(profile.locations)}::jsonb, ${profile.years}, ${json(profile.history)}::jsonb,
        ${profile.indexedText}, ${profile.note}
      )
      on conflict (company_id, application_id) do update set
        titles = excluded.titles, skills = excluded.skills, education = excluded.education,
        locations = excluded.locations, years = excluded.years, history = excluded.history,
        indexed_text = excluded.indexed_text, note = excluded.note, file_id = excluded.file_id
    `;
  }
  await audit(actor, "file.docx", "file_extract", fileId, extracted.status);
  return { status: extracted.status, confidence: extracted.confidence, reason: extracted.reason, excerpt: extracted.text.slice(0, 500) };
}

export async function listMyDesk(userId: string) {
  const user = await requireUser(userId);
  const sql = await db();
  const mail = await sql<{
    id: string;
    subject: string;
    body: string;
    company_id: string;
    intent_id: string;
    company_name: string;
    mail_from_name: string;
    mail_footer: string;
    accent: string;
  }>`
    select m.id, m.subject, m.body, m.company_id, m.intent_id,
      co.name as company_name, co.mail_from_name, co.mail_footer, co.embed_accent as accent
    from sandbox_mailbox m
    join companies co on co.id = m.company_id
    where lower(m.to_email) = ${user.emailNormalized}
    order by m.created_at desc limit 20
  `;
  const exercises = await sql<{ token: string; title: string }>`
    select i.token, q.title from code_invites i
    join coding_questions q on q.company_id = i.company_id and q.id = i.question_id
    where i.candidate_email = ${user.emailNormalized} and i.expires_at > now()
    order by i.created_at desc limit 10
  `;
  const tasks = await sql<{ id: string; title: string; status: string; company_id: string }>`
    select t.id, t.title, t.status, t.company_id
    from onboarding_tasks t
    join pending_hires h on h.company_id = t.company_id and h.id = t.hire_id
    join applications a on a.company_id = h.company_id and a.id = h.application_id
    join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
    where t.candidate_visible = true and lower(c.email) = ${user.emailNormalized}
    order by t.position limit 20
  `;
  return {
    mail,
    exercises,
    tasks,
    note: "Mail here was stored in this workspace. If no outside mail server is configured, nothing was sent to an outside inbox.",
  };
}
export async function replyToIntent(userId: string, intentId: string, body: string) {
  assertSameSiteRequest();
  const user = await requireUser(userId);
  const text = stripQuotedReply(body);
  if (text.length < 2) throw new Error("Write a reply first.");
  const sql = await db();
  const intents = await sql<{ id: string; company_id: string; application_id: string | null; to_email: string }>`
    select id, company_id, application_id, to_email from message_intents where id = ${intentId}
  `;
  const intent = intents[0];
  if (!intent || normalizeEmail(intent.to_email) !== user.emailNormalized) throw new Error("That message is not yours.");
  enterTenant({ userId: user.id, companyId: intent.company_id });
  await sql`
    insert into inbound_messages (id, company_id, intent_id, application_id, provider_event_id, from_email, subject, body, matched, quarantine_reason)
    values (${nid()}, ${intent.company_id}, ${intent.id}, ${intent.application_id}, ${nid()}, ${user.emailNormalized}, 'Reply', ${text.slice(0, 8000)}, true, '')
  `;
  await sql`
    update campaign_enrollments set status = 'REPLIED'
    where company_id = ${intent.company_id} and status in ('QUEUED', 'SENT')
      and prospect_id in (select id from prospects where company_id = ${intent.company_id} and email = ${user.emailNormalized})
  `;
  return { stored: true, note: "Your reply is on the application. It was not sent through an outside mail server." };
}

