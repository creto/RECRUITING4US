import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { READ_CODE_BANK, READ_CODE_TARGET } from "./read-code-bank.ts";

describe("read-code bank", () => {
  it("holds about five hundred original multiple-choice read items", () => {
    assert.equal(READ_CODE_BANK.length, READ_CODE_TARGET);
    const keys = new Set(READ_CODE_BANK.map((item) => item.key));
    const prompts = new Set(READ_CODE_BANK.map((item) => item.prompt));
    assert.equal(keys.size, READ_CODE_TARGET);
    assert.equal(prompts.size, READ_CODE_TARGET);
    for (const item of READ_CODE_BANK) {
      assert.equal(item.options.length, 4);
      assert.ok(item.options.some((option) => option.id === item.correct));
      assert.equal(new Set(item.options.map((option) => option.label)).size, 4);
      assert.equal(item.prompt.toLowerCase().includes("leetcode"), false);
      assert.equal(item.prompt.toLowerCase().includes("hackerrank"), false);
      assert.ok(item.prompt.includes("```javascript"));
      assert.ok(["easy", "medium", "hard"].includes(item.difficulty));
    }
    assert.ok(READ_CODE_BANK.filter((item) => item.difficulty === "easy").length >= 100);
    assert.ok(READ_CODE_BANK.filter((item) => item.difficulty === "medium").length >= 100);
    assert.ok(READ_CODE_BANK.filter((item) => item.difficulty === "hard").length >= 100);
  });
});
