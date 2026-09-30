import { inflateSync } from "node:zlib";

export type CvFit = "GOOD" | "NOT_A_FIT" | "NEEDS_A_PERSON";
export type CvAction = "SEND" | "DO_NOT_SEND";
export type CvScanState = "CLEAN" | "QUARANTINE" | "INFECTED" | "MISSING";

export type CvScreen = {
  fit: CvFit;
  action: CvAction;
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  reasons: string[];
};

/** Comma or newline list. Short tokens are dropped so a one-letter term cannot match by accident. */
export function parseTerms(value: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const part of value.split(/[,;\n]/)) {
    const term = part.trim().replace(/\s+/g, " ");
    if (term.length < 2 || term.length > 40) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
    if (terms.length === 12) break;
  }
  return terms;
}

export function termsFromJson(value: unknown): string[] {
  if (Array.isArray(value)) return parseTerms(value.map(String).join(", "));
  if (typeof value === "string") {
    try {
      return termsFromJson(JSON.parse(value));
    } catch {
      return parseTerms(value);
    }
  }
  return [];
}

export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      return stringList(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

export function termPresent(haystack: string, term: string): boolean {
  const needle = term.trim().toLowerCase().replace(/\s+/g, " ");
  if (needle.length < 2) return false;
  const flat = haystack.toLowerCase().replace(/\s+/g, " ");
  if (needle.includes(" ")) return flat.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(flat);
}

const CLOSE: Record<string, string[]> = {
  python: ["py"],
  py: ["python"],
  javascript: ["js"],
  js: ["javascript"],
  typescript: ["ts"],
  ts: ["typescript"],
  postgresql: ["postgres"],
  postgres: ["postgresql"],
  nodejs: ["node"],
  node: ["nodejs"],
  reactjs: ["react"],
};

const BROAD: string[][] = [
  ["python", "py", "programming", "programar", "programacion", "coding", "software", "developer", "desarrollo", "programmer"],
  ["javascript", "js", "typescript", "ts", "node", "nodejs", "react", "frontend", "programming", "programar", "coding", "software", "developer"],
  ["java", "jvm", "spring"],
  ["sql", "database", "databases", "postgresql", "postgres", "mysql"],
  ["excel", "spreadsheet", "spreadsheets"],
  ["communication", "comunicacion"],
  ["leadership", "liderazgo", "management"],
];

export function clampStrictness(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function foldedPresent(haystack: string, term: string): boolean {
  return termPresent(fold(haystack), fold(term));
}

/** exact = the word itself. alias = a close form. related = a broader family, only when the job is set broad. */
export function skillHit(haystack: string, term: string, strictness?: number): "exact" | "alias" | "related" | "miss" {
  if (termPresent(haystack, term) || foldedPresent(haystack, term)) return "exact";
  const level = clampStrictness(strictness);
  const key = fold(term);
  if (level < 75) {
    const aliases = CLOSE[key] ?? [];
    if (aliases.some((alt) => foldedPresent(haystack, alt))) return "alias";
  }
  if (level < 40) {
    const group = BROAD.find((row) => row.some((item) => fold(item) === key));
    if (group?.some((alt) => fold(alt) !== key && foldedPresent(haystack, alt))) return "related";
  }
  return "miss";
}

export function screenResume(input: {
  text: string | null;
  readable: boolean;
  scanState: CvScanState;
  required: string[];
  preferred: string[];
  hasAssessment: boolean;
  strictness?: number;
}): CvScreen {
  const required = input.required.map((term) => term.trim()).filter((term) => term.length >= 2);
  const preferred = input.preferred.map((term) => term.trim()).filter((term) => term.length >= 2);
  if (input.scanState === "MISSING") {
    return blank("NEEDS_A_PERSON", ["No CV was uploaded, so no assessment was sent."]);
  }
  if (input.scanState !== "CLEAN") {
    return blank("NEEDS_A_PERSON", ["The CV did not pass the file check, so it was not read and no assessment was sent."]);
  }
  if (!input.readable || !input.text?.trim()) {
    return blank("NEEDS_A_PERSON", ["The CV text could not be read, so no assessment was sent."]);
  }
  if (required.length === 0) {
    return blank("NEEDS_A_PERSON", ["This job has no must-have skills, so the screen will not send an assessment."]);
  }
  const text = input.text;
  const requiredHits = required.map((term) => ({ term, how: skillHit(text, term, input.strictness) }));
  const preferredHits = preferred.map((term) => ({ term, how: skillHit(text, term, input.strictness) }));
  const matchedRequired = requiredHits.filter((hit) => hit.how !== "miss").map((hit) => hit.term);
  const missingRequired = requiredHits.filter((hit) => hit.how === "miss").map((hit) => hit.term);
  const matchedPreferred = preferredHits.filter((hit) => hit.how !== "miss").map((hit) => hit.term);
  const missedPreferred = preferredHits.filter((hit) => hit.how === "miss").map((hit) => hit.term);
  const reasons = [
    "The screen looks for the job’s must-have words. It does not score schools, photos, age, or names.",
  ];
  for (const hit of requiredHits) {
    if (hit.how === "related") reasons.push(`“${hit.term}” was not written. A related word counted because this job is set broad.`);
    if (hit.how === "alias") reasons.push(`“${hit.term}” was counted from a close form of the word.`);
  }
  if (missedPreferred.length) reasons.push(`Preferred skills not found: ${missedPreferred.join(", ")}. They do not decide.`);
  if (missingRequired.length) {
    reasons.push(`Missing must-have skills: ${missingRequired.join(", ")}. No assessment was sent.`);
    return { fit: "NOT_A_FIT", action: "DO_NOT_SEND", matchedRequired, missingRequired, matchedPreferred, reasons };
  }
  if (!input.hasAssessment) {
    reasons.push("Every must-have skill was found, but this job has no assessment selected, so nothing was sent.");
    return { fit: "GOOD", action: "DO_NOT_SEND", matchedRequired, missingRequired, matchedPreferred, reasons };
  }
  reasons.push("Every must-have skill was found. The assessment will be sent.");
  return { fit: "GOOD", action: "SEND", matchedRequired, missingRequired, matchedPreferred, reasons };
}

function blank(fit: CvFit, reasons: string[]): CvScreen {
  return {
    fit,
    action: "DO_NOT_SEND",
    matchedRequired: [],
    missingRequired: [],
    matchedPreferred: [],
    reasons,
  };
}

export function extractResumeText(mime: string, bytes: Uint8Array): { text: string; readable: boolean; note: string } {
  if (mime === "text/plain" || mime === "text/csv" || mime === "application/vnd.ms-excel") {
    return finishText(new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\0/g, ""), "Read as plain text.");
  }
  if (mime === "application/pdf") {
    const text = pdfLiterals(bytes);
    if (text.trim().length < 40) {
      return {
        text: "",
        readable: false,
        note: "This PDF has no extractable text. A scanned image is not read, and no assessment was sent.",
      };
    }
    return finishText(text, "Text was taken from the PDF. Layout and images were ignored.");
  }
  if (mime === "image/png" || mime === "image/jpeg") {
    return { text: "", readable: false, note: "This file is an image. The screen cannot read it, so no assessment was sent." };
  }
  return { text: "", readable: false, note: "This file type cannot be read, so no assessment was sent." };
}

function finishText(text: string, note: string): { text: string; readable: boolean; note: string } {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 40) {
    return { text: clean, readable: false, note: "The CV does not contain enough readable text, so no assessment was sent." };
  }
  return { text: clean.slice(0, 20_000), readable: true, note };
}

function pdfLiterals(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  const chunks = [raw];
  const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
  for (let match = streamRe.exec(raw); match; match = streamRe.exec(raw)) {
    const dict = raw.slice(Math.max(0, match.index - 240), match.index);
    if (!dict.includes("/FlateDecode")) continue;
    try {
      chunks.push(inflateSync(Buffer.from(match[1] ?? "", "latin1")).toString("latin1"));
    } catch {
      // A stream that is not deflate is ignored. The rest of the file can still match.
    }
  }
  const found: string[] = [];
  for (const chunk of chunks) {
    const literal = /\(((?:\\.|[^\\)]){2,})\)/g;
    for (let match = literal.exec(chunk); match; match = literal.exec(chunk)) {
      const decoded = (match[1] ?? "")
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (/[A-Za-z]{3,}/.test(decoded)) found.push(decoded);
    }
  }
  return found.join(" ");
}
