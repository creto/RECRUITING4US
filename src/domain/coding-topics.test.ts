import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { codingBankTagField, normalizeTopicTags, parseCodingBankSkills, tagsFromPrompt } from "./coding-topics.ts";

describe("coding topic tags", () => {
  it("normalizes aliases into canonical filter tags", () => {
    assert.deepEqual(normalizeTopicTags("arrays, dynamic programming, stack"), ["arrays", "dp", "stacks"]);
    assert.deepEqual(tagsFromPrompt("Topic: two pointers, hashing. Return indexes."), ["two-pointers", "hashing"]);
    assert.equal(codingBankTagField("easy", ["arrays", "hashing"]), "coding-bank:easy arrays hashing");
    assert.deepEqual(parseCodingBankSkills("coding-bank:medium stacks queues"), ["stacks", "queues"]);
  });
});
