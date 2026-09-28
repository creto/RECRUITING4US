import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreExpertise } from "./expertise.ts";

describe("expertise score", () => {
  it("counts must-have skills, a written year, and phrases, and leaves an unread CV out", () => {
    const scored = scoreExpertise({
      text: "I shipped production services in TypeScript for six years. I design SQL.",
      readable: true,
      required: ["TypeScript", "SQL"],
      preferred: ["React"],
    });
    assert.equal(scored.ranked, true);
    assert.equal(scored.score, 25 + 25 + 24 + 8 + 8);
    assert.equal(scored.lines.some((line) => line.includes("six") || line.includes("6 years")), true);

    const unread = scoreExpertise({ text: null, readable: false, required: ["SQL"], preferred: [] });
    assert.equal(unread.ranked, false);
    assert.equal(unread.score, 0);
  });
});
