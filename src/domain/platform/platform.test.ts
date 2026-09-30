import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { describe, it } from "node:test";
import { calendarTokenForm, integrationHealth, interpretBoardResponse, interpretHrisPush } from "./adapters.ts";
import { buildSlots, claimSlot, moveBooking, zonedTimeToUtc } from "./booking.ts";
import { applyDocument, applyOpChain, canSeeNote } from "./collab.ts";
import { boardStatus, canConvert, campaignAfterBounce, campaignAfterReply } from "./crm.ts";
import { brandHtml, brandPlain, chooseMailApplication, classifySandboxAddress, deliveryLabel, nextState, renderTokens, retryDelayMinutes, stripQuotedReply, webhookFresh } from "./delivery.ts";
import { crc32, extractOffice, sniffResume } from "./docx.ts";
import { disposeCase, signalChangesScore, similarityOpensCase, similarityPercent } from "./integrity.ts";
import { explainCutoff, invitesAfterRerank, normalizeStages, personalityCannotGate, rankCutoff, STANDARD_PLAN } from "./plans.ts";
import { buildRfc822, classifySmtpCode, pullSmtpReplies } from "./smtp.ts";
import { gradeCases } from "./score.ts";

describe("delivery", () => {
  it("does not treat acceptance as delivery and stops after five failures", () => {
    const accepted = nextState({ current: "QUEUED", attemptNo: 1, suppressed: false, provider: "smtp", providerResult: "accepted" });
    assert.equal(accepted.state, "ACCEPTED");
    const stored = nextState({ current: "QUEUED", attemptNo: 1, suppressed: false, provider: "sandbox", providerResult: "stored" });
    assert.equal(stored.state, "STORED");
    assert.notEqual(stored.state, "DELIVERED");
    assert.match(deliveryLabel("STORED"), /outside provider/i);
    assert.match(deliveryLabel("ACCEPTED"), /not delivery/i);
    assert.match(deliveryLabel("DELIVERED"), /delivery/i);
    assert.match(deliveryLabel("BOUNCED"), /rejected|bounce/i);
    assert.match(deliveryLabel("SUPPRESSED"), /suppress/i);
    const fifth = nextState({ current: "DEFERRED", attemptNo: 5, suppressed: false, provider: "smtp", providerResult: "failed" });
    assert.equal(fifth.state, "FAILED");
    assert.equal(retryDelayMinutes(3), 4);
    assert.equal(classifySandboxAddress("a@bounce.example"), "bounce");
    assert.equal(renderTokens("Hi {{candidate_name}}", { candidate_name: "Ada" }), "Hi Ada");
    assert.equal(stripQuotedReply("Thanks\n\nOn Monday Ada wrote:\n> old"), "Thanks");
    assert.equal(webhookFresh(1_700_000_000_000, 1_700_000_100), true);
    assert.equal(webhookFresh(1_700_000_000_000, 1_700_000_900), false);
    const only = chooseMailApplication([{ id: "app-1", lifecycle: "ACTIVE", title: "Engineer", name: "Ada" }]);
    assert.deepEqual(only, { id: "app-1" });
    const oneActive = chooseMailApplication([
      { id: "closed", lifecycle: "REJECTED", title: "Old", name: "Ada" },
      { id: "open", lifecycle: "ACTIVE", title: "Engineer", name: "Ada" },
    ]);
    assert.deepEqual(oneActive, { id: "open" });
    const many = chooseMailApplication([
      { id: "a", lifecycle: "ACTIVE", title: "Engineer", name: "Ada" },
      { id: "b", lifecycle: "ACTIVE", title: "Designer", name: "Ada" },
    ]);
    assert.equal("id" in many, false);
    if ("error" in many) assert.match(many.error, /a · Engineer · Ada/);
    const branded = brandPlain("Hello Ada", { companyName: "Northstar", fromName: "Northstar Hiring", footer: "Reply to this note.", logoUrl: "", accent: "#cefa90" });
    assert.match(branded, /^Northstar Hiring/);
    assert.match(branded, /Reply to this note\.$/);
    const html = brandHtml("Hello <Ada>", { companyName: "Northstar", fromName: "", footer: "", logoUrl: "https://cdn.example/logo.png", accent: "#cefa90" }, false);
    assert.match(html, /Hello \u0026lt;Ada\u0026gt;/);
    assert.doesNotMatch(html, /Hello <Ada>/);
    assert.match(html, />Message</);
    assert.match(html, /border-radius:24px/);
    const plain = buildRfc822({ from: "jobs@example.com", to: "ada@example.com", cc: "", subject: "Hello", body: "Hi", messageId: "m1@recruit4us" });
    assert.match(plain, /Content-Type: text\/plain/);
    assert.doesNotMatch(plain, /multipart/);
    const rich = buildRfc822({
      from: "jobs@example.com",
      to: "ada@example.com",
      cc: "",
      subject: "Hello",
      body: "Hi",
      messageId: "m1@recruit4us",
      fromName: "Northstar",
      html: "<p>Hi</p>",
    });
    assert.match(rich, /From: "Northstar" <jobs@example.com>/);
    assert.match(rich, /multipart\/alternative/);
  });
});

describe("score", () => {
  it("leaves a timeout unscored and sums weights for partial credit", () => {
    const timeout = gradeCases({ infra: false, timedOut: true, compileError: "", rows: [{ name: "a", visibility: "HIDDEN", weight: 2, expected: 1 }] });
    assert.equal(timeout.score, null);
    assert.equal(timeout.status, "TIMEOUT");
    const partial = gradeCases({
      infra: false,
      timedOut: false,
      compileError: "",
      rows: [
        { name: "a", visibility: "SAMPLE", weight: 1, expected: 1, value: 1 },
        { name: "b", visibility: "HIDDEN", weight: 3, expected: 2, value: 0 },
      ],
    });
    assert.equal(partial.score, 1);
    assert.equal(partial.maxScore, 4);
    const infra = gradeCases({ infra: true, timedOut: false, compileError: "", rows: [{ name: "a", visibility: "SAMPLE", weight: 1, expected: 1 }] });
    assert.equal(infra.score, null);
  });
});

describe("plans", () => {
  it("includes ties at the cutoff and refuses a personality gate", () => {
    const ranked = rankCutoff(
      [
        { id: "a", score: 10 },
        { id: "b", score: 8 },
        { id: "c", score: 8 },
        { id: "d", score: null },
      ],
      50,
    );
    assert.deepEqual(ranked.advancedIds.sort(), ["a", "b", "c"]);
    assert.deepEqual(ranked.missingIds, ["d"]);
    assert.equal(personalityCannotGate(true).ok, false);
    assert.equal(STANDARD_PLAN[0]?.kind, "REVIEW");
    assert.equal(rankCutoff([{ id: "a", score: 9 }], 50, false).advancedIds.length, 0);
    assert.equal(normalizeStages([{ name: "Panel", kind: "PANEL", reviewers: 2, entryRule: "screen", exitRule: "scorecards", assessmentKey: "coding", scorecardFocus: "design" }]).ok, true);
    assert.equal(normalizeStages([{ name: "Panel", kind: "PANEL" }, { name: "Panel", kind: "OFFER" }]).ok, false);
    assert.deepEqual(invitesAfterRerank(["a", "b"], []), ["a", "b"]);
    const merged = applyOpChain("hello!", [{ at: 5, del: 0, insert: "!" }], { at: 0, del: 0, insert: "X" });
    assert.equal(merged.body, "Xhello!");
    const replies = pullSmtpReplies("250-ready\r\n250 OK\r\n");
    assert.equal(replies.replies[0]?.code, 250);
    assert.equal(classifySmtpCode(550), "failed");
    assert.equal(interpretBoardResponse(401, "{\"error\":\"no\"}").status, "FAILED");
    assert.equal(interpretHrisPush(200, "{}").status, "PUSHED");
    const health = integrationHealth({ smtpHost: false, mailFrom: false, inboundSecret: false, calendarVendor: false, calendarToken: false, jobBoard: false, hris: false, unshare: true, objectStore: false });
    assert.match(health[0]?.state ?? "", /blocked/i);
    assert.match(health.find((row) => row.name === "Object storage")?.state ?? "", /database/i);
    assert.match(explainCutoff({ name: "Ada", score: null, advanced: false, missing: true, cutoffScore: 8, percent: 50 }), /no score/);
    const form = calendarTokenForm({ code: "abc", clientId: "id", clientSecret: "secret", redirectUri: "https://example.com/cb" });
    assert.match(form, /grant_type=authorization_code/);
    assert.doesNotMatch(form, /refresh_token=/);
  });
});

describe("integrity", () => {
  it("flags a copied function and never changes a score from a camera signal", () => {
    const left = "function solve(values) { const seen = new Map(); for (const value of values) { seen.set(value, 1); } return seen.size; }";
    const right = "function solve(values) { const seen = new Map(); for (const value of values) { seen.set(value, 1); } return seen.size; }";
    const short = "function solve(a, b) { return a + b; }";
    assert.ok(similarityPercent(left, right) >= 80);
    assert.equal(similarityPercent(short, "function solve(a, b) { return a - b; }"), 0);
    assert.equal(similarityOpensCase(90, 80), true);
    assert.equal(signalChangesScore(), false);
    assert.equal(disposeCase("OPEN", "DISMISSED").ok, true);
    assert.equal(disposeCase("DISMISSED", "CONFIRMED").ok, false);
  });
});

describe("collab and booking", () => {
  it("rejects a stale edit and skips a spring-forward hour", () => {
    const ok = applyDocument({ revision: 2, body: "a" }, { baseRevision: 2, body: "ab" });
    assert.equal(ok.ok && ok.revision, 3);
    const stale = applyDocument({ revision: 3, body: "ab" }, { baseRevision: 2, body: "zz" });
    assert.equal(stale.ok, false);
    assert.equal(canSeeNote("CANDIDATE", true), false);
    assert.equal(claimSlot("BOOKED").ok, false);
    assert.equal(moveBooking({ fromStatus: "BOOKED", toStatus: "OPEN", samePerson: true }).ok, true);
    assert.equal(moveBooking({ fromStatus: "BOOKED", toStatus: "BOOKED", samePerson: true }).ok, false);
    assert.equal(moveBooking({ fromStatus: "BOOKED", toStatus: "OPEN", samePerson: false }).ok, false);
    const spring = zonedTimeToUtc(2026, 3, 8, 2, 0, "America/New_York");
    const wall = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(spring);
    assert.notEqual(wall, "02");
    const slots = buildSlots({
      from: new Date("2026-03-09T12:00:00Z"),
      days: 1,
      timeZone: "America/New_York",
      startHour: 9,
      endHour: 11,
      durationMin: 45,
      now: new Date("2026-03-01T00:00:00Z"),
    });
    assert.equal(slots.length, 2);
  });
});

describe("docx and crm", () => {
  it("reads a stored DOCX and refuses an unconfigured board", async () => {
    const xml = "<w:document><w:p><w:r><w:t>Ada Lovelace</w:t></w:r></w:p><w:p><w:r><w:t>TypeScript</w:t></w:r></w:p></w:document>";
    const payload = new TextEncoder().encode(xml);
    const name = new TextEncoder().encode("word/document.xml");
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt32LE(crc32(payload), 14);
    header.writeUInt32LE(payload.length, 18);
    header.writeUInt32LE(payload.length, 22);
    header.writeUInt16LE(name.length, 26);
    const zip = Buffer.concat([header, name, payload]);
    const extracted = await extractOffice("ada.docx", zip);
    assert.equal(extracted.status, "OK");
    assert.match(extracted.text, /Ada Lovelace/);
    assert.equal(sniffResume("ada.docx", zip).ok, true);
    assert.equal(sniffResume("scan.docx", new TextEncoder().encode("not a zip")).ok, false);
    assert.equal(sniffResume("old.doc", Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0])).ok, false);
    assert.equal(sniffResume("resume.pdf", new TextEncoder().encode("hello")).ok, false);
    const compressed = deflateRawSync(payload);
    const cheader = Buffer.alloc(30);
    cheader.writeUInt32LE(0x04034b50, 0);
    cheader.writeUInt16LE(8, 8);
    cheader.writeUInt32LE(compressed.length, 18);
    cheader.writeUInt32LE(payload.length, 22);
    cheader.writeUInt16LE(name.length, 26);
    const zipped = Buffer.concat([cheader, name, compressed]);
    const inflated = await extractOffice("ada.docx", zipped);
    assert.equal(inflated.status, "OK");
    const legacy = await extractOffice("old.doc", Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]));
    assert.equal(legacy.status, "REJECTED");
    assert.equal(canConvert("NO").ok, false);
    assert.equal(campaignAfterReply("SENT"), "REPLIED");
    assert.equal(campaignAfterBounce("REPLIED"), "REPLIED");
    assert.equal(boardStatus("linkedin", false, "publish").status, "CONFIG_REQUIRED");
    assert.equal(boardStatus("sandbox-board", true, "publish").status, "PUBLISHED");
  });
});
