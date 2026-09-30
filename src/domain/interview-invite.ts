/** Pure helpers for interview calendar invites (ICS, Google deep link, copy). */

function icsUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Google Calendar "Add event" deep link. Works without OAuth. */
export function googleCalendarRenderUrl(input: {
  title: string;
  startUtc: Date;
  endUtc: Date;
  details: string;
  location: string;
  timezone?: string;
}): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", input.title.slice(0, 200));
  url.searchParams.set("dates", `${icsUtcStamp(input.startUtc)}/${icsUtcStamp(input.endUtc)}`);
  if (input.details.trim()) url.searchParams.set("details", input.details.slice(0, 4000));
  if (input.location.trim()) url.searchParams.set("location", input.location.slice(0, 500));
  if (input.timezone?.trim()) url.searchParams.set("ctz", input.timezone.trim());
  return url.toString();
}

export function formatInterviewWhen(localStart: string, localEnd: string, timezone: string): string {
  return `${localStart.replace("T", " ")} to ${localEnd.replace("T", " ")} (${timezone})`;
}

/** Body used for email + in-app mailbox when an interview is scheduled. */
export function interviewInviteBody(input: {
  title: string;
  whenLabel: string;
  timezone: string;
  meetUrl: string;
  location: string;
  attendees: string[];
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  candidateName: string;
  appLink: string;
  googleCalendarUrl: string;
}): string {
  const lines = [
    `Hello ${input.candidateName || "{{candidate_name}}"},`,
    "",
    `${input.companyName || "{{company_name}}"} invited you to ${input.title}.`,
    "",
    `Role: ${input.jobTitle || "{{job_title}}"}`,
    `When: ${input.whenLabel}`,
  ];
  if (input.meetUrl) lines.push(`Google Meet: ${input.meetUrl}`);
  if (input.location.trim() && input.location.trim() !== input.meetUrl) {
    lines.push(`Where: ${input.location.trim()}`);
  }
  if (input.attendees.length) lines.push(`Attendees: ${input.attendees.join(", ")}`);
  lines.push("");
  if (input.googleCalendarUrl) {
    lines.push("Add to Google Calendar:");
    lines.push(input.googleCalendarUrl);
    lines.push("");
  }
  lines.push("An .ics calendar file is also available from Interviews / your application page.");
  if (input.appLink) {
    lines.push("");
    lines.push("Open your application:");
    lines.push(input.appLink);
  }
  lines.push("");
  lines.push(input.recruiterName || "{{recruiter_name}}");
  return lines.join("\n");
}

/** Parse Meet URI from a Google Calendar events.insert response body. */
export function parseGoogleMeetResponse(
  status: number,
  body: string,
): { ok: boolean; externalId: string; meetUrl: string; htmlLink: string; detail: string } {
  let parsed: {
    id?: string;
    hangoutLink?: string;
    htmlLink?: string;
    error?: { message?: string };
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  } = {};
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    parsed = {};
  }
  if (status < 200 || status >= 300) {
    return {
      ok: false,
      externalId: "",
      meetUrl: "",
      htmlLink: "",
      detail: (parsed.error?.message || `Google Calendar returned ${status}. The interview stays here with an ICS and Add-to-calendar link.`).slice(0, 300),
    };
  }
  const fromEntries =
    parsed.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video" && entry.uri)?.uri ?? "";
  const meetUrl = String(parsed.hangoutLink || fromEntries || "").trim();
  return {
    ok: true,
    externalId: String(parsed.id ?? "").slice(0, 120),
    meetUrl: meetUrl.slice(0, 300),
    htmlLink: String(parsed.htmlLink ?? "").slice(0, 500),
    detail: meetUrl
      ? "Google Calendar accepted the event and created a Meet link. Attendees were invited when sendUpdates was allowed."
      : "Google Calendar accepted the event. No Meet link was returned; use the Add-to-calendar link or ICS.",
  };
}

/** JSON body for Google Calendar events.insert with optional Meet conference. */
export function googleMeetEventBody(input: {
  title: string;
  description: string;
  startIso: string;
  endIso: string;
  timezone: string;
  location: string;
  attendees: string[];
  requestMeet: boolean;
  requestId: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    summary: input.title.slice(0, 200),
    description: input.description.slice(0, 8000),
    location: input.location.slice(0, 500),
    start: { dateTime: input.startIso, timeZone: input.timezone },
    end: { dateTime: input.endIso, timeZone: input.timezone },
    attendees: input.attendees
      .filter((email) => email.includes("@"))
      .slice(0, 20)
      .map((email) => ({ email: email.trim().toLowerCase() })),
  };
  if (input.requestMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: input.requestId.slice(0, 64),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  return body;
}

export const GOOGLE_CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all";
