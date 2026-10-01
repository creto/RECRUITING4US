import { normalizeRuleDraft } from "@/domain/ops";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import {
  formatInterviewWhen,
  googleCalendarRenderUrl,
  interviewInviteBody,
} from "@/domain/interview-invite";
import { buildIcs, canSeeCompensation, canSeePeerFeedback, reportDayWindow, roleHas, zonedLocalToUtc, assertSafeOutboundUrl } from "@/domain/rules";
import {
  attributesOrDefault,
  focusAttributes,
  rankScoreboard,
  ratingById,
  SCOREBOARD_NOTE,
  submissionError,
  type ScoreAttribute,
} from "@/domain/scorecard";
import { calendarRefreshState } from "@/domain/edge";
import { allow, audit, db, json, nid, requireActor, requireUser } from "./db.server";
import { rememberEvent } from "./workflows.server";

export async function refreshCalendar(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "interview.feedback");
  const token = process.env.CALENDAR_REFRESH_TOKEN?.trim() ?? "";
  const vendor = process.env.CALENDAR_VENDOR_URL?.trim() ?? "";
  let providerError: string | null = null;
  const hasCredential = Boolean(token && vendor);
  if (hasCredential) {
    try {
      const url = assertSafeOutboundUrl(vendor, false);
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) providerError = "Calendar vendor rejected the refresh.";
    } catch {
      providerError = "Calendar vendor could not be reached.";
    }
  }
  const state = calendarRefreshState({ hasCredential, providerError });
  const sql = await db();
  await sql`
    insert into calendar_connections (id, company_id, provider, status, secret_ref, last_error, refreshed_at)
    values (${nid()}, ${actor.companyId}, 'external', ${state.status}, 'env:CALENDAR_REFRESH_TOKEN', ${state.error.slice(0, 300)}, now())
    on conflict (company_id, provider) do update
      set status = excluded.status, last_error = excluded.last_error, refreshed_at = now()
  `;
  return { provider: "external", status: state.status, error: state.error, secret: state.secret };
}

export async function listInterviews(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "interview.feedback");
  const sql = await db();
  return sql`
    select i.id, i.title, i.status, i.timezone, i.location, i.meeting_url, c.name as candidate_name, j.title as job_title,
      to_char(i.starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as starts_at,
      to_char(i.ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ends_at
    from interviews i
    join applications a on a.id = i.application_id
    join candidates c on c.id = a.candidate_id
    join jobs j on j.id = a.job_id
    where i.company_id = ${actor.companyId}
    order by i.starts_at desc
    limit 80
  `;
}

export async function scheduleInterview(
  userId: string,
  input: {
    slug: string;
    applicationId?: string;
    candidateName?: string;
    title: string;
    localStart: string;
    localEnd: string;
    timezone: string;
    location: string;
    meetingUrl: string;
    focusIds: string[];
  },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "interview.manage");
  const { resolveApplicationId } = await import("./platform.server");
  const applicationId = await resolveApplicationId(actor.companyId, {
    applicationId: input.applicationId,
    candidateName: input.candidateName,
  });
  const start = zonedLocalToUtc(input.localStart, input.timezone);
  const end = zonedLocalToUtc(input.localEnd, input.timezone);
  if (end.getTime() <= start.getTime()) throw new Error("The interview must end after it starts.");
  const sql = await db();
  const apps = await sql<{ id: string }>`
    select id from applications where id = ${applicationId} and company_id = ${actor.companyId} and lifecycle = 'ACTIVE'
  `;
  if (!apps[0]) throw new Error("Not found.");
  const jobs = await sql<{ scorecard_attributes: unknown; job_title: string }>`
    select j.scorecard_attributes, j.title as job_title
    from applications a
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    where a.id = ${applicationId} and a.company_id = ${actor.companyId}
  `;
  const focus = focusAttributes(attributesOrDefault(jobs[0]?.scorecard_attributes), input.focusIds);
  if ("error" in focus) throw new Error(focus.error);
  const clash = await sql<{ id: string }>`
    select id from interviews
    where company_id = ${actor.companyId} and status = 'SCHEDULED'
      and starts_at < ${end.toISOString()} and ends_at > ${start.toISOString()}
  `;
  if (clash[0]) throw new Error("That time overlaps another interview in this company.");
  const people = await sql<{ email: string; name: string }>`
    select c.email, c.name from applications a join candidates c on c.id = a.candidate_id where a.id = ${applicationId}
  `;
  const candidateEmail = (people[0]?.email ?? "").trim().toLowerCase();
  const candidateName = people[0]?.name ?? input.candidateName ?? "Candidate";
  const jobTitle = jobs[0]?.job_title ?? "";
  const providedMeet = input.meetingUrl.trim();
  const attendees = [actor.email, candidateEmail].filter((email, index, all) => email.includes("@") && all.indexOf(email) === index);
  const whenLabel = formatInterviewWhen(input.localStart, input.localEnd, input.timezone);
  const id = nid();
  const uid = `${id}@talentflow.example`;

  const { createGoogleMeetInterview } = await import("./calendar.server");
  const meet = await createGoogleMeetInterview(actor.companyId, {
    title: input.title.trim(),
    description: [
      `${actor.companyName} · ${jobTitle}`,
      `Interview: ${input.title.trim()}`,
      `When: ${whenLabel}`,
      providedMeet ? `Meeting link: ${providedMeet}` : "",
      `Organizer: ${actor.name} <${actor.email}>`,
      candidateEmail ? `Candidate: ${candidateName} <${candidateEmail}>` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    timezone: input.timezone,
    location: providedMeet || input.location.trim(),
    attendees,
    requestMeet: !providedMeet,
    idempotencyKey: `interview-meet:${id}`,
  });
  const meetingUrl = (providedMeet || meet.meetUrl || "").slice(0, 300);
  const googleCalendarUrl = googleCalendarRenderUrl({
    title: `${input.title.trim()} · ${jobTitle || actor.companyName}`,
    startUtc: start,
    endUtc: end,
    details: [
      meetingUrl ? `Google Meet: ${meetingUrl}` : "",
      `Company: ${actor.companyName}`,
      jobTitle ? `Role: ${jobTitle}` : "",
      attendees.length ? `Attendees: ${attendees.join(", ")}` : "",
      meet.htmlLink ? `Calendar event: ${meet.htmlLink}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: meetingUrl || input.location.trim(),
    timezone: input.timezone,
  });

  await sql`
    insert into interviews (
      id, company_id, application_id, title, starts_at, ends_at, timezone, location, meeting_url, ics_uid, focus_attributes
    ) values (
      ${id}, ${actor.companyId}, ${applicationId}, ${input.title.trim()}, ${start.toISOString()},
      ${end.toISOString()}, ${input.timezone}, ${input.location}, ${meetingUrl}, ${uid},
      ${json(focus.attributes)}::jsonb
    )
  `;
  await sql`
    insert into interview_participants (id, company_id, interview_id, user_id)
    values (${nid()}, ${actor.companyId}, ${id}, ${actor.userId})
  `;
  try {
    await sql`
      insert into calendar_events (id, company_id, slot_id, provider, external_id, status, title, starts_at, ends_at, detail)
      values (
        ${nid()}, ${actor.companyId}, null, ${meet.provider}, ${meet.externalId}, ${meet.status},
        ${input.title.trim()}, ${start.toISOString()}, ${end.toISOString()}, ${meet.detail.slice(0, 500)}
      )
    `;
  } catch {
    // calendar_events is optional bookkeeping; interview row is the source of truth.
  }

  const inviteBody = interviewInviteBody({
    title: input.title.trim(),
    whenLabel,
    timezone: input.timezone,
    meetUrl: meetingUrl,
    location: input.location.trim(),
    attendees,
    jobTitle,
    companyName: actor.companyName,
    recruiterName: actor.name,
    candidateName,
    appLink: "",
    googleCalendarUrl,
  });

  if (candidateEmail) {
    await sql`
      insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
      values (
        ${nid()}, ${actor.companyId}, ${candidateEmail}, ${"Interview: " + input.title.trim()},
        ${inviteBody},
        'CAPTURED', ${id}
      )
    `;
  }
  await audit(actor, "interview.schedule", "interview", id, meetingUrl ? "Interview scheduled with meeting link." : "Interview scheduled.");
  try {
    const { appLink, queueMail } = await import("./platform.server");
    const portal = appLink(`/candidate/applications/${applicationId}`);
    const body = interviewInviteBody({
      title: input.title.trim(),
      whenLabel,
      timezone: input.timezone,
      meetUrl: meetingUrl,
      location: input.location.trim(),
      attendees,
      jobTitle: "{{job_title}}",
      companyName: "{{company_name}}",
      recruiterName: "{{recruiter_name}}",
      candidateName: "{{candidate_name}}",
      appLink: portal,
      googleCalendarUrl,
    });
    await queueMail(userId, input.slug, {
      applicationId,
      kind: "INTERVIEW",
      subject: "Interview: " + input.title.trim() + " · {{job_title}}",
      body,
      cc: attendees.filter((email) => email !== candidateEmail).join(", "),
      bcc: "",
      idempotencyKey: `interview:${id}`,
    });
  } catch {
    // The interview is already stored. Mail failure is visible in the delivery log.
  }
  return {
    id,
    meetingUrl,
    googleCalendarUrl,
    calendarStatus: meet.status,
    calendarDetail: meet.detail,
  };
}

export async function interviewIcs(userId: string, slug: string, interviewId: string) {
  const actor = await requireActor(userId, slug);
  const sql = await db();
  const rows = await sql<{
    title: string;
    starts_at: string;
    ends_at: string;
    location: string;
    meeting_url: string;
    status: string;
    ics_uid: string;
    ics_sequence: number;
    timezone: string;
    job_title: string;
    candidate_email: string;
    candidate_name: string;
  }>`
    select i.title, i.starts_at::text as starts_at, i.ends_at::text as ends_at, i.location, i.meeting_url,
      i.status, i.ics_uid, i.ics_sequence, i.timezone, j.title as job_title, c.email as candidate_email, c.name as candidate_name
    from interviews i
    join applications a on a.id = i.application_id and a.company_id = i.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    where i.id = ${interviewId} and i.company_id = ${actor.companyId}
  `;
  const row = rows[0];
  if (!row) throw new Error("Not found.");
  const attendees = [actor.email, row.candidate_email]
    .map((email) => email.trim().toLowerCase())
    .filter((email, index, all) => email.includes("@") && all.indexOf(email) === index);
  const startUtc = new Date(row.starts_at);
  const endUtc = new Date(row.ends_at);
  const description = [
    row.meeting_url ? `Google Meet: ${row.meeting_url}` : "RECRUIT4US interview",
    `Company: ${actor.companyName}`,
    `Role: ${row.job_title}`,
    attendees.length ? `Attendees: ${attendees.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const ics = buildIcs({
    uid: row.ics_uid,
    sequence: row.ics_sequence,
    title: row.title,
    description,
    startUtc,
    endUtc,
    location: row.location || row.meeting_url,
    status: row.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
    attendees,
  });
  const googleCalendarUrl = googleCalendarRenderUrl({
    title: `${row.title} · ${row.job_title}`,
    startUtc,
    endUtc,
    details: description,
    location: row.location || row.meeting_url,
    timezone: row.timezone,
  });
  return { ics, filename: "interview.ics", googleCalendarUrl, meetingUrl: row.meeting_url };
}

export async function cancelInterview(userId: string, input: { slug: string; interviewId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "interview.manage");
  const sql = await db();
  const updated = await sql`
    update interviews set status = 'CANCELLED', ics_sequence = ics_sequence + 1
    where id = ${input.interviewId} and company_id = ${actor.companyId} and status = 'SCHEDULED'
    returning id
  `;
  if (!updated[0]) throw new Error("Not found.");
  await audit(actor, "interview.cancel", "interview", input.interviewId, "Interview cancelled.");
  return { ok: true };
}

export async function submitFeedback(
  userId: string,
  input: { slug: string; interviewId: string; ratings: Record<string, string>; recommendation: string; notes: string; submit: boolean },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "interview.feedback");
  const sql = await db();
  const interviews = await sql<{ focus_attributes: unknown }>`
    select focus_attributes from interviews where id = ${input.interviewId} and company_id = ${actor.companyId}
  `;
  if (!interviews[0]) throw new Error("Not found.");
  if (actor.role === "INTERVIEWER") {
    const part = await sql`
      select id from interview_participants
      where interview_id = ${input.interviewId} and user_id = ${actor.userId}
    `;
    if (!part[0]) throw new Error("Not found.");
  }
  const existing = await sql<{ status: string }>`
    select status from interview_feedback
    where interview_id = ${input.interviewId} and company_id = ${actor.companyId} and reviewer_user_id = ${actor.userId}
  `;
  if (existing[0]?.status === "SUBMITTED") throw new Error("This scorecard is already submitted.");
  const attributes = attributesOrDefault(interviews[0].focus_attributes);
  if (input.submit) {
    const problem = submissionError({
      attributes,
      ratings: input.ratings,
      recommendation: input.recommendation,
      notes: input.notes,
    });
    if (problem) throw new Error(problem);
  }
  const status = input.submit ? "SUBMITTED" : "DRAFT";
  await sql`
    insert into interview_feedback (
      id, company_id, interview_id, reviewer_user_id, status, ratings, recommendation, notes, submitted_at
    ) values (
      ${nid()}, ${actor.companyId}, ${input.interviewId}, ${actor.userId}, ${status},
      ${json(input.ratings)}::jsonb, ${input.recommendation}, ${input.notes.slice(0, 4000)},
      ${input.submit ? new Date().toISOString() : null}
    )
    on conflict (company_id, interview_id, reviewer_user_id) do update
    set status = excluded.status, ratings = excluded.ratings, recommendation = excluded.recommendation,
        notes = excluded.notes, submitted_at = excluded.submitted_at
    where interview_feedback.status = 'DRAFT'
  `;
  if (input.submit) await audit(actor, "interview.feedback", "interview", input.interviewId, "Scorecard submitted.");
  return { ok: true };
}

export async function feedbackFor(userId: string, slug: string, interviewId: string) {
  const actor = await requireActor(userId, slug);
  const sql = await db();
  const interviews = await sql<{ focus_attributes: unknown }>`
    select focus_attributes from interviews where id = ${interviewId} and company_id = ${actor.companyId}
  `;
  if (!interviews[0]) throw new Error("Not found.");
  const attributes = attributesOrDefault(interviews[0].focus_attributes);
  const mine = await sql<{ status: string; ratings: Record<string, string>; notes: string; recommendation: string | null }>`
    select status, ratings, notes, recommendation from interview_feedback
    where interview_id = ${interviewId} and company_id = ${actor.companyId} and reviewer_user_id = ${actor.userId}
  `;
  const released = canSeePeerFeedback(actor.role, mine[0]?.status === "SUBMITTED");
  const all = released
    ? await sql<{
      reviewer_user_id: string;
      status: string;
      ratings: Record<string, string>;
      notes: string;
      recommendation: string | null;
      reviewer_name: string | null;
    }>`
        select f.reviewer_user_id, f.status, f.ratings, f.notes, f.recommendation, u.name as reviewer_name
        from interview_feedback f
        left join lateral app_user_identity(f.reviewer_user_id) u on true
        where f.interview_id = ${interviewId} and f.company_id = ${actor.companyId} and f.status = 'SUBMITTED'
      `
    : [];
  return {
    mine: mine[0] ?? null,
    feedback: all.filter((row) => row.reviewer_user_id !== actor.userId).map((row) => presentCard(attributes, row)),
    attributes,
    released,
  };
}

function presentCard(
  attributes: ScoreAttribute[],
  row: { reviewer_user_id: string; reviewer_name?: string | null; ratings: Record<string, string> | null; notes: string; recommendation: string | null; interview_title?: string; interview_id?: string },
) {
  const ratings = row.ratings && typeof row.ratings === "object" ? row.ratings : {};
  return {
    interviewId: row.interview_id ?? "",
    reviewerId: row.reviewer_user_id,
    reviewerName: row.reviewer_name || "Interviewer",
    interviewTitle: row.interview_title ?? "",
    recommendation: row.recommendation ?? "",
    recommendationLabel: ratingById(row.recommendation ?? "")?.label ?? "Not rated",
    notes: row.notes,
    attributes: attributes.map((attribute) => ({
      id: attribute.id,
      label: attribute.label,
      rating: ratings[attribute.id] ?? "",
      ratingLabel: ratingById(ratings[attribute.id] ?? "")?.label ?? "Not rated",
    })),
  };
}

export async function listScoreboard(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "interview.feedback");
  const staff = canSeePeerFeedback(actor.role, true);
  const sql = await db();
  const rows = await sql<{
    application_id: string;
    candidate_name: string;
    job_title: string;
    interview_id: string;
    interview_title: string;
    focus_attributes: unknown;
    recommendation: string | null;
    ratings: Record<string, string> | null;
    notes: string | null;
    reviewer_user_id: string | null;
    reviewer_name: string | null;
  }>`
    select a.id as application_id, c.name as candidate_name, j.title as job_title,
      i.id as interview_id, i.title as interview_title, i.focus_attributes,
      f.recommendation, f.ratings, f.notes, f.reviewer_user_id, u.name as reviewer_name
    from interviews i
    join applications a on a.id = i.application_id and a.company_id = i.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    left join interview_feedback f
      on f.interview_id = i.id and f.company_id = i.company_id and f.status = 'SUBMITTED'
    left join lateral app_user_identity(f.reviewer_user_id) u on f.reviewer_user_id is not null
    where i.company_id = ${actor.companyId} and i.status <> 'CANCELLED'
      and (
        ${staff} = true
        or exists (
          select 1 from interview_participants p
          where p.interview_id = i.id and p.company_id = i.company_id and p.user_id = ${actor.userId}
        )
      )
    order by c.name, i.starts_at
  `;
  const submittedInterviews = new Set(
    rows.filter((row) => row.reviewer_user_id === actor.userId).map((row) => row.interview_id),
  );
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = grouped.get(row.application_id) ?? [];
    list.push(row);
    grouped.set(row.application_id, list);
  }
  const prepared = [...grouped.entries()].map(([applicationId, list]) => {
    const visible = list.filter((row) => row.reviewer_user_id && (staff || submittedInterviews.has(row.interview_id)));
    const waiting = !staff && list.some((row) => !submittedInterviews.has(row.interview_id));
    return {
      applicationId,
      name: list[0]?.candidate_name ?? "Candidate",
      jobTitle: list[0]?.job_title ?? "",
      waiting,
      recommendations: waiting ? [] : visible.map((row) => row.recommendation ?? "").filter((id) => ratingById(id)),
      cards: visible.map((row) => presentCard(attributesOrDefault(row.focus_attributes), {
        reviewer_user_id: row.reviewer_user_id ?? "",
        reviewer_name: row.reviewer_name,
        ratings: row.ratings,
        notes: row.notes ?? "",
        recommendation: row.recommendation,
        interview_title: row.interview_title,
        interview_id: row.interview_id,
      })),
    };
  });
  const ranked = rankScoreboard(prepared);
  return {
    note: SCOREBOARD_NOTE,
    rows: ranked.map((row) => ({
      applicationId: row.applicationId,
      name: row.name,
      jobTitle: row.jobTitle,
      rank: row.rank,
      tied: row.tied,
      average: row.average,
      submitted: row.submitted,
      waiting: row.waiting,
      cards: row.cards,
    })),
  };
}

export async function createSlot(userId: string, input: { slug: string; localStart: string; localEnd: string; timezone: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "interview.manage");
  const start = zonedLocalToUtc(input.localStart, input.timezone);
  const end = zonedLocalToUtc(input.localEnd, input.timezone);
  if (end <= start) throw new Error("The slot must end after it starts.");
  const sql = await db();
  const id = nid();
  await sql`
    insert into interview_slots (id, company_id, starts_at, ends_at, timezone)
    values (${id}, ${actor.companyId}, ${start.toISOString()}, ${end.toISOString()}, ${input.timezone})
  `;
  return { id };
}

export async function listSlots(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  const sql = await db();
  return sql`
    select id, timezone, claimed_application_id,
      to_char(starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as starts_at,
      to_char(ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ends_at
    from interview_slots where company_id = ${actor.companyId}
    order by starts_at
  `;
}

export async function claimSlot(userId: string, slotId: string, applicationId: string) {
  assertSameSiteRequest();
  await requireUser(userId);
  const sql = await db();
  const apps = await sql<{ company_id: string }>`
    select a.company_id from applications a
    join candidates c on c.id = a.candidate_id
    join lateral app_user_identity(${userId}) u on true
    where a.id = ${applicationId}
      and (c.user_id = ${userId} or (lower(c.email) = lower(u.email) and u.email_verified = true))
  `;
  if (!apps[0]) throw new Error("Not found.");
  const claimed = await sql<{ id: string }>`
    update interview_slots set claimed_application_id = ${applicationId}
    where id = ${slotId} and company_id = ${apps[0].company_id} and claimed_application_id is null
    returning id
  `;
  if (!claimed[0]) throw new Error("That slot was just taken.");
  const slot = await sql<{ starts_at: string; ends_at: string; timezone: string }>`
    select starts_at::text as starts_at, ends_at::text as ends_at, timezone
    from interview_slots where id = ${slotId}
  `;
  const interviewId = nid();
  await sql`
    insert into interviews (
      id, company_id, application_id, title, starts_at, ends_at, timezone, ics_uid, status
    ) values (
      ${interviewId}, ${apps[0].company_id}, ${applicationId}, 'Interview',
      ${slot[0]!.starts_at}, ${slot[0]!.ends_at}, ${slot[0]!.timezone}, ${interviewId + "@recruit4us.example"}, 'SCHEDULED'
    )
  `;
  return { interviewId };
}

export async function listOffers(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  if (!roleHas(actor.role, "offer.manage") && !roleHas(actor.role, "offer.approve")) {
    throw new Error("You do not have permission to do that.");
  }
  const show = canSeeCompensation(actor.role);
  const sql = await db();
  const rows = await sql<{
    id: string;
    application_id: string;
    status: string;
    current_revision: number;
    title: string;
    salary_minor: number;
    currency: string;
    candidate_name: string;
    job_title: string;
  }>`
    select o.id, o.application_id, o.status, o.current_revision, r.title, r.salary_minor, r.currency,
      c.name as candidate_name, j.title as job_title
    from offers o
    join offer_revisions r on r.offer_id = o.id and r.company_id = o.company_id and r.revision = o.current_revision
    join applications a on a.id = o.application_id and a.company_id = o.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join jobs j on j.id = a.job_id and j.company_id = a.company_id
    where o.company_id = ${actor.companyId}
    order by o.created_at desc
    limit 200
  `;
  return rows.map((row) => (show ? row : { ...row, salary_minor: null }));
}

export async function createOffer(
  userId: string,
  input: { slug: string; applicationId?: string; candidateName?: string; title: string; salaryMinor: number; currency: string; startDate: string; message: string },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "offer.manage");
  const { resolveApplicationId } = await import("./platform.server");
  const applicationId = await resolveApplicationId(actor.companyId, {
    applicationId: input.applicationId,
    candidateName: input.candidateName,
  });
  const sql = await db();
  const apps = await sql`select id from applications where id = ${applicationId} and company_id = ${actor.companyId}`;
  if (!apps[0]) throw new Error("Not found.");
  const offerId = nid();
  await sql`
    insert into offers (id, company_id, application_id, status, current_revision)
    values (${offerId}, ${actor.companyId}, ${applicationId}, 'PENDING_APPROVAL', 1)
  `;
  await sql`
    insert into offer_revisions (id, company_id, offer_id, revision, title, salary_minor, currency, start_date, message, created_by)
    values (
      ${nid()}, ${actor.companyId}, ${offerId}, 1, ${input.title.trim()}, ${input.salaryMinor}, ${input.currency},
      ${input.startDate || null}, ${input.message.slice(0, 4000)}, ${actor.userId}
    )
  `;
  await audit(actor, "offer.create", "offer", offerId, "Offer drafted and sent for approval.");
  return { offerId };
}

export async function approveOffer(userId: string, input: { slug: string; offerId: string; revision: number }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "offer.approve");
  const sql = await db();
  const offers = await sql<{ current_revision: number; status: string }>`
    select current_revision, status from offers where id = ${input.offerId} and company_id = ${actor.companyId}
  `;
  const offer = offers[0];
  if (!offer) throw new Error("Not found.");
  if (offer.current_revision !== input.revision) throw new Error("Those terms are no longer the current revision.");
  if (offer.status !== "PENDING_APPROVAL" && offer.status !== "APPROVED") {
    throw new Error("This offer cannot be approved in its current state.");
  }
  await sql`
    insert into offer_approvals (id, company_id, offer_id, revision, approver_user_id, decision)
    values (${nid()}, ${actor.companyId}, ${input.offerId}, ${input.revision}, ${actor.userId}, 'APPROVED')
    on conflict (company_id, offer_id, revision, approver_user_id) do nothing
  `;
  const approved = await sql<{ id: string }>`
    update offers set status = 'APPROVED'
    where id = ${input.offerId}
      and company_id = ${actor.companyId}
      and current_revision = ${input.revision}
      and status in ('PENDING_APPROVAL', 'APPROVED')
    returning id
  `;
  if (!approved[0]) throw new Error("This offer cannot be approved in its current state.");
  await audit(actor, "offer.approve", "offer", input.offerId, `Approved revision ${input.revision}.`);
  return { ok: true };
}

export async function sendOffer(userId: string, input: { slug: string; offerId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "offer.manage");
  const sql = await db();
  const offers = await sql<{ status: string; current_revision: number; application_id: string }>`
    select status, current_revision, application_id from offers
    where id = ${input.offerId} and company_id = ${actor.companyId}
  `;
  const offer = offers[0];
  if (!offer) throw new Error("Not found.");
  const approvals = await sql<{ n: number }>`
    select count(*) as n from offer_approvals
    where offer_id = ${input.offerId} and revision = ${offer.current_revision} and decision = 'APPROVED'
  `;
  if (offer.status !== "APPROVED" || Number(approvals[0]?.n ?? 0) < 1) {
    throw new Error("Approve the exact current terms before sending.");
  }
  const sent = await sql<{ id: string }>`
    update offers set status = 'SENT'
    where id = ${input.offerId} and company_id = ${actor.companyId} and status = 'APPROVED'
    returning id
  `;
  if (!sent[0]) throw new Error("Approve the exact current terms before sending.");
  const people = await sql<{ email: string }>`
    select c.email from applications a join candidates c on c.id = a.candidate_id where a.id = ${offer.application_id}
  `;
  if (people[0]) {
    await sql`
      insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
      values (
        ${nid()}, ${actor.companyId}, ${people[0].email}, 'An offer is ready for your review',
        'Open the candidate portal to read the exact revision. This copy stays in the product. Outside delivery is a separate queued message.',
        'CAPTURED', ${input.offerId}
      )
    `;
  }
  await rememberEvent(actor.companyId, "OFFER_SENT", input.offerId, { applicationId: offer.application_id });
  try {
    const { appLink, queueMail } = await import("./platform.server");
    await queueMail(userId, input.slug, {
      applicationId: offer.application_id,
      kind: "OFFER",
      subject: "An offer is ready, {{candidate_name}}",
      body: `Hello {{candidate_name}},\n\n{{company_name}} sent an offer for {{job_title}}. Read that revision before you respond. This email does not accept the offer.\n\n${appLink(`/candidate/offers/${input.offerId}`)}\n\n{{company_name}}`,
      cc: "",
      bcc: "",
      idempotencyKey: `offer:${input.offerId}:${offer.current_revision}`,
    });
  } catch {
    // The offer is already marked sent. Delivery state is on the mail queue.
  }
  return { ok: true };
}

export async function getMyOffer(userId: string, offerId: string) {
  await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    id: string;
    status: string;
    current_revision: number;
    title: string;
    salary_minor: number;
    currency: string;
    start_date: string | null;
    message: string;
    job_title: string;
    company_name: string;
    application_id: string;
  }>`
    select o.id, o.status, o.current_revision, r.title, r.salary_minor, r.currency,
      r.start_date::text as start_date, r.message, j.title as job_title, c.name as company_name,
      a.id as application_id
    from offers o
    join offer_revisions r on r.offer_id = o.id and r.revision = o.current_revision
    join applications a on a.id = o.application_id
    join jobs j on j.id = a.job_id
    join companies c on c.id = o.company_id
    join candidates cand on cand.id = a.candidate_id
    join lateral app_user_identity(${userId}) u on true
    where o.id = ${offerId}
      and o.status in ('SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')
      and (cand.user_id = ${userId} or (lower(cand.email) = lower(u.email) and u.email_verified = true))
  `;
  const offer = rows[0];
  if (!offer) throw new Error("Not found.");
  const response = await sql<{ decision: string; comment: string }>`
    select decision, comment from offer_responses where offer_id = ${offerId}
  `;
  return { offer, response: response[0] ?? null };
}

export async function respondToOffer(
  userId: string,
  input: { offerId: string; revision: number; decision: "ACCEPTED" | "DECLINED"; comment: string },
) {
  assertSameSiteRequest();
  await requireUser(userId);
  const sql = await db();
  const offers = await sql<{
    company_id: string;
    application_id: string;
    status: string;
    current_revision: number;
  }>`
    select o.company_id, o.application_id, o.status, o.current_revision
    from offers o
    join applications a on a.id = o.application_id
    join candidates c on c.id = a.candidate_id
    join lateral app_user_identity(${userId}) u on true
    where o.id = ${input.offerId}
      and (c.user_id = ${userId} or (lower(c.email) = lower(u.email) and u.email_verified = true))
  `;
  const offer = offers[0];
  if (!offer) throw new Error("Not found.");
  const existing = await sql<{ decision: string; revision: number }>`
    select decision, revision from offer_responses where offer_id = ${input.offerId}
  `;
  if (existing[0]) {
    if (existing[0].decision === input.decision && existing[0].revision === input.revision) {
      return { ok: true, replay: true };
    }
    throw new Error("A response is already recorded for this offer.");
  }
  if (offer.status !== "SENT" || offer.current_revision !== input.revision) {
    throw new Error("That offer revision is no longer open.");
  }
  await sql`
    insert into offer_responses (id, company_id, offer_id, revision, decision, comment)
    values (${nid()}, ${offer.company_id}, ${input.offerId}, ${input.revision}, ${input.decision}, ${input.comment.slice(0, 2000)})
  `;
  const responded = await sql<{ id: string }>`
    update offers set status = ${input.decision}
    where id = ${input.offerId}
      and company_id = ${offer.company_id}
      and status = 'SENT'
      and current_revision = ${input.revision}
    returning id
  `;
  if (!responded[0]) throw new Error("That offer revision is no longer open.");
  if (input.decision === "ACCEPTED") {
    await sql`
      update applications set lifecycle = 'HIRED', closed_at = now(), version = version + 1
      where id = ${offer.application_id} and lifecycle = 'ACTIVE'
    `;
    await sql`
      insert into stage_events (id, company_id, application_id, to_lifecycle, actor_user_id, reason)
      values (${nid()}, ${offer.company_id}, ${offer.application_id}, 'HIRED', ${userId}, 'Offer accepted')
    `;
  }
  await rememberEvent(offer.company_id, "OFFER_RESPONDED", input.offerId, {
    applicationId: offer.application_id,
    decision: input.decision,
  });
  return { ok: true, replay: false };
}

export async function getReports(userId: string, slug: string, from?: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "report.read");
  const sql = await db();
  const window = from ? reportDayWindow(from, actor.timezone) : null;
  const volume = window
    ? await sql<{ source: string; n: number }>`
        select source, count(*) as n from applications
        where company_id = ${actor.companyId}
          and submitted_at >= ${window.start.toISOString()} and submitted_at < ${window.end.toISOString()}
        group by source order by n desc
      `
    : await sql<{ source: string; n: number }>`
        select source, count(*) as n from applications
        where company_id = ${actor.companyId}
        group by source order by n desc
      `;
  const pipeline = await sql<{ category: string; n: number }>`
    select s.category, count(*) as n
    from applications a
    join pipeline_stages s on s.id = a.current_stage_id
    where a.company_id = ${actor.companyId} and a.lifecycle = 'ACTIVE'
    group by s.category order by n desc
  `;
  const funnel = await sql<{ category: string; n: number }>`
    select s.category, count(distinct e.application_id) as n
    from stage_events e
    join pipeline_stages s on s.id = e.to_stage_id
    where e.company_id = ${actor.companyId}
    group by s.category
  `;
  const assessments = await sql<{ status: string; n: number }>`
    select status, count(*) as n from assignments where company_id = ${actor.companyId} group by status
  `;
  const offers = await sql<{ status: string; n: number }>`
    select status, count(*) as n from offers where company_id = ${actor.companyId} group by status
  `;
  const scores = await sql<{ basis_points: number }>`
    select basis_points from evaluations
    where company_id = ${actor.companyId} and status = 'FINAL' and origin = 'AUTOMATIC' and basis_points is not null
  `;
  return {
    definition: "Pipeline counts are the current active applications. Cohort counts are distinct applications that have a stage event, not the number of moves. Score counts include only FINAL evaluations.",
    window: window ? { start: window.start.toISOString(), end: window.end.toISOString() } : null,
    volume,
    pipeline,
    funnel,
    assessments,
    offers,
    finalizedScores: scores.length,
  };
}

export async function listRules(userId: string, slug: string) {
  const actor = await requireActor(userId, slug);
  allow(actor, "workflow.manage");
  try {
    const { ensureOpsDefaults } = await import("./ops.server");
    await ensureOpsDefaults(actor.companyId);
  } catch {
    // Existing rules still list if the operations tables are not ready yet.
  }
  const sql = await db();
  return sql`
    select id, name, enabled, trigger_name, conditions, actions, version
    from workflow_rules where company_id = ${actor.companyId} order by created_at
  `;
}

export async function upsertRule(
  userId: string,
  input: {
    slug: string;
    id?: string;
    name: string;
    enabled: boolean;
    trigger: string;
    conditions: unknown;
    actions: unknown;
  },
) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "workflow.manage");
  const draft = normalizeRuleDraft({ trigger: input.trigger, conditions: input.conditions, actions: input.actions });
  if ("error" in draft) throw new Error(draft.error);
  const sql = await db();
  if (input.id) {
    await sql`
      update workflow_rules set name = ${input.name}, enabled = ${input.enabled}, trigger_name = ${draft.trigger},
        conditions = ${JSON.stringify(draft.conditions)}::jsonb, actions = ${JSON.stringify(draft.actions)}::jsonb,
        version = version + 1
      where id = ${input.id} and company_id = ${actor.companyId}
    `;
    return { id: input.id };
  }
  const id = nid();
  await sql`
    insert into workflow_rules (id, company_id, name, enabled, trigger_name, conditions, actions)
    values (
      ${id}, ${actor.companyId}, ${input.name}, ${input.enabled}, ${draft.trigger},
      ${JSON.stringify(draft.conditions)}::jsonb, ${JSON.stringify(draft.actions)}::jsonb
    )
  `;
  return { id };
}
