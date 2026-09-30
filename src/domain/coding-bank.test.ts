import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODING_BANK } from "./coding-bank.ts";
import { CODING_SKILL_TAGS } from "./coding-topics.ts";

describe("coding bank", () => {
  it("holds 2500 original write-code prompts with skill tags", () => {
    assert.equal(CODING_BANK.length, 2500);
    const keys = new Set(CODING_BANK.map((item) => item.key));
    assert.equal(keys.size, 2500);
    assert.ok(CODING_BANK.filter((item) => item.difficulty === "easy").length > 100);
    assert.ok(CODING_BANK.filter((item) => item.difficulty === "medium").length > 100);
    assert.ok(CODING_BANK.filter((item) => item.difficulty === "hard").length > 20);
    const allowed = new Set<string>(CODING_SKILL_TAGS);
    for (const item of CODING_BANK) {
      const prompt = item.prompt.toLowerCase();
      assert.equal(prompt.includes("leetcode"), false);
      assert.equal(prompt.includes("hackerrank"), false);
      assert.ok(item.prompt.includes(item.title));
      assert.ok(item.prompt.includes("\nExample\n") || item.prompt.includes("Example\n"));
      assert.ok(item.prompt.includes("These prompts were written for this bank."));
      assert.ok(item.prompt.length > 80);
      assert.ok(Array.isArray(item.tags) && item.tags.length > 0);
      for (const tag of item.tags) assert.ok(allowed.has(tag), tag);
    }
  });
});
