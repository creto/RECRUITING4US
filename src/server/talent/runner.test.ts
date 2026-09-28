import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { answersMatch, dedupeCases } from "../../domain/judge.ts";
import { judgeIsolated, runIsolated } from "./runner.server.ts";

const reference = `
function dedupe(events, windowMs) {
  const last = new Map();
  const kept = [];
  for (const event of events) {
    const previous = last.get(event.id);
    if (previous !== undefined && event.timestampMs - previous <= windowMs) continue;
    last.set(event.id, event.timestampMs);
    kept.push(event.timestampMs);
  }
  console.log(JSON.stringify(kept));
}
dedupe([
  { id: "a", timestampMs: 0 },
  { id: "a", timestampMs: 5 },
  { id: "b", timestampMs: 6 },
  { id: "a", timestampMs: 10 },
  { id: "a", timestampMs: 11 },
], 10);
`;

describe("isolated runner", () => {
  it("runs a reference solution outside the application process", async () => {
    const result = await runIsolated(reference);
    assert.equal(result.available, true);
    assert.equal(result.timedOut, false);
    assert.equal(result.status, "SUCCEEDED");
    assert.match(result.outputExcerpt, /\[0,6,11\]/);
  });

  it("does not let the program read the filesystem", async () => {
    const result = await runIsolated(`require("fs").readFileSync("/etc/passwd","utf8")`);
    assert.equal(result.status, "FAILED");
    assert.doesNotMatch(result.outputExcerpt, /root:/);
  });

  it("stops a runaway program and truncates huge output", { timeout: 10000 }, async () => {
    const hung = await runIsolated("while (true) {}");
    assert.equal(hung.status, "TIMED_OUT");
    assert.equal(hung.timedOut, true);
    assert.equal(hung.outputExcerpt.includes("score"), false);
    const noisy = await runIsolated("console.log('z'.repeat(20000))");
    assert.equal(noisy.status, "SUCCEEDED");
    assert.equal(noisy.truncated, true);
    assert.ok(noisy.outputExcerpt.length <= 4000);
  });

  it("checks a reference solution against an edge and a random window", async () => {
    const edge = await runIsolated(`
      function dedupe(events, windowMs) {
        const last = new Map();
        const kept = [];
        for (const event of events) {
          const previous = last.get(event.id);
          if (previous !== undefined && event.timestampMs - previous <= windowMs) continue;
          last.set(event.id, event.timestampMs);
          kept.push(event.timestampMs);
        }
        console.log(JSON.stringify(kept));
      }
      dedupe([{ id: "a", timestampMs: 4 }, { id: "a", timestampMs: 4 }], 0);
    `);
    assert.equal(edge.status, "SUCCEEDED");
    assert.match(edge.outputExcerpt, /\[4\]/);

    const events = Array.from({ length: 6 }, (_, index) => ({
      id: index % 2 === 0 ? "a" : "b",
      timestampMs: index * (1 + Math.floor(Math.random() * 4)),
    }));
    const windowMs = 1 + Math.floor(Math.random() * 8);
    const expected = [];
    const last = new Map();
    for (const event of events) {
      const previous = last.get(event.id);
      if (previous !== undefined && event.timestampMs - previous <= windowMs) continue;
      last.set(event.id, event.timestampMs);
      expected.push(event.timestampMs);
    }
    const random = await runIsolated(`
      function dedupe(events, windowMs) {
        const last = new Map();
        const kept = [];
        for (const event of events) {
          const previous = last.get(event.id);
          if (previous !== undefined && event.timestampMs - previous <= windowMs) continue;
          last.set(event.id, event.timestampMs);
          kept.push(event.timestampMs);
        }
        console.log(JSON.stringify(kept));
      }
      dedupe(${JSON.stringify(events)}, ${windowMs});
    `);
    assert.equal(random.status, "SUCCEEDED");
    assert.match(random.outputExcerpt, new RegExp(JSON.stringify(expected).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  it("judges a correct dedupe above a wrong one without eval in this process", async () => {
    const cases = dedupeCases();
    const good = await judgeIsolated(`
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
    `, "deduplicateEvents", cases.map((item) => item.args));
    assert.equal(good.status, "JUDGED");
    assert.equal(good.results.length, cases.length);
    assert.equal(good.results.every((row, index) => answersMatch(row.value, cases[index]?.expected)), true);
    const wrong = await judgeIsolated(`function deduplicateEvents(events) { return events; }`, "deduplicateEvents", cases.map((item) => item.args));
    assert.equal(wrong.status, "JUDGED");
    assert.equal(answersMatch(wrong.results[0]?.value, cases[0]?.expected), false);
    assert.equal(JSON.stringify(good).includes("HIDDEN_SENTINEL"), false);
  });
});
