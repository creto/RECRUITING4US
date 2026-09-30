import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CODING_LANGUAGE_IDS,
  allowedCodingLanguages,
  codingLanguage,
  entryNameFromPrompt,
  isCodingLanguageId,
  isStarterOrEmpty,
  languageRunnable,
  sampleRunBlockedReason,
  starterForLanguage,
} from "./coding-languages.ts";

describe("coding languages", () => {
  it("lists the common languages a candidate can pick", () => {
    for (const id of [
      "typescript",
      "javascript",
      "python",
      "java",
      "cpp",
      "go",
      "rust",
      "csharp",
      "ruby",
      "php",
      "kotlin",
      "swift",
    ]) {
      assert.equal(isCodingLanguageId(id), true);
      assert.ok(CODING_LANGUAGE_IDS.includes(id as (typeof CODING_LANGUAGE_IDS)[number]));
      assert.ok(starterForLanguage(id, "cratePair").includes("cratePair"));
    }
  });

  it("extracts the entry name from bank prompts", () => {
    assert.equal(
      entryNameFromPrompt("Write `cratePair(weights: number[], capacity: number): [number, number] | null`."),
      "cratePair",
    );
    assert.equal(entryNameFromPrompt("No signature here"), "solve");
  });

  it("treats blank and starter text as replaceable", () => {
    const starter = starterForLanguage("python", "solve");
    assert.equal(isStarterOrEmpty("", "python"), true);
    assert.equal(isStarterOrEmpty(starter, "python", "solve"), true);
    assert.equal(isStarterOrEmpty("def solve():\n  return 1\n", "python", "solve"), false);
  });

  it("only marks JS/TS as runnable for the Node sample sandbox", () => {
    assert.equal(languageRunnable("typescript"), true);
    assert.equal(languageRunnable("javascript"), true);
    assert.equal(languageRunnable("python"), false);
    assert.match(sampleRunBlockedReason("python") ?? "", /JavaScript\/TypeScript/);
    assert.equal(sampleRunBlockedReason("javascript"), null);
  });

  it("falls back to the full catalog when payload languages are empty", () => {
    assert.deepEqual(allowedCodingLanguages(["python", "go"]), ["python", "go"]);
    assert.equal(allowedCodingLanguages([]).length, CODING_LANGUAGE_IDS.length);
    assert.equal(allowedCodingLanguages(null).length, CODING_LANGUAGE_IDS.length);
    assert.equal(codingLanguage("nope").id, "typescript");
  });
});
