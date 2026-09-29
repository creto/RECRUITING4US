import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { DEFAULT_MAIL_TEMPLATES, MAIL_NOTE, mailText, parseCc, renderMail } from "@/domain/mail";
import { prepareMailBody } from "@/domain/mail-html";
import { roleHas } from "@/domain/rules";
import { allow, audit, db, nid, requireActor, requireUser } from "./db.server";

const NOTE = MAIL_NOTE;

async function ensureTemplates(companyId: string, userId: string) {
  const sql = await db();
  const existing = await sql<{ name: string }>`select name from email_templates where company_id = ${companyId}`;
  const have = new Set(existing.map((row) => row.name));
  for (const template of DEFAULT_MAIL_TEMPLATES) {
    if (have.has(template.name)) continue;
    await sql`
      insert into email_templates (id, company_id, name, subject, body, created_by)
      values (${nid()}, ${companyId}, ${template.name}, ${template.subject}, ${template.body}, ${userId})
      on conflict (company_id, name) do nothing
    `;
  }
}

export async function listTemplates(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  await ensureTemplates(actor.companyId, actor.userId);
  const sql = await db();
  const rows = await sql<{ id: string; name: string; subject: string; body: string }>`
    select id, name, subject, body from email_templates
    where company_id = ${actor.companyId}
    order by name
  `;
  return { templates: rows, note: NOTE };
}

export async function saveTemplate(
  userId: string,
  input: { slug: string; id?: string; name: string; subject: string; body: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.note");
  const name = mailText(input.name, 2, 80, "Template name");
  const subject = mailText(input.subject, 2, 180, "Subject");
  const body = mailText(input.body, 2, 8000, "Message");
  if ("error" in name) throw new Error(name.error);
  if ("error" in subject) throw new Error(subject.error);
  if ("error" in body) throw new Error(body.error);
  const sql = await db();
  const id = input.id?.trim() || nid();
  await sql`
    insert into email_templates (id, company_id, name, subject, body, created_by)
    values (${id}, ${actor.companyId}, ${name.text}, ${subject.text}, ${prepareMailBody(body.text)}, ${actor.userId})
    on conflict (company_id, id) do update
      set name = excluded.name, subject = excluded.subject, body = excluded.body
  `;
  await audit(actor, "mail.template", "email_template", id, "Email template saved.");
  return { id };
}

export async function deleteTemplate(userId: string, input: { slug: string; id: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.note");
  const sql = await db();
  const removed = await sql`
    delete from email_templates where id = ${input.id} and company_id = ${actor.companyId} returning id
  `;
  if (!removed[0]) throw new Error("Not found.");
  return { ok: true };
}

export async function listMailbox(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.note");
  const sql = await db();
  const rows = await sql<{
    id: string;
    application_id: string | null;
    candidate_name: string | null;
    job_title: string | null;
    from_name: string;
    from_email: string;
    to_email: string;
    cc: string;
    subject: string;
    body: string;
    author: string;
    status: string;
    at: string;
  }>`
    select m.id, m.application_id, c.name as candidate_name, j.title as job_title,
      m.from_name, m.from_email, m.to_email, m.cc, m.subject, m.body, m.author, m.status,
      to_char(m.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from mail_messages m
    left join applications a on a.id = m.application_id and a.company_id = m.company_id
    left join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    left join jobs j on j.id = a.job_id and j.company_id = a.company_id
    where m.company_id = ${actor.companyId} and m.application_id is not null
    order by m.created_at desc
    limit 80
  `;
  return { messages: rows, note: NOTE };
}

export async function listApplicationMail(userId: string, slug: string, applicationId: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "application.read");
  const sql = await db();
  const rows = await sql<{
    id: string;
    from_name: string;
    from_email: string;
    to_email: string;
    cc: string;
    subject: string;
    body: string;
    author: string;
    status: string;
    at: string;
  }>`
    select id, from_name, from_email, to_email, cc, subject, body, author, status,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from mail_messages
    where company_id = ${actor.companyId} and application_id = ${applicationId}
    order by created_at
  `;
  return { messages: rows, note: NOTE, canSend: roleHas(actor.role, "application.note") };
}

export async function sendApplicationEmail(
  userId: string,
  input: { slug: string; applicationId: string; subject: string; body: string; cc: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.note");
  const subject = mailText(input.subject, 2, 180, "Subject");
  const body = mailText(input.body, 2, 8000, "Message");
  const cc = parseCc(input.cc ?? "");
  if ("error" in subject) throw new Error(subject.error);
  if ("error" in body) throw new Error(body.error);
  if ("error" in cc) throw new Error(cc.error);
  const sql = await db();
  const rows = await sql<{ name: string; email: string; anonymized: boolean; job_title: string; company_name: string }>`
    select c.name, c.email, c.anonymized, j.title as job_title, co.name as company_name
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    join companies co on co.id = a.company_id
    where a.id = ${input.applicationId} and a.company_id = ${actor.companyId}
  `;
  const person = rows[0];
  if (!person) throw new Error("Not found.");
  if (person.anonymized || !person.email || person.email.endsWith("@deleted.example")) {
    throw new Error("This profile has no email address.");
  }
  const values = {
    candidate_name: person.name,
    job_title: person.job_title,
    company_name: person.company_name,
    recruiter_name: actor.name,
  };
  const id = nid();
  await sql`
    insert into mail_messages (
      id, company_id, to_email, subject, body, status, related_id,
      from_name, from_email, application_id, cc, author
    ) values (
      ${id}, ${actor.companyId}, ${person.email},
      ${renderMail(subject.text, values)}, ${prepareMailBody(renderMail(body.text, values))},
      'CAPTURED', ${input.applicationId},
      ${actor.name}, ${actor.email}, ${input.applicationId}, ${cc.emails.join(", ")}, 'STAFF'
    )
  `;
  await audit(actor, "mail.send", "application", input.applicationId, "Email stored for the candidate portal. Not delivered outside the product.");
  return { id, status: "CAPTURED" as const, note: NOTE };
}

async function candidateOwns(userId: string, applicationId: string) {
  const user = await requireUser(userId);
  const sql = await db();
  const rows = await sql<{ company_id: string; email: string; name: string }>`
    select a.company_id, u.email, u.name
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join lateral app_user_identity(${userId}) u on true
    where a.id = ${applicationId}
      and (c.user_id = ${userId} or (lower(c.email) = lower(u.email) and u.email_verified = true))
  `;
  const row = rows[0];
  if (!row?.email) throw new Error("Not found.");
  return { ...row, userId: user.id };
}

export async function listMyMail(userId: string, applicationId: string) {
  const owned = await candidateOwns(userId, applicationId);
  const sql = await db();
  return sql<{
    id: string;
    subject: string;
    body: string;
    from_name: string;
    author: string;
    at: string;
  }>`
    select id, subject, body, from_name, author,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
    from mail_messages
    where company_id = ${owned.company_id} and application_id = ${applicationId}
      and (
        (author = 'STAFF' and lower(to_email) = lower(${owned.email}))
        or (author = 'CANDIDATE' and lower(from_email) = lower(${owned.email}))
      )
    order by created_at
  `;
}

export async function replyToMail(userId: string, applicationId: string, body: string) {
  assertSameSiteRequest();
  const owned = await candidateOwns(userId, applicationId);
  const text = mailText(body, 2, 4000, "Reply");
  if ("error" in text) throw new Error(text.error);
  const sql = await db();
  const previous = await sql<{ from_email: string; subject: string }>`
    select from_email, subject from mail_messages
    where company_id = ${owned.company_id} and application_id = ${applicationId}
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
      ${id}, ${owned.company_id}, ${staff.from_email}, ${"Re: " + staff.subject}, ${text.text},
      'CAPTURED', ${applicationId}, ${owned.name}, ${owned.email}, ${applicationId}, 'CANDIDATE'
    )
  `;
  return { id, status: "CAPTURED" as const, note: NOTE };
}
