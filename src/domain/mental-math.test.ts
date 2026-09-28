import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MENTAL_MATH, MENTAL_MATH_SECONDS } from "./mental-math.ts";

describe("mental math paper", () => {
  it("has 20 original exact problems and a 15 minute limit", () => {
    assert.equal(MENTAL_MATH.length, 20);
    assert.equal(MENTAL_MATH_SECONDS, 900);
    const keys = new Set(MENTAL_MATH.map((item) => item.key));
    assert.equal(keys.size, 20);
    for (const item of MENTAL_MATH) {
      assert.match(item.expected, /^\d+$/);
      assert.equal(item.prompt.includes(item.expected), false);
    }
    assert.equal(MENTAL_MATH.some((item) => item.prompt.includes("×")), true);
    assert.equal(JSON.stringify(MENTAL_MATH).toLowerCase().includes("optiver"), false);
  });
});
