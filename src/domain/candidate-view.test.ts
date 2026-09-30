import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { answerComplete, candidateItem, examPayloadLeaksKey, orderedOptions } from "./candidate-view.ts";

describe("candidate exam payload", () => {
  it("drops the answer key even if the caller had it", () => {
    const item = candidateItem({
      id: "item-1",
      position: 0,
      points: 1,
      prompt: "What is 186 × 247? Enter the digits only.",
      type: "numeric",
      section: "Arithmetic",
      absTolerance: "0",
      relTolerance: "0",
      answer: { value: "12" },
      revision: 1,
    });
    const packed = {
      item,
      secretThatMustNotRideAlong: { expected: "45942", correct: ["a"], toward: "E", dimension: "mind", key_payload: { expected: "45942" } },
    };
    assert.equal(examPayloadLeaksKey(item), false);
    assert.equal(examPayloadLeaksKey(packed), true);
    assert.equal(JSON.stringify(item).includes("45942"), false);
    const stripped = candidateItem({
      id: "item-2",
      position: 1,
      points: 1,
      prompt: "Choose",
      type: "single",
      section: "Preferences",
      options: [{ id: "agree", label: "Agree" }],
      answer: { optionId: "agree", expected: "hidden" },
      revision: 0,
    });
    assert.equal(JSON.stringify(stripped.answer).includes("hidden"), false);
    assert.equal(stripped.answer?.optionId, "agree");
  });
});

describe("choice options", () => {
  it("keeps labels when the stored order is a json string that does not match", () => {
    const options = orderedOptions(
      JSON.stringify({
        options: [
          { id: "a", label: "Hide the button" },
          { id: "b", label: "Use an idempotency key" },
        ],
      }),
      "[\"x\"]",
    );
    assert.deepEqual(options.map((option) => option.id), ["a", "b"]);
  });

  it("follows a matching order and ignores scoring fields", () => {
    const options = orderedOptions(
      { options: [{ id: "b", label: "Second", weight: 2 }, { id: "a", label: "First" }], correct: ["b"] },
      ["a", "b"],
    );
    assert.deepEqual(options, [
      { id: "a", label: "First" },
      { id: "b", label: "Second" },
    ]);
    assert.equal(JSON.stringify(options).includes("correct"), false);
  });

  it("does not treat a blank response as answered", () => {
    assert.equal(answerComplete("single", null), false);
    assert.equal(answerComplete("single", { optionId: "b" }), true);
    assert.equal(answerComplete("multi", { optionIds: [] }), false);
    assert.equal(answerComplete("multi", { optionIds: ["a"] }), true);
    assert.equal(answerComplete("numeric", { value: "  " }), false);
    assert.equal(answerComplete("code", { text: "" }), false);
    assert.equal(answerComplete("text", { text: "A boundary check." }), true);
  });
});

describe("coding language on answers", () => {
  it("persists the chosen coding language with the source", () => {
    const item = candidateItem({
      id: "c1",
      position: 0,
      points: 2,
      prompt: "Write `cratePair()`.",
      type: "code",
      section: "Medium",
      answer: { text: "def cratePair(*args):\n    return None\n", language: "python" },
      revision: 1,
    });
    assert.equal(item.answer?.language, "python");
    assert.equal(answerComplete("code", item.answer), true);
  });
});
