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

  it("counts a related word only when strictness is broad", () => {
    const text = "I have years of programming experience and I shipped production software.";
    const broad = scoreExpertise({ text, readable: true, required: ["Python"], preferred: [], strictness: 0 });
    assert.equal(broad.lines.some((line) => line.includes("related word")), true);
    const exact = scoreExpertise({ text, readable: true, required: ["Python"], preferred: [], strictness: 100 });
    assert.equal(exact.lines.some((line) => line.includes("not found")), true);
    assert.equal(exact.score < broad.score, true);
  });
});
