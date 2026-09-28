import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptsResponseAt,
  assertSafeOutboundUrl,
  buildIcs,
  calculateAttemptDeadline,
  calculateWeightedScore,
  canDownloadFile,
  canReadApplication,
  canSeePeerFeedback,
  canSetLifecycle,
  canStartAttempt,
  executionUnavailable,
  idempotencyDecision,
  rubricComplete,
  canTransitionJob,
  classifyDelivery,
  deduplicateEvents,
  escapeCsvCell,
  filePolicy,
  gradeExactMultipleChoice,
  gradeNumeric,
  meetsThreshold,
  roleHas,
  scanDecision,
  triAnd,
  triScoreAtLeast,
  validateAssessmentPublish,
  validateSavedViewFilters,
  zonedLocalToUtc,
  applyScan,
  assertSameCompany,
  bookingIntent,
  bulkProgress,
  candidateExportPayload,
  choosePool,
  distinctApplicationCount,
  grantAllows,
  includeInScoreDistribution,
  mapExternalScore,
  operationalFailure,
  outboxDisposition,
  planExtension,
  questionIndex,
  reportDayWindow,
  retentionDue,
  saveStatusLabel,
  seededShuffle,
} from "./rules.ts";

describe("assessment invariants", () => {
  const start = new Date("2026-01-15T10:00:00.000Z");

  it("grants 1.5x time and explicit extra seconds", () => {
    const result = calculateAttemptDeadline({
      startedAt: start,
      durationSeconds: 3600,
      multiplierBasisPoints: 15000,
      extraSeconds: 120,
      hardFinishBy: null,
    });
    assert.equal(result.toISOString(), "2026-01-15T11:32:00.000Z");
  });

  it("caps effective time at the explicit hard finish", () => {
    const result = calculateAttemptDeadline({
      startedAt: start,
      durationSeconds: 3600,
      multiplierBasisPoints: 15000,
      extraSeconds: 0,
      hardFinishBy: new Date("2026-01-15T10:45:00.000Z"),
    });
    assert.equal(result.toISOString(), "2026-01-15T10:45:00.000Z");
  });

  it("uses an exclusive deadline boundary", () => {
    const deadline = new Date("2026-01-15T11:00:00.000Z");
    assert.equal(
      acceptsResponseAt({ status: "IN_PROGRESS", deadline, now: new Date("2026-01-15T10:59:59.999Z") }),
      true,
    );
    assert.equal(acceptsResponseAt({ status: "IN_PROGRESS", deadline, now: deadline }), false);
    assert.equal(acceptsResponseAt({ status: "SUBMITTED", deadline, now: start }), false);
  });

  it("does not award exact-match credit for extra options", () => {
    assert.equal(gradeExactMultipleChoice(["a", "c"], ["a", "c"]), 1);
    assert.equal(gradeExactMultipleChoice(["a"], ["a", "c"]), 0);
    assert.equal(gradeExactMultipleChoice(["a", "b", "c"], ["a", "c"]), 0);
  });

  it("accepts the numeric tolerance boundary", () => {
    assert.equal(gradeNumeric({ answer: "10.1", expected: "10", absTolerance: "0.1", relTolerance: "0" }), true);
    assert.equal(
      gradeNumeric({ answer: "10.1001", expected: "10", absTolerance: "0.1", relTolerance: "0" }),
      false,
    );
  });

  it("rejects non-finite and locale numeric input", () => {
    assert.equal(gradeNumeric({ answer: "NaN", expected: "10", absTolerance: "0", relTolerance: "0" }), false);
    assert.equal(gradeNumeric({ answer: "10,1", expected: "10", absTolerance: "1", relTolerance: "0" }), false);
    assert.equal(parseSafe("Infinity"), null);
  });

  it("weights finalized sections and preserves pending status", () => {
    assert.deepEqual(
      calculateWeightedScore([
        { earned: 8, possible: 10, weightBasisPoints: 2500, status: "FINAL" },
        { earned: 18, possible: 20, weightBasisPoints: 7500, status: "FINAL" },
      ]),
      { status: "FINAL", basisPoints: 8750, numerator: "8750", denominator: "1" },
    );
    assert.deepEqual(
      calculateWeightedScore([
        { earned: 8, possible: 10, weightBasisPoints: 2500, status: "FINAL" },
        { earned: null, possible: 20, weightBasisPoints: 7500, status: "PENDING" },
      ]),
      { status: "PENDING", basisPoints: null, numerator: null, denominator: null },
    );
  });

  it("does not use rounded display percentages for decisions", () => {
    assert.equal(meetsThreshold({ earned: 1599, possible: 2000 }, 8000), false);
    assert.equal(meetsThreshold({ earned: 1600, possible: 2000 }, 8000), true);
  });

  it("weights unequal sections instead of averaging raw points", () => {
    const weighted = calculateWeightedScore([
      { earned: 40, possible: 40, weightBasisPoints: 4000, status: "FINAL" },
      { earned: 20, possible: 40, weightBasisPoints: 3000, status: "FINAL" },
      { earned: 20, possible: 40, weightBasisPoints: 2000, status: "FINAL" },
      { earned: 10, possible: 40, weightBasisPoints: 1000, status: "FINAL" },
    ]);
    assert.equal(weighted.status, "FINAL");
    assert.equal(weighted.basisPoints, 6750);
    assert.notEqual(weighted.basisPoints, 5625);
  });

  it("rejects a start exactly at the start-by instant", () => {
    const now = new Date("2026-01-15T12:00:00.000Z");
    assert.equal(canStartAttempt({ now, startBy: now, deadline: new Date(now.getTime() + 1000) }), false);
    assert.equal(
      canStartAttempt({
        now: new Date(now.getTime() - 1),
        startBy: now,
        deadline: new Date(now.getTime() + 1000),
      }),
      true,
    );
  });
});

function parseSafe(value: string) {
  return gradeNumeric({ answer: value, expected: "1", absTolerance: "0", relTolerance: "0" }) ? 1 : null;
}

describe("deduplicate events", () => {
  it("keeps the sample window", () => {
    const events = [
      { id: "a", timestampMs: 0 },
      { id: "a", timestampMs: 5 },
      { id: "b", timestampMs: 6 },
      { id: "a", timestampMs: 10 },
      { id: "a", timestampMs: 11 },
    ];
    assert.deepEqual(deduplicateEvents(events, 10), [
      { id: "a", timestampMs: 0 },
      { id: "b", timestampMs: 6 },
      { id: "a", timestampMs: 11 },
    ]);
  });

  it("does not let a dropped event extend the window", () => {
    const events = [
      { id: "a", timestampMs: 0 },
      { id: "a", timestampMs: 10 },
      { id: "a", timestampMs: 20 },
    ];
    assert.deepEqual(
      deduplicateEvents(events, 10).map((e) => e.timestampMs),
      [0, 20],
    );
  });

  it("treats ids as case-sensitive and rejects unsorted input", () => {
    assert.equal(deduplicateEvents([{ id: "A", timestampMs: 0 }, { id: "a", timestampMs: 1 }], 10).length, 2);
    assert.throws(() => deduplicateEvents([{ id: "a", timestampMs: 2 }, { id: "a", timestampMs: 1 }], 0));
    assert.throws(() => deduplicateEvents([{ id: "a", timestampMs: -1 }], 0));
  });

  it("matches a naive reference on random sequences", () => {
    let seed = 17;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed;
    };
    for (let n = 0; n < 30; n += 1) {
      const events: { id: string; timestampMs: number }[] = [];
      let t = 0;
      const count = 20 + (rand() % 40);
      for (let i = 0; i < count; i += 1) {
        t += rand() % 8;
        events.push({ id: String.fromCharCode(97 + (rand() % 4)), timestampMs: t });
      }
      const window = rand() % 15;
      assert.deepEqual(deduplicateEvents(events, window), naiveDedupe(events, window));
    }
  });
});

function naiveDedupe(events: { id: string; timestampMs: number }[], windowMs: number) {
  const last = new Map<string, number>();
  const out: { id: string; timestampMs: number }[] = [];
  for (const event of events) {
    const prev = last.get(event.id);
    if (prev !== undefined && event.timestampMs - prev <= windowMs) continue;
    last.set(event.id, event.timestampMs);
    out.push(event);
  }
  return out;
}

describe("hiring rules", () => {
  it("blocks cross-role reads and last-step job transitions", () => {
    assert.equal(roleHas("INTERVIEWER", "offer.read_comp"), false);
    assert.equal(roleHas("OWNER", "member.manage"), true);
    assert.equal(canReadApplication({ role: "INTERVIEWER", assignedToActor: false }), false);
    assert.equal(canReadApplication({ role: "INTERVIEWER", assignedToActor: true }), true);
    assert.equal(canReadApplication({ role: "RECRUITER", assignedToActor: false }), true);
    assert.equal(canTransitionJob("DRAFT", "PUBLISHED"), true);
    assert.equal(canTransitionJob("DRAFT", "ARCHIVED"), false);
    assert.equal(canTransitionJob("CLOSED", "PUBLISHED"), false);
    assert.equal(canSetLifecycle("WITHDRAWN", "ACTIVE"), true);
    assert.equal(canSetLifecycle("HIRED", "ACTIVE"), false);
    assert.equal(canSetLifecycle("ACTIVE", "REJECTED"), true);
    assert.equal(canSeePeerFeedback("INTERVIEWER", false), false);
    assert.equal(canSeePeerFeedback("INTERVIEWER", true), true);
    assert.equal(canSeePeerFeedback("RECRUITER", false), true);
    assert.equal(rubricComplete({ evidence: 3, collaboration: 0 }, ["evidence", "collaboration"]), true);
    assert.equal(rubricComplete({ evidence: 3 }, ["evidence", "collaboration"]), false);
    assert.equal(idempotencyDecision(null, "abc"), "proceed");
    assert.equal(idempotencyDecision({ payloadHash: "abc" }, "abc"), "replay");
    assert.equal(idempotencyDecision({ payloadHash: "abc" }, "def"), "conflict");
    assert.equal(canDownloadFile("CLEAN"), true);
    assert.equal(canDownloadFile("QUARANTINE"), false);
    assert.equal(canDownloadFile("INFECTED"), false);
    assert.equal(executionUnavailable().available, false);
  });

  it("escapes spreadsheet formula payloads", () => {
    assert.equal(escapeCsvCell("=cmd()"), "'=cmd()");
    assert.equal(escapeCsvCell('+1+1'), "'+1+1");
    assert.equal(escapeCsvCell("safe"), "safe");
    assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""');
  });

  it("rejects unsupported saved filters", () => {
    assert.equal(validateSavedViewFilters([{ field: "email", op: "contains", value: "a" }]).ok, true);
    assert.equal(validateSavedViewFilters([{ field: "salary", op: "eq", value: "1" }]).ok, false);
    assert.equal(validateSavedViewFilters([{ field: "email", op: "regex", value: "a" }]).ok, false);
  });

  it("does not treat unknown workflow data as failure", () => {
    assert.equal(triScoreAtLeast(null, "PENDING", 8000), "unknown");
    assert.equal(triAnd(["true", "unknown"]), "unknown");
    assert.equal(triAnd(["true", "false"]), "false");
    assert.equal(classifyDelivery("timeout"), "UNKNOWN");
    assert.equal(classifyDelivery("ok"), "DELIVERED");
  });

  it("rejects incomplete publish and unsafe urls", () => {
    const issues = validateAssessmentPublish({
      durationSeconds: 0,
      sections: [
        {
          title: "Judgment",
          weightBasisPoints: 5000,
          items: [{ type: "single", hasKey: false, hasRubric: false, points: 1 }],
        },
      ],
    });
    assert.ok(issues.some((issue) => issue.code === "weights"));
    assert.ok(issues.some((issue) => issue.code === "key"));
    const rubric = validateAssessmentPublish({
      durationSeconds: 600,
      sections: [
        {
          title: "Writing",
          weightBasisPoints: 10000,
          items: [{ type: "text", hasKey: false, hasRubric: false, points: 1 }],
        },
      ],
    });
    assert.ok(rubric.some((issue) => issue.code === "rubric"));
    assert.throws(() => assertSafeOutboundUrl("http://169.254.169.254/latest", false));
    assert.throws(() => assertSafeOutboundUrl("https://metadata.google.internal/", false));
    assert.equal(filePolicy({ name: "cv.exe", mime: "application/pdf", size: 20 }), "Upload a PDF, text, CSV, PNG, or JPEG file.");
    assert.equal(filePolicy({ name: "cv.pdf", mime: "text/plain", size: 20 })?.includes("does not match"), true);
    assert.equal(scanDecision({ name: "note.txt", textSample: "<script>alert(1)</script>" }), "INFECTED");
    assert.equal(scanDecision({ name: "note.txt", textSample: "hello" }), "CLEAN");
  });

  it("validates daylight-saving gaps and keeps a stable calendar uid", () => {
    assert.throws(() => zonedLocalToUtc("2026-03-08T02:30", "America/New_York"));
    assert.throws(() => zonedLocalToUtc("2026-11-01T01:30", "America/New_York"));
    const ok = zonedLocalToUtc("2026-06-15T09:00", "America/New_York");
    assert.equal(ok.toISOString(), "2026-06-15T13:00:00.000Z");
    const first = buildIcs({
      uid: "evt-1@talentflow",
      sequence: 0,
      title: "Interview",
      description: "Bring a notebook",
      startUtc: ok,
      endUtc: new Date(ok.getTime() + 3600000),
      location: "https://meet.example/room",
      status: "CONFIRMED",
      stamp: ok,
    });
    const next = buildIcs({
      uid: "evt-1@talentflow",
      sequence: 1,
      title: "Interview",
      description: "Moved",
      startUtc: ok,
      endUtc: new Date(ok.getTime() + 3600000),
      location: "https://meet.example/room",
      status: "CONFIRMED",
      stamp: ok,
    });
    assert.match(first, /UID:evt-1@talentflow/);
    assert.match(first, /SEQUENCE:0/);
    assert.match(next, /SEQUENCE:1/);
    assert.match(next, /UID:evt-1@talentflow/);
  });
});

describe("remaining contracts", () => {
  it("rejects a pool that is larger than the bank and keeps a stable draw", () => {
    assert.throws(() => choosePool(["a", "b"], 3, "seed"));
    const first = choosePool(["a", "b", "c", "d"], 2, "attempt-1");
    const second = choosePool(["a", "b", "c", "d"], 2, "attempt-1");
    assert.deepEqual(first, second);
    assert.equal(first.length, 2);
    assert.deepEqual(seededShuffle(["a", "b", "c"], "same"), seededShuffle(["a", "b", "c"], "same"));
    const issues = validateAssessmentPublish({
      durationSeconds: 60,
      sections: [
        {
          title: "Pool",
          weightBasisPoints: 10000,
          poolPick: 5,
          items: [{ type: "text", hasKey: true, hasRubric: true, points: 1 }],
        },
      ],
    });
    assert.ok(issues.some((issue) => issue.code === "pool"));
  });

  it("extends an open attempt and refuses a closed one", () => {
    const deadline = new Date("2026-01-15T11:00:00.000Z");
    const next = planExtension({
      status: "IN_PROGRESS",
      deadline,
      extraSeconds: 300,
      hardFinishBy: null,
    });
    assert.equal(next.toISOString(), "2026-01-15T11:05:00.000Z");
    assert.throws(() =>
      planExtension({ status: "SUBMITTED", deadline, extraSeconds: 60, hardFinishBy: null }),
    );
    assert.throws(() =>
      planExtension({
        status: "IN_PROGRESS",
        deadline,
        extraSeconds: 3600,
        hardFinishBy: deadline,
      }),
    );
  });

  it("blocks a cross-company merge and keeps external scales", () => {
    assert.throws(() => assertSameCompany("co-a", "co-b"));
    assert.doesNotThrow(() => assertSameCompany("co-a", "co-a"));
    assert.deepEqual(mapExternalScore({ raw: "8", scaleMin: "0", scaleMax: "10" }), {
      status: "FINAL",
      basisPoints: 8000,
    });
    assert.deepEqual(mapExternalScore({ raw: "nope", scaleMin: "0", scaleMax: "10" }), {
      status: "FAILED",
      basisPoints: null,
    });
    assert.equal(operationalFailure().basisPoints, null);
  });

  it("quarantines scanner errors and expires download grants", () => {
    assert.equal(applyScan("ERROR"), "QUARANTINE");
    assert.equal(applyScan("CLEAN"), "CLEAN");
    const now = new Date("2026-01-15T12:00:00.000Z");
    assert.equal(
      grantAllows({
        now,
        expiresAt: new Date("2026-01-15T12:05:00.000Z"),
        fileId: "f",
        grantFileId: "f",
        companyId: "co-a",
        grantCompanyId: "co-a",
        userId: "u",
        grantUserId: "u",
      }),
      true,
    );
    assert.equal(
      grantAllows({
        now,
        expiresAt: now,
        fileId: "f",
        grantFileId: "f",
        companyId: "co-a",
        grantCompanyId: "co-a",
        userId: "u",
        grantUserId: "u",
      }),
      false,
    );
    assert.equal(
      grantAllows({
        now,
        expiresAt: new Date("2026-01-15T12:05:00.000Z"),
        fileId: "f",
        grantFileId: "f",
        companyId: "co-a",
        grantCompanyId: "co-b",
        userId: "u",
        grantUserId: "u",
      }),
      false,
    );
  });

  it("counts people once, drops unfinished scores, and bounds a local day", () => {
    assert.equal(distinctApplicationCount(["a", "a", "b"]), 2);
    assert.equal(includeInScoreDistribution("FINAL"), true);
    assert.equal(includeInScoreDistribution("PENDING"), false);
    assert.equal(includeInScoreDistribution("FAILED"), false);
    const window = reportDayWindow("2026-06-15", "America/New_York");
    assert.equal(window.start.toISOString(), "2026-06-15T04:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-06-16T04:00:00.000Z");
    assert.equal(retentionDue(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-31T00:00:00.000Z"), 30), true);
    assert.equal(retentionDue(new Date("2026-01-20T00:00:00.000Z"), new Date("2026-01-31T00:00:00.000Z"), 30), false);
    assert.deepEqual(candidateExportPayload([{ id: "app" }]), { applications: [{ id: "app" }] });
    assert.deepEqual(bulkProgress(["a", "b", "c"], 1), { done: false, remaining: ["b", "c"] });
    assert.equal(bookingIntent("int-1"), "reuse");
    assert.equal(bookingIntent(null), "create");
    assert.equal(outboxDisposition(5, false), "fail");
    assert.equal(outboxDisposition(1, true), "skip");
    assert.equal(outboxDisposition(1, false), "claim");
    assert.equal(questionIndex(0, "ArrowRight", 3), 1);
    assert.equal(questionIndex(0, "ArrowLeft", 3), null);
    assert.equal(saveStatusLabel("unsaved"), "Unsaved changes.");
    assert.equal(saveStatusLabel("saved"), "Saved on the server.");
    assert.match(saveStatusLabel("offline"), /Not saved/);
  });
});

