import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProblemPrompt, splitInline } from "./problem-prompt.ts";

describe("problem prompt parser", () => {
  it("splits inline code spans", () => {
    const pieces = splitInline("Call `foo(1)` then stop.");
    assert.deepEqual(pieces, [
      { kind: "text", text: "Call " },
      { kind: "code", text: "foo(1)" },
      { kind: "text", text: " then stop." },
    ]);
  });

  it("extracts signature, example, and notes from a coding-bank prompt", () => {
    const prompt = `Crate pair

Write \`cratePair(weights: number[], capacity: number): [number, number] | null\`.

Return the indexes of two different crates whose weights add up to capacity.

Example
cratePair([4, 7, 1, 8, 3], 11) returns [1, 4] because 7 + 3 = 11.

Use any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. These prompts were written for this bank. They are not items from another site.`;
    const blocks = parseProblemPrompt(prompt);
    assert.equal(blocks[0]?.kind, "title");
    assert.equal(blocks[0] && blocks[0].kind === "title" ? blocks[0].text : "", "Crate pair");
    assert.equal(blocks.some((b) => b.kind === "signature"), true);
    assert.equal(blocks.some((b) => b.kind === "example"), true);
    assert.equal(blocks.some((b) => b.kind === "note"), true);
    const sig = blocks.find((b) => b.kind === "signature");
    assert.ok(sig && sig.kind === "signature" && sig.text.includes("cratePair"));
  });

  it("keeps fenced javascript for read-code prompts", () => {
    const prompt = `Running total 1

Read the JavaScript below. What does it print?

\`\`\`javascript
let total = 0;
for (let i = 1; i < 4; i++) {
  total += i;
}
console.log(total);
\`\`\`

These items are original for this bank. They are not taken from a proprietary question set.`;
    const blocks = parseProblemPrompt(prompt, { title: "Running total 1" });
    const code = blocks.find((b) => b.kind === "code");
    assert.ok(code && code.kind === "code");
    assert.equal(code.language, "javascript");
    assert.ok(code.code.includes("console.log(total)"));
    assert.equal(blocks.filter((b) => b.kind === "title").length, 1);
  });

  it("compacts long prompts for bank previews", () => {
    const prompt = `Title

Write \`fn(): number\`.

${"Long task. ".repeat(40)}

Example
fn() returns 1.

Use any supported programming language in the editor. These prompts were written for this bank.`;
    const blocks = parseProblemPrompt(prompt, { compact: true });
    assert.equal(blocks.some((b) => b.kind === "note"), false);
    assert.ok(blocks.some((b) => b.kind === "signature"));
  });
});
