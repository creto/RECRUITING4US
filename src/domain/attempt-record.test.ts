import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeSavedAnswer, responseResultLabel } from "./attempt-record.ts";

describe("saved assessment answers", () => {
  it("keeps a numeric answer unscored until submit, then scores it", () => {
    const saved = describeSavedAnswer({
      type: "numeric",
      points: 1,
      answer: { value: "80" },
      expected: "80",
      submitted: false,
    });
    assert.equal(saved.result, "saved");
    assert.equal(saved.earned, null);
    assert.match(responseResultLabel(saved), /Not scored until/);

    const scored = describeSavedAnswer({
      type: "numeric",
      points: 1,
      answer: { value: "80" },
      expected: "80",
      absTolerance: "0",
      relTolerance: "0",
      submitted: true,
    });
    assert.equal(scored.result, "correct");
    assert.equal(scored.earned, 1);
    assert.match(responseResultLabel(scored), /1 of 1/);
  });

  it("marks a wrong choice incorrect and leaves code pending", () => {
    const wrong = describeSavedAnswer({
      type: "single",
      points: 2,
      answer: { optionId: "a" },
      options: [{ id: "a", label: "Hide the button" }, { id: "b", label: "Use an idempotency key" }],
      correct: ["b"],
      submitted: true,
    });
    assert.equal(wrong.text, "Hide the button");
    assert.equal(wrong.result, "incorrect");
    assert.equal(wrong.earned, 0);

    const code = describeSavedAnswer({
      type: "code",
      points: 3,
      answer: { text: "function cratePair() { return null; }" },
      submitted: true,
    });
    assert.equal(code.result, "pending");
    assert.equal(code.earned, null);
    assert.match(responseResultLabel(code), /person still grades/);
  });

  it("treats a missing submitted objective answer as incorrect, not a hidden zero before submit", () => {
    const open = describeSavedAnswer({ type: "numeric", points: 1, answer: null, expected: "25", submitted: false });
    assert.equal(open.result, "blank");
    const closed = describeSavedAnswer({ type: "numeric", points: 1, answer: null, expected: "25", submitted: true });
    assert.equal(closed.result, "incorrect");
    assert.equal(closed.earned, 0);
  });
});
