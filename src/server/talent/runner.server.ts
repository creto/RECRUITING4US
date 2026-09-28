import { spawn } from "node:child_process";
import { limitRunOutput } from "../../domain/edge.ts";

const MAX_SOURCE = 20_000;
const MAX_OUTPUT = 4_000;
const TIMEOUT_MS = 1500;

const HARNESS = `
let source = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { source += chunk; });
process.stdin.on("end", () => {
  try {
    eval(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The program failed.";
    console.error(message.slice(0, 500));
    process.exit(1);
  }
});
`;

export type IsolatedRun = {
  available: boolean;
  status: "SUCCEEDED" | "TIMED_OUT" | "FAILED" | "REFUSED";
  reason: string;
  outputExcerpt: string;
  timedOut: boolean;
  truncated: boolean;
};

/** Run candidate source in a separate process. The parent never evals it. No score is produced. */
export function runIsolated(source: string): Promise<IsolatedRun> {
  const program = source.slice(0, MAX_SOURCE);
  if (!program.trim()) {
    return Promise.resolve({
      available: false,
      status: "REFUSED",
      reason: "There is no source to run.",
      outputExcerpt: "",
      timedOut: false,
      truncated: false,
    });
  }
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--permission", "-e", HARNESS], {
      env: { PATH: process.env.PATH ?? "" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (timedOut: boolean, code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const limited = limitRunOutput({ stdout, stderr, timedOut, maxChars: MAX_OUTPUT });
      const excerpt = [limited.stdout, limited.stderr].filter(Boolean).join("\n").slice(0, MAX_OUTPUT);
      if (timedOut) {
        resolve({
          available: true,
          status: "TIMED_OUT",
          reason: "The run was stopped because it exceeded the time limit. No score was given.",
          outputExcerpt: excerpt,
          timedOut: true,
          truncated: limited.truncated,
        });
        return;
      }
      resolve({
        available: true,
        status: code === 0 ? "SUCCEEDED" : "FAILED",
        reason: code === 0
          ? "The process finished. This output is not a score."
          : "The process exited with an error. This is not a score.",
        outputExcerpt: excerpt,
        timedOut: false,
        truncated: limited.truncated,
      });
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(true, null);
    }, TIMEOUT_MS);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      if (stdout.length < MAX_OUTPUT * 2) stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      if (stderr.length < MAX_OUTPUT * 2) stderr += chunk;
    });
    child.on("error", () => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({
        available: false,
        status: "REFUSED",
        reason: "The isolated process could not be started. The source was not executed in the application process.",
        outputExcerpt: "",
        timedOut: false,
        truncated: false,
      });
    });
    child.on("close", (code) => finish(false, code));
    child.stdin.end(program);
  });
}

const JUDGE_HARNESS = `
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  const send = (payload) => {
    process.stdout.write(JSON.stringify(payload));
  };
  let input;
  try {
    input = JSON.parse(raw);
  } catch (error) {
    send({ ok: false, error: "The judge input was not JSON." });
    return;
  }
  const entry = typeof input.entry === "string" ? input.entry : "";
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry)) {
    send({ ok: false, error: "The entry function name is not usable." });
    return;
  }
  const cases = Array.isArray(input.cases) ? input.cases.slice(0, 8) : [];
  let fn = null;
  try {
    const load = new Function("src", "name", "eval(src); try { const found = eval(name); if (typeof found === 'function') return found; } catch (e) {} return typeof globalThis[name] === 'function' ? globalThis[name] : null;");
    fn = load(String(input.source ?? ""), entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The source did not load.";
    send({ ok: false, error: message.slice(0, 300) });
    return;
  }
  if (typeof fn !== "function") {
    send({ ok: false, error: "The entry function was not found." });
    return;
  }
  const results = [];
  for (const args of cases) {
    const started = process.hrtime.bigint();
    try {
      const value = fn(...(Array.isArray(args) ? args : []));
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      results.push({ ms, value });
    } catch (error) {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      const message = error instanceof Error ? error.message : "The case threw.";
      results.push({ ms, error: message.slice(0, 300) });
    }
  }
  send({ ok: true, results });
});
`;

export type JudgeCaseResult = { ms: number | null; value?: unknown; error?: string };

export type JudgeRun = {
  status: "JUDGED" | "TIMED_OUT" | "FAILED" | "REFUSED";
  results: JudgeCaseResult[];
  error: string;
};

/** Run cases in a separate process. The parent does not eval the source and does not send expected answers. */
export function judgeIsolated(
  source: string,
  entry: string,
  cases: readonly unknown[][],
): Promise<JudgeRun> {
  const program = source.slice(0, MAX_SOURCE);
  if (!program.trim() || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry)) {
    return Promise.resolve({
      status: "REFUSED",
      results: [],
      error: "There is no function to judge.",
    });
  }
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--permission", "-e", JUDGE_HARNESS], {
      env: { PATH: process.env.PATH ?? "" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let settled = false;
    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (timedOut) {
        resolve({ status: "TIMED_OUT", results: [], error: "The judge stopped the process at the time limit. No score was stored." });
        return;
      }
      const start = stdout.indexOf("{");
      if (start < 0) {
        resolve({ status: "FAILED", results: [], error: "The judge did not return a result." });
        return;
      }
      try {
        const parsed = JSON.parse(stdout.slice(start)) as { ok?: boolean; error?: string; results?: { ms?: unknown; value?: unknown; error?: string }[] };
        if (!parsed.ok || !Array.isArray(parsed.results)) {
          resolve({ status: "FAILED", results: [], error: parsed.error ?? "The source did not return a result." });
          return;
        }
        resolve({
          status: "JUDGED",
          error: "",
          results: parsed.results.map((row) => ({
            ms: typeof row.ms === "number" && Number.isFinite(row.ms) ? row.ms : null,
            value: row.value,
            error: row.error,
          })),
        });
      } catch {
        resolve({ status: "FAILED", results: [], error: "The judge result could not be read." });
      }
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(true);
    }, TIMEOUT_MS);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      if (stdout.length < 100_000) stdout += chunk;
    });
    child.on("error", () => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ status: "REFUSED", results: [], error: "The isolated process could not be started." });
    });
    child.on("close", () => finish(false));
    child.stdin.end(JSON.stringify({ source: program, entry, cases: cases.slice(0, 8) }));
  });
}
