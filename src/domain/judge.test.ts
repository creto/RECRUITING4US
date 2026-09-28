import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  answersMatch,
  codeJudgeScore,
  dedupeCases,
  estimateComplexity,
  rankCodeResponses,
} from "./judge.ts";

const LINEAR = `
function deduplicateEvents(events, windowMs) {
  const last = new Map();
  const kept = [];
  for (const event of events) {
    const previous = last.get(event.id);
    if (previous !== undefined && event.timestampMs - previous <= windowMs) continue;
    last.set(event.id, event.timestampMs);
    kept.push(event);
  }
  return kept;
}
`;

const QUADRATIC = `
function deduplicateEvents(events, windowMs) {
  const kept = [];
  for (const event of events) {
    let drop = false;
    for (let i = 0; i < kept.length; i++) {
      const prev = kept[i];
      if (prev.id === event.id && event.timestampMs - prev.timestampMs <= windowMs) drop = true;
    }
    if (!drop) kept.push(event);
  }
  return kept;
}
`;

describe("code judge", () => {
  it("estimates time class from loops, sort, and branching recursion", () => {
    assert.equal(estimateComplexity(LINEAR).timeClass, "O(n)");
    assert.equal(estimateComplexity(LINEAR).spaceClass, "O(n)");
    assert.equal(estimateComplexity(QUADRATIC).timeClass, "O(n^2)");
    assert.equal(estimateComplexity("function deduplicateEvents(events) { return events; }").timeClass, "O(1)");
    assert.equal(estimateComplexity("function fib(n) { if (n < 2) return n; return fib(n - 1) + fib(n - 2); }").timeClass, "O(2^n)");
    assert.equal(estimateComplexity("function f(a) { return a.slice().sort((x, y) => x - y); }").timeClass, "O(n log n)");
    assert.equal(estimateComplexity("").timeClass, "unknown");
  });

  it("withholds complexity credit until every case passes", () => {
    const full = codeJudgeScore({ passed: 5, total: 5, timeClass: "O(n)", measuredMs: 0 });
    assert.equal(full.basisPoints, 9600);
    const slower = codeJudgeScore({ passed: 5, total: 5, timeClass: "O(n^2)", measuredMs: 0 });
    assert.equal(slower.basisPoints, 8700);
    const partial = codeJudgeScore({ passed: 3, total: 5, timeClass: "O(1)", measuredMs: 0 });
    assert.equal(partial.basisPoints, 4200);
    assert.match(partial.reason, /withheld/);
    assert.equal(codeJudgeScore({ passed: 0, total: 0, timeClass: "O(n)", measuredMs: 1 }).basisPoints, null);
  });

  it("ranks a correct linear answer above a correct quadratic one and a wrong constant one", () => {
    const ranked = rankCodeResponses([
      { id: "wrong", status: "JUDGED" as const, passed: 0, total: 5, timeClass: "O(1)" as const, spaceClass: "O(1)" as const, measuredMs: 0, basisPoints: 0 },
      { id: "quad", status: "JUDGED" as const, passed: 5, total: 5, timeClass: "O(n^2)" as const, spaceClass: "O(n)" as const, measuredMs: 0, basisPoints: 8700 },
      { id: "linear", status: "JUDGED" as const, passed: 5, total: 5, timeClass: "O(n)" as const, spaceClass: "O(n)" as const, measuredMs: 1, basisPoints: 9600 },
      { id: "hung", status: "TIMED_OUT" as const, passed: null, total: 5, timeClass: "O(2^n)" as const, spaceClass: "O(n)" as const, measuredMs: null, basisPoints: null },
    ]);
    assert.deepEqual(ranked.map((row) => row.id), ["linear", "quad", "wrong", "hung"]);
    assert.deepEqual(ranked.map((row) => row.rank), [1, 2, 3, null]);
    const tied = rankCodeResponses([
      { id: "a", status: "JUDGED" as const, passed: 5, total: 5, timeClass: "O(n)" as const, spaceClass: "O(n)" as const, measuredMs: 1, basisPoints: 9600 },
      { id: "b", status: "JUDGED" as const, passed: 5, total: 5, timeClass: "O(n)" as const, spaceClass: "O(n)" as const, measuredMs: 1, basisPoints: 9600 },
    ]);
    assert.equal(tied[0]?.rank, 1);
    assert.equal(tied[1]?.rank, 1);
  });

  it("accepts event objects or the same timestamps and does not leak a hidden key", () => {
    const cases = dedupeCases();
    const sample = cases[0]!;
    assert.equal(answersMatch(sample.expected, sample.expected), true);
    assert.equal(answersMatch([0, 6, 11], sample.expected), true);
    assert.equal(answersMatch([0, 5, 6, 10, 11], sample.expected), false);
    assert.equal(JSON.stringify(cases).includes("HIDDEN_SENTINEL"), false);
  });
});
