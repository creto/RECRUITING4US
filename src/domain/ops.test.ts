import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { biLocalPlan, clampRunLimits, normalizeRuleDraft, sandboxSpec, textPlan } from "./ops.ts";

describe("assessment operations", () => {
  it("builds a node sandbox with network and filesystem denied", () => {
    const spec = sandboxSpec({ timeoutMs: 1000, maxOutputChars: 2000 });
    assert.equal("error" in spec, false);
    if ("error" in spec) return;
    assert.equal(spec.runtime, "node");
    assert.equal(spec.network, "denied");
    assert.equal(spec.filesystem, "denied");
    const rejected = sandboxSpec({ timeoutMs: 50, maxOutputChars: 2000 });
    assert.equal("error" in rejected, true);
  });

  it("keeps an invalid run limit on the built-in sample, not zero", () => {
    assert.deepEqual(clampRunLimits({ timeoutMs: 0, maxOutputChars: 9 }), { timeoutMs: 1500, maxOutputChars: 4000 });
  });

  it("stores a text instead of sending it, and refuses a missing phone", () => {
    const stored = textPlan("+1 (415) 555-0100", "Your assessment is ready.");
    assert.equal(stored.status, "CAPTURED");
    assert.match(stored.reason, /not sent/);
    const missing = textPlan("", "Your assessment is ready.");
    assert.equal(missing.status, "REFUSED");
  });

  it("keeps an analytics extract local until a destination exists", () => {
    assert.equal(biLocalPlan("", 3).status, "CAPTURED");
    assert.equal(biLocalPlan("https://analytics.example/hook", 3).status, "ATTEMPT");
    assert.equal(biLocalPlan("https://analytics.example/hook", 0).status, "REFUSED");
  });

  it("accepts a text workflow and rejects an unknown action", () => {
    const rule = normalizeRuleDraft({
      trigger: "ASSESSMENT_COMPLETED",
      conditions: [{ field: "score", op: "gte", value: "7000" }],
      actions: [{ type: "send_text", body: "Your result is ready for a person to read." }],
    });
    assert.equal("error" in rule, false);
    const bad = normalizeRuleDraft({
      trigger: "ASSESSMENT_COMPLETED",
      conditions: [],
      actions: [{ type: "hire_now" }],
    });
    assert.equal("error" in bad, true);
  });
});
