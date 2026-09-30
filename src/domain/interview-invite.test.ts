import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildIcs } from "./rules.ts";
import {
  formatInterviewWhen,
  googleCalendarRenderUrl,
  googleMeetEventBody,
  interviewInviteBody,
  parseGoogleMeetResponse,
} from "./interview-invite.ts";

describe("interview invite helpers", () => {
  it("builds a Google Calendar deep link with times and details", () => {
    const start = new Date("2026-06-15T13:00:00.000Z");
    const end = new Date("2026-06-15T14:00:00.000Z");
    const url = googleCalendarRenderUrl({
      title: "Screen · Engineer",
      startUtc: start,
      endUtc: end,
      details: "Google Meet: https://meet.google.com/abc-defg-hij",
      location: "https://meet.google.com/abc-defg-hij",
      timezone: "America/New_York",
    });
    assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
    assert.match(url, /action=TEMPLATE/);
    assert.match(url, /text=Screen/);
    assert.match(url, /dates=20260615T130000Z%2F20260615T140000Z/);
    assert.match(url, /ctz=America%2FNew_York/);
    assert.match(url, /meet\.google\.com/);
  });

  it("formats when labels and invite copy with Meet + calendar", () => {
    const when = formatInterviewWhen("2026-06-15T09:00", "2026-06-15T10:00", "America/New_York");
    assert.equal(when, "2026-06-15 09:00 to 2026-06-15 10:00 (America/New_York)");
    const body = interviewInviteBody({
      title: "Screen",
      whenLabel: when,
      timezone: "America/New_York",
      meetUrl: "https://meet.google.com/abc-defg-hij",
      location: "",
      attendees: ["recruiter@example.com", "ada@example.com"],
      jobTitle: "Engineer",
      companyName: "Acme",
      recruiterName: "Sam",
      candidateName: "Ada",
      appLink: "https://hire.example/candidate/applications/1",
      googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
    });
    assert.match(body, /Google Meet: https:\/\/meet\.google\.com\/abc-defg-hij/);
    assert.match(body, /Attendees: recruiter@example\.com, ada@example\.com/);
    assert.match(body, /Add to Google Calendar/);
    assert.match(body, /Role: Engineer/);
  });

  it("parses Meet from Google Calendar API responses and builds conference bodies", () => {
    const ok = parseGoogleMeetResponse(
      200,
      JSON.stringify({
        id: "evt-1",
        hangoutLink: "https://meet.google.com/abc-defg-hij",
        htmlLink: "https://www.google.com/calendar/event?eid=1",
      }),
    );
    assert.equal(ok.ok, true);
    assert.equal(ok.meetUrl, "https://meet.google.com/abc-defg-hij");
    assert.equal(ok.externalId, "evt-1");

    const fromEntries = parseGoogleMeetResponse(
      200,
      JSON.stringify({
        id: "evt-2",
        conferenceData: { entryPoints: [{ entryPointType: "video", uri: "https://meet.google.com/zzz-yyyy-xxx" }] },
      }),
    );
    assert.equal(fromEntries.meetUrl, "https://meet.google.com/zzz-yyyy-xxx");

    const fail = parseGoogleMeetResponse(403, JSON.stringify({ error: { message: "Insufficient Permission" } }));
    assert.equal(fail.ok, false);
    assert.match(fail.detail, /Insufficient Permission/);

    const body = googleMeetEventBody({
      title: "Screen",
      description: "Interview",
      startIso: "2026-06-15T13:00:00.000Z",
      endIso: "2026-06-15T14:00:00.000Z",
      timezone: "America/New_York",
      location: "",
      attendees: ["a@example.com", "b@example.com"],
      requestMeet: true,
      requestId: "req-1",
    });
    assert.equal((body.conferenceData as { createRequest: { conferenceSolutionKey: { type: string } } }).createRequest.conferenceSolutionKey.type, "hangoutsMeet");
    assert.equal((body.attendees as { email: string }[]).length, 2);
  });

  it("puts attendees into ICS", () => {
    const start = new Date("2026-06-15T13:00:00.000Z");
    const ics = buildIcs({
      uid: "evt-1@talentflow",
      sequence: 0,
      title: "Interview",
      description: "Meet",
      startUtc: start,
      endUtc: new Date(start.getTime() + 3600000),
      location: "https://meet.google.com/abc",
      status: "CONFIRMED",
      stamp: start,
      attendees: ["recruiter@example.com", "ada@example.com"],
    });
    assert.match(ics, /ATTENDEE;RSVP=TRUE:mailto:recruiter@example\.com/);
    assert.match(ics, /ATTENDEE;RSVP=TRUE:mailto:ada@example\.com/);
  });
});
