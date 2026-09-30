import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PERSONALITY_ITEMS, scorePersonality } from "./personality.ts";

describe("work style questionnaire", () => {
  it("has 125 original statements, twenty-five on each scale", () => {
    assert.equal(PERSONALITY_ITEMS.length, 125);
    const counts = new Map<string, number>();
    for (const item of PERSONALITY_ITEMS) counts.set(item.dimension, (counts.get(item.dimension) ?? 0) + 1);
    assert.deepEqual([...counts.values()], [25, 25, 25, 25, 25]);
    const keys = new Set(PERSONALITY_ITEMS.map((item) => item.key));
    assert.equal(keys.size, 125);
    const text = PERSONALITY_ITEMS.map((item) => item.prompt).join(" ").toLowerCase();
    assert.equal(text.includes("16personalities"), false);
    assert.equal(text.includes("myers"), false);
  });

  it("keeps the same scoring algorithm: full agree still yields ESTJ-A", () => {
    const agreed = scorePersonality(PERSONALITY_ITEMS.map((item) => ({ ...item, optionId: "agree" })));
    assert.equal(agreed.code, "ESTJ-A");
    assert.equal(agreed.letters, "ESTJ");
    assert.equal(agreed.identity, "Assertive");
    assert.match(agreed.title, /^ESTJ\./);
    assert.equal(agreed.group, "Known method and a closed plan");
    assert.equal(agreed.answered, 125);
    assert.match(agreed.note, /not the 16Personalities/);
    assert.match(agreed.note, /not a hiring decision/);

    const empty = scorePersonality(PERSONALITY_ITEMS.map((item) => ({ ...item, optionId: null })));
    assert.equal(empty.code, null);
    assert.equal(empty.answered, 0);
    assert.match(empty.title, /No type/);
  });

  it("leaves a scale tied instead of choosing a letter", () => {
    const tied = scorePersonality(PERSONALITY_ITEMS.map((item) => ({ ...item, optionId: "middle" })));
    assert.equal(tied.code, null);
    assert.equal(tied.scales.every((scale) => scale.letter === null), true);
  });

  it("does not change scorePersonality polarity rules when mapping toward letters", () => {
    const onlyMind = scorePersonality([
      { dimension: "mind", toward: "E", optionId: "agree" },
      { dimension: "mind", toward: "I", optionId: "disagree" },
    ]);
    assert.equal(onlyMind.scales.find((scale) => scale.name === "mind")?.letter, "E");
  });
});
