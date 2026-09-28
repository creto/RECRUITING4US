import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODING_BANK } from "./coding-bank.ts";

describe("coding bank", () => {
  it("holds 25 medium and 25 hard original prompts", () => {
    assert.equal(CODING_BANK.length, 50);
    assert.equal(CODING_BANK.filter((item) => item.difficulty === "medium").length, 25);
    assert.equal(CODING_BANK.filter((item) => item.difficulty === "hard").length, 25);
    const keys = new Set(CODING_BANK.map((item) => item.key));
    const titles = new Set(CODING_BANK.map((item) => item.title));
    assert.equal(keys.size, 50);
    assert.equal(titles.size, 50);
    for (const item of CODING_BANK) {
      assert.equal(item.prompt.toLowerCase().includes("leetcode"), false);
      assert.ok(item.prompt.includes(item.title));
      assert.ok(item.prompt.length > 80);
    }
  });
});
