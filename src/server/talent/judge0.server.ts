/**
 * Remote sample-run engine via Judge0 CE (default https://ce.judge0.com).
 * Optional JUDGE0_URL / JUDGE0_AUTH_TOKEN override for self-host or RapidAPI/Sulu.
 * Used when the local Node jail cannot run the language (or is unavailable on Vercel).
 */
import { env } from "@/lib/env.server";
import { clampRunLimits } from "../../domain/ops.ts";
import { codingLanguage, type CodingLanguageId } from "../../domain/coding-languages.ts";

type IsolatedRun = {
  available: boolean;
  status: "SUCCEEDED" | "TIMED_OUT" | "FAILED" | "REFUSED";
  reason: string;
  outputExcerpt: string;
  timedOut: boolean;
  truncated: boolean;
};

const MAX_SOURCE = 20_000;

/** Prefer recent CE runtimes that cover all 12 candidate languages. */
export const JUDGE0_LANGUAGE_IDS: Record<CodingLanguageId, number> = {
  typescript: 101, // TypeScript 5.6.2
  javascript: 102, // Node.js 22.08.0
  python: 109, // Python 3.13.2
  java: 91, // JDK 17.0.6
  cpp: 105, // C++ GCC 14.1.0
  go: 107, // Go 1.23.5
  rust: 108, // Rust 1.85.0
  csharp: 51, // C# Mono 6.6
  ruby: 72, // Ruby 2.7.0
  php: 98, // PHP 8.3.11
  kotlin: 111, // Kotlin 2.1.10
  swift: 83, // Swift 5.2.3
};

type Judge0Status = { id: number; description: string };

type Judge0Submission = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: Judge0Status;
  token?: string;
  error?: string;
};

function judge0Base(): string {
  return (env("JUDGE0_URL") ?? "https://ce.judge0.com").replace(/\/$/, "");
}

function judge0Headers(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const token = env("JUDGE0_AUTH_TOKEN");
  if (token) {
    headers["X-Auth-Token"] = token;
    // RapidAPI / Sulu style keys also appear as X-RapidAPI-Key
    headers["X-RapidAPI-Key"] = token;
  }
  return headers;
}

function b64encode(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

function b64decode(text: string | null | undefined): string {
  if (!text) return "";
  try {
    return Buffer.from(text, "base64").toString("utf8");
  } catch {
    return text;
  }
}

/** Ensure compiled / package-main languages can execute a function-only starter. */
export function wrapSampleSource(languageId: CodingLanguageId, source: string): string {
  const code = source.trimEnd();
  switch (languageId) {
    case "java":
      if (/\bpublic\s+static\s+void\s+main\s*\(/.test(code) || /\bclass\s+Main\b/.test(code)) return code;
      return `${code}\n\npublic class Main {\n  public static void main(String[] args) {\n    // Sample run entry — not a score.\n  }\n}\n`;
    case "csharp":
      if (/\bstatic\s+void\s+Main\s*\(/.test(code)) return code;
      return `${code}\n\nclass Program {\n  static void Main() {\n    // Sample run entry — not a score.\n  }\n}\n`;
    case "kotlin":
      if (/\bfun\s+main\s*\(/.test(code)) return code;
      return `${code}\n\nfun main() {\n  // Sample run entry — not a score.\n}\n`;
    case "go":
      if (/\bfunc\s+main\s*\(/.test(code)) return code;
      return `${code}\n\nfunc main() {}\n`;
    case "rust":
      if (/\bfn\s+main\s*\(/.test(code)) return code;
      return `${code}\n\nfn main() {}\n`;
    case "cpp":
      if (/\bint\s+main\s*\(/.test(code)) return code;
      return `${code}\n\nint main() { return 0; }\n`;
    default:
      return code;
  }
}

function mapStatus(status: Judge0Status | undefined, timedOutHttp: boolean): IsolatedRun["status"] {
  if (timedOutHttp) return "TIMED_OUT";
  const id = status?.id ?? 0;
  // 3 Accepted
  if (id === 3) return "SUCCEEDED";
  // 5 Time Limit Exceeded
  if (id === 5) return "TIMED_OUT";
  // 1 In Queue, 2 Processing — treat as infra if wait returned early
  if (id === 1 || id === 2) return "REFUSED";
  // 6 compile error, 7–14 various runtime/wrong — sample run failed
  if (id >= 6) return "FAILED";
  return "FAILED";
}

function reasonFor(status: IsolatedRun["status"], label: string, judgeDesc: string): string {
  if (status === "SUCCEEDED") {
    return `Sample run succeeded (${label} via Judge0). This output is not a score.`;
  }
  if (status === "TIMED_OUT") {
    return `Sample run timed out (${label} via Judge0). No score was given.`;
  }
  if (status === "REFUSED") {
    return `Sample run could not start (${label} via Judge0${judgeDesc ? `: ${judgeDesc}` : ""}). The source was not scored.`;
  }
  return `Sample run failed (${label} via Judge0${judgeDesc ? `: ${judgeDesc}` : ""}). This is not a score.`;
}

export async function runViaJudge0(
  source: string,
  languageRaw: string,
  requested?: { timeoutMs?: number; maxOutputChars?: number },
): Promise<IsolatedRun & { engine: "judge0"; language: CodingLanguageId }> {
  const limits = clampRunLimits(requested);
  const meta = codingLanguage(languageRaw);
  const language = meta.id;
  const program = wrapSampleSource(language, source.slice(0, MAX_SOURCE));
  if (!program.trim()) {
    return {
      available: false,
      status: "REFUSED",
      reason: "There is no source to run.",
      outputExcerpt: "",
      timedOut: false,
      truncated: false,
      engine: "judge0",
      language,
    };
  }

  const languageId = JUDGE0_LANGUAGE_IDS[language];
  const cpuSeconds = Math.max(1, Math.min(5, Math.ceil(limits.timeoutMs / 1000)));
  const wallSeconds = cpuSeconds + 5;
  // Serverless wait budget: compile + run; keep under typical Vercel limits.
  const httpTimeoutMs = Math.min(55_000, Math.max(12_000, limits.timeoutMs + 15_000));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), httpTimeoutMs);
  let body: Judge0Submission;
  try {
    const response = await fetch(`${judge0Base()}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: judge0Headers(),
      signal: controller.signal,
      body: JSON.stringify({
        source_code: b64encode(program),
        language_id: languageId,
        cpu_time_limit: cpuSeconds,
        wall_time_limit: wallSeconds,
        // Keep memory modest for free CE
        memory_limit: 128000,
      }),
    });
    const text = await response.text();
    try {
      body = JSON.parse(text) as Judge0Submission;
    } catch {
      return {
        available: true,
        status: "REFUSED",
        reason: `Judge0 returned a non-JSON response (${response.status}). The source was not scored.`,
        outputExcerpt: text.slice(0, limits.maxOutputChars),
        timedOut: false,
        truncated: false,
        engine: "judge0",
        language,
      };
    }
    if (!response.ok && !body.status) {
      return {
        available: true,
        status: "REFUSED",
        reason: `Judge0 refused the run (${response.status}${body.error ? `: ${body.error}` : ""}). The source was not scored.`,
        outputExcerpt: "",
        timedOut: false,
        truncated: false,
        engine: "judge0",
        language,
      };
    }
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      available: true,
      status: aborted ? "TIMED_OUT" : "REFUSED",
      reason: aborted
        ? `Sample run timed out waiting for Judge0 (${meta.label}). No score was given.`
        : `Judge0 could not be reached (${meta.label}). The source was not scored.`,
      outputExcerpt: "",
      timedOut: aborted,
      truncated: false,
      engine: "judge0",
      language,
    };
  } finally {
    clearTimeout(timer);
  }

  const stdout = b64decode(body.stdout);
  const stderr = b64decode(body.stderr);
  const compile = b64decode(body.compile_output);
  const message = body.message ?? "";
  const combined = [stdout, stderr, compile, message].filter(Boolean).join("\n");
  const truncated = combined.length > limits.maxOutputChars;
  const excerpt = combined.slice(0, limits.maxOutputChars);
  const status = mapStatus(body.status, false);
  const desc = body.status?.description ?? "";

  return {
    available: true,
    status,
    reason: reasonFor(status, meta.label, desc),
    outputExcerpt: excerpt,
    timedOut: status === "TIMED_OUT",
    truncated,
    engine: "judge0",
    language,
  };
}

export function judge0ConfiguredNote(): string {
  const custom = Boolean(env("JUDGE0_URL"));
  return custom
    ? "Sample runs use the configured Judge0 endpoint for every language."
    : "Sample runs use the free Judge0 CE endpoint (ce.judge0.com) for every language. JS/TS also use the local Node jail when available.";
}
