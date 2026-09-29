import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODING_BANK } from "./coding-bank.ts";

describe("coding bank", () => {
  it("holds 500 original write-code prompts", () => {
    assert.equal(CODING_BANK.length, 500);
    assert.equal(CODING_BANK.filter((item) => item.difficulty === "easy").length, 146);
    assert.equal(CODING_BANK.filter((item) => item.difficulty === "medium").length, 251);
    assert.equal(CODING_BANK.filter((item) => item.difficulty === "hard").length, 103);
    const keys = new Set(CODING_BANK.map((item) => item.key));
    const titles = new Set(CODING_BANK.map((item) => item.title));
    assert.equal(keys.size, 500);
    assert.equal(titles.size, 500);
    for (const item of CODING_BANK) {
      const prompt = item.prompt.toLowerCase();
      assert.equal(prompt.includes("leetcode"), false);
      assert.equal(prompt.includes("hackerrank"), false);
      assert.ok(item.prompt.includes(item.title));
      assert.ok(item.prompt.includes("\nExample\n") || item.prompt.includes("Example\n"));
      assert.ok(item.prompt.includes("These prompts were written for this bank."));
      assert.ok(item.prompt.length > 80);
    }
  });
});
