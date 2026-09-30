import { activeAttemptSummary, buildAttemptLivePad, liveWatchPath } from "@/domain/live-watch";
import { roleHas } from "@/domain/rules";
import { enterTenant } from "@/lib/tenant";
import { allow, db, json, nid, requireActor } from "./db.server";

/** True when this staff role may see who is taking an exam. */
export function canWatchActiveAttempts(role: string): boolean {
  return (
    roleHas(role, "assessment.assign") ||
    roleHas(role, "interview.manage") ||
    roleHas(role, "evaluation.grade") ||
    roleHas(role, "assessment.author")
  );
}

type Meta = {
  company_id: string;
  application_id: string;
  assessment_name: string;
  candidate_name: string;
  job_title: string;
  status: string;
};

async function loadMeta(companyId: string, attemptId: string): Promise<Meta | null> {
  const sql = await db();
  const rows = await sql<Meta>`
    select t.company_id, g.application_id, t.status,
      coalesce(s.name, 'Assessment') as assessment_name,
      coalesce(c.name, c.email, 'Candidate') as candidate_name,
      coalesce(j.title, 'Role') as job_title
    from attempts t
    join assignments g on g.id = t.assignment_id and g.company_id = t.company_id
    join assessment_versions v on v.id = g.assessment_version_id and v.company_id = t.company_id
    join assessments s on s.id = v.assessment_id and s.company_id = t.company_id
    join applications a on a.id = g.application_id and a.company_id = t.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = t.company_id
    join jobs j on j.id = a.job_id and j.company_id = t.company_id
    where t.company_id = ${companyId} and t.id = ${attemptId}
  `;
  return rows[0] ?? null;
}

async function loadItems(companyId: string, attemptId: string) {
  const sql = await db();
  return sql<{ position: number; type: string; prompt: string; answer: unknown }>`
    select i.position, q.type, v.prompt, r.answer
    from attempt_items i
    join question_versions v on v.id = i.question_version_id
    join questions q on q.id = v.question_id
    left join responses r on r.attempt_item_id = i.id and r.company_id = i.company_id
    where i.company_id = ${companyId} and i.attempt_id = ${attemptId}
    order by i.position
  `;
}

/** Create or refresh the live pad tied to an open attempt. */
export async function ensureAttemptLive(companyId: string, attemptId: string): Promise<{ token: string; id: string } | null> {
  enterTenant({ companyId, publicSlug: "" });
  const meta = await loadMeta(companyId, attemptId);
  if (!meta || meta.status !== "IN_PROGRESS") return null;
  const sql = await db();
  const existing = await sql<{ id: string; token: string; status: string }>`
    select id, token, status from live_sessions
    where company_id = ${companyId} and attempt_id = ${attemptId}
    limit 1
  `;
  const items = await loadItems(companyId, attemptId);
  const pad = buildAttemptLivePad({
    assessmentName: meta.assessment_name,
    candidateName: meta.candidate_name,
    jobTitle: meta.job_title,
    items,
  });
  if (existing[0]) {
    await sql`
      update live_sessions
      set title = ${`${meta.assessment_name} · live`.slice(0, 120)},
          prompt = ${pad.prompt.slice(0, 8000)},
          source = ${pad.source},
          files = ${json(pad.files)}::jsonb,
          active_file = ${pad.activeFile},
          revealed = true,
          status = case when status = 'ENDED' then 'LIVE' else status end,
          revision = revision + 1,
          application_id = ${meta.application_id}
      where company_id = ${companyId} and id = ${existing[0].id}
    `;
    await sql`
      insert into live_people (id, company_id, session_id, role, name, admitted, last_seen)
      values (${nid()}, ${companyId}, ${existing[0].id}, 'CANDIDATE', ${meta.candidate_name.slice(0, 120)}, true, now())
      on conflict (company_id, session_id, role, name) do update set admitted = true, last_seen = now()
    `;
    return { token: existing[0].token, id: existing[0].id };
  }
  const id = nid();
  const token = crypto.randomUUID();
  await sql`
    insert into live_sessions (
      id, company_id, application_id, attempt_id, token, title, prompt, meeting_url,
      source, files, revealed, active_file, status, expires_at
    ) values (
      ${id}, ${companyId}, ${meta.application_id}, ${attemptId}, ${token},
      ${`${meta.assessment_name} · live`.slice(0, 120)}, ${pad.prompt.slice(0, 8000)}, '',
      ${pad.source}, ${json(pad.files)}::jsonb, true, ${pad.activeFile}, 'LIVE',
      now() + interval '2 days'
    )
  `;
  await sql`
    insert into live_people (id, company_id, session_id, role, name, admitted, last_seen)
    values (${nid()}, ${companyId}, ${id}, 'CANDIDATE', ${meta.candidate_name.slice(0, 120)}, true, now())
  `;
  return { token, id };
}

/** Push the latest saved answers into the linked live pad. */
export async function mirrorAttemptLive(companyId: string, attemptId: string): Promise<void> {
  try {
    await ensureAttemptLive(companyId, attemptId);
  } catch (error) {
    console.error("attempt live mirror", error instanceof Error ? error.message.slice(0, 200) : "failed");
  }
}

/** Mark the linked live pad ended when the exam closes. */
export async function endAttemptLive(companyId: string, attemptId: string): Promise<void> {
  try {
    enterTenant({ companyId, publicSlug: "" });
    const sql = await db();
    await sql`
      update live_sessions set status = 'ENDED'
      where company_id = ${companyId} and attempt_id = ${attemptId} and status <> 'ENDED'
    `;
  } catch (error) {
    console.error("attempt live end", error instanceof Error ? error.message.slice(0, 200) : "failed");
  }
}

/** Note that the candidate still has the exam open. */
export async function touchAttemptLive(companyId: string, attemptId: string): Promise<void> {
  try {
    enterTenant({ companyId, publicSlug: "" });
    const sql = await db();
    const sessions = await sql<{ id: string }>`
      select id from live_sessions where company_id = ${companyId} and attempt_id = ${attemptId} limit 1
    `;
    if (!sessions[0]) {
      await ensureAttemptLive(companyId, attemptId);
      return;
    }
    await sql`
      update live_people set last_seen = now()
      where company_id = ${companyId} and session_id = ${sessions[0].id} and role = 'CANDIDATE'
    `;
  } catch {
    // Presence is best-effort; the exam still works.
  }
}

export async function listActiveAttempts(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  if (!canWatchActiveAttempts(actor.role)) {
    allow(actor, "interview.manage");
  }
  const sql = await db();
  const rows = await sql<{
    attempt_id: string;
    started_at: string;
    deadline: string;
    assessment_name: string;
    candidate_name: string;
    job_title: string;
    application_id: string;
    live_token: string | null;
    last_seen: string | null;
  }>`
    select t.id as attempt_id,
      to_char(t.started_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as started_at,
      to_char(t.deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as deadline,
      coalesce(s.name, 'Assessment') as assessment_name,
      coalesce(c.name, c.email, 'Candidate') as candidate_name,
      coalesce(j.title, 'Role') as job_title,
      g.application_id,
      ls.token as live_token,
      to_char(lp.last_seen at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as last_seen
    from attempts t
    join assignments g on g.id = t.assignment_id and g.company_id = t.company_id
    join assessment_versions v on v.id = g.assessment_version_id and v.company_id = t.company_id
    join assessments s on s.id = v.assessment_id and s.company_id = t.company_id
    join applications a on a.id = g.application_id and a.company_id = t.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = t.company_id
    join jobs j on j.id = a.job_id and j.company_id = t.company_id
    left join live_sessions ls on ls.company_id = t.company_id and ls.attempt_id = t.id
    left join lateral (
      select last_seen from live_people
      where company_id = t.company_id and session_id = ls.id and role = 'CANDIDATE'
      order by last_seen desc nulls last
      limit 1
    ) lp on true
    where t.company_id = ${actor.companyId} and t.status = 'IN_PROGRESS'
    order by t.started_at desc
    limit 50
  `;

  const items = [];
  for (const row of rows) {
    // Do not create live pads on the poll path — startAttempt already links them.
    const token = row.live_token;
    if (!token) continue;
    items.push({
      attemptId: row.attempt_id,
      applicationId: row.application_id,
      candidateName: row.candidate_name,
      jobTitle: row.job_title,
      assessmentName: row.assessment_name,
      startedAt: row.started_at,
      deadline: row.deadline,
      lastSeen: row.last_seen,
      liveToken: token,
      watchPath: liveWatchPath(token),
      summary: activeAttemptSummary({
        candidateName: row.candidate_name,
        jobTitle: row.job_title,
        assessmentName: row.assessment_name,
      }),
    });
  }
  return { items, polledAt: new Date().toISOString() };
}
