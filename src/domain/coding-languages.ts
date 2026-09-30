/** Candidate coding languages for write-code assessments. */

export type CodingLanguageId =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "csharp"
  | "ruby"
  | "php"
  | "kotlin"
  | "swift";

export type CodingLanguage = {
  id: CodingLanguageId;
  label: string;
  /** Editor / file tab label */
  filename: string;
  /** Monaco / fence language tag */
  monaco: string;
  /** Sample run can execute this language (Node jail and/or Judge0). */
  runnable: boolean;
};

export const CODING_LANGUAGES: readonly CodingLanguage[] = [
  { id: "typescript", label: "TypeScript", filename: "solution.ts", monaco: "typescript", runnable: true },
  { id: "javascript", label: "JavaScript", filename: "solution.js", monaco: "javascript", runnable: true },
  { id: "python", label: "Python", filename: "solution.py", monaco: "python", runnable: true },
  { id: "java", label: "Java", filename: "Solution.java", monaco: "java", runnable: true },
  { id: "cpp", label: "C++", filename: "solution.cpp", monaco: "cpp", runnable: true },
  { id: "go", label: "Go", filename: "solution.go", monaco: "go", runnable: true },
  { id: "rust", label: "Rust", filename: "solution.rs", monaco: "rust", runnable: true },
  { id: "csharp", label: "C#", filename: "Solution.cs", monaco: "csharp", runnable: true },
  { id: "ruby", label: "Ruby", filename: "solution.rb", monaco: "ruby", runnable: true },
  { id: "php", label: "PHP", filename: "solution.php", monaco: "php", runnable: true },
  { id: "kotlin", label: "Kotlin", filename: "Solution.kt", monaco: "kotlin", runnable: true },
  { id: "swift", label: "Swift", filename: "solution.swift", monaco: "swift", runnable: true },
] as const;

export const CODING_LANGUAGE_IDS: readonly CodingLanguageId[] = CODING_LANGUAGES.map((row) => row.id);

export const DEFAULT_CODING_LANGUAGE: CodingLanguageId = "typescript";

const BY_ID = new Map(CODING_LANGUAGES.map((row) => [row.id, row]));

export function codingLanguage(id: string | null | undefined): CodingLanguage {
  if (id && BY_ID.has(id as CodingLanguageId)) return BY_ID.get(id as CodingLanguageId)!;
  return BY_ID.get(DEFAULT_CODING_LANGUAGE)!;
}

export function isCodingLanguageId(value: unknown): value is CodingLanguageId {
  return typeof value === "string" && BY_ID.has(value as CodingLanguageId);
}

/** Normalize employer payload languages; empty/unknown → full catalog. */
export function allowedCodingLanguages(raw: unknown): CodingLanguageId[] {
  const list = Array.isArray(raw)
    ? raw.filter((id): id is CodingLanguageId => isCodingLanguageId(id))
    : [];
  return list.length ? list : [...CODING_LANGUAGE_IDS];
}

/** Pull the entry function name from a bank-style "Write `name(...)`" prompt. */
export function entryNameFromPrompt(prompt: string): string {
  const match =
    /Write\s+`([A-Za-z_][\w]*)\s*\(/.exec(prompt) ??
    /Write\s+([A-Za-z_][\w]*)\s*\(/.exec(prompt) ??
    /\bfunction\s+([A-Za-z_][\w]*)\s*\(/.exec(prompt);
  return match?.[1] ?? "solve";
}

export function starterForLanguage(languageId: string, entry = "solve"): string {
  const name = /^[A-Za-z_][\w]*$/.test(entry) ? entry : "solve";
  switch (codingLanguage(languageId).id) {
    case "typescript":
      return `function ${name}(/* args */): unknown {\n  // Write your solution\n  return null;\n}\n`;
    case "javascript":
      return `function ${name}(/* args */) {\n  // Write your solution\n  return null;\n}\n`;
    case "python":
      return `def ${name}(*args):\n    # Write your solution\n    return None\n`;
    case "java":
      return `class Solution {\n  public Object ${name}(/* args */) {\n    // Write your solution\n    return null;\n  }\n}\n`;
    case "cpp":
      return `#include <bits/stdc++.h>\nusing namespace std;\n\nauto ${name}(/* args */) {\n  // Write your solution\n  return 0;\n}\n`;
    case "go":
      return `package main\n\nfunc ${name}(/* args */) interface{} {\n\t// Write your solution\n\treturn nil\n}\n`;
    case "rust":
      return `fn ${name}(/* args */) {\n    // Write your solution\n}\n`;
    case "csharp":
      return `public class Solution {\n  public object ${name}(/* args */) {\n    // Write your solution\n    return null;\n  }\n}\n`;
    case "ruby":
      return `def ${name}(*args)\n  # Write your solution\n  nil\nend\n`;
    case "php":
      return `<?php\nfunction ${name}(/* args */) {\n  // Write your solution\n  return null;\n}\n`;
    case "kotlin":
      return `class Solution {\n  fun ${name}(/* args */): Any? {\n    // Write your solution\n    return null\n  }\n}\n`;
    case "swift":
      return `func ${name}(/* args */) -> Any? {\n  // Write your solution\n  return nil\n}\n`;
  }
}

/** True when the editor still holds the boilerplate (or is blank). Safe to replace without confirm. */
export function isStarterOrEmpty(text: string | null | undefined, languageId: string, entry = "solve"): boolean {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return true;
  return trimmed === starterForLanguage(languageId, entry).trim();
}

export function languageRunnable(languageId: string | null | undefined): boolean {
  return codingLanguage(languageId).runnable;
}

export function sampleRunBlockedReason(languageId: string | null | undefined): string | null {
  // All catalog languages execute via Node jail (JS/TS) or Judge0 CE.
  if (languageRunnable(languageId)) return null;
  const lang = codingLanguage(languageId);
  return `${lang.label} is not in the sample-run catalog.`;
}
