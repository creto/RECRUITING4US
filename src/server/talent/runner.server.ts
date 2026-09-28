import { spawn, spawnSync } from "node:child_process";
import { limitRunOutput } from "../../domain/edge.ts";
import { clampRunLimits } from "../../domain/ops.ts";

const MAX_SOURCE = 20_000;
const TIMEOUT_MS = 1500;
const MAX_STDOUT = 80_000;

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
    send({ ok: false, kind: "infra", error: "The judge input was not JSON." });
    return;
  }
  const entry = typeof input.entry === "string" ? input.entry : "";
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry)) {
    send({ ok: false, kind: "compile", error: "The entry function name is not usable." });
    return;
  }
  const cases = Array.isArray(input.cases) ? input.cases.slice(0, 12) : [];
  let fn = null;
  try {
    const load = new Function("src", "name", "eval(src); try { const found = eval(name); if (typeof found === 'function') return found; } catch (e) {} return typeof globalThis[name] === 'function' ? globalThis[name] : null;");
    fn = load(String(input.source ?? ""), entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The source did not load.";
    send({ ok: false, kind: "compile", error: message.slice(0, 300) });
    return;
  }
  if (typeof fn !== "function") {
    send({ ok: false, kind: "compile", error: "The entry function was not found." });
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
  send({ ok: true, kind: "judged", results });
});
`;

const JAIL_FLAGS = ["--user", "--map-root-user", "--net", "--mount", "--pid", "--fork", "--mount-proc"] as const;

/** Hide the repo, home, and host /etc, then exec Node with an empty environment. */
const JAIL_SCRIPT = [
  "ulimit -t 3 -u 32 || exit 90",
  "mount -t tmpfs tmpfs /workspace || exit 91",
  "mount -t tmpfs tmpfs /home || exit 91",
  "mount -t tmpfs tmpfs /root || exit 91",
  "mount -t tmpfs tmpfs /etc || exit 91",
  "mount -t tmpfs tmpfs /tmp || exit 91",
  'exec "$0" "$@"',
].join("; ");

export const JUDGE_RUNTIME = "node-userns-mount-net-permission-2";

let isolateReady: boolean | null = null;

/**
 * A child process is not the boundary. The worker runs in a new user, mount, pid, and
 * network namespace, with the workspace and /etc covered by tmpfs, Node's permission
 * model, a 64 MB heap, a CPU ulimit, and a wall-clock kill from the parent.
 */
export function isolateAvailable(): boolean {
  if (isolateReady != null) return isolateReady;
  const probe = spawnSync("unshare", [...JAIL_FLAGS, "true"], { timeout: 3000 });
  isolateReady = probe.status === 0;
  return isolateReady;
}

type Captured = {
  started: boolean;
  timedOut: boolean;
  truncated: boolean;
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
};

function runCaptured(harness: string, stdin: string, timeoutMs: number, maxChars: number): Promise<Captured> {
  if (!isolateAvailable()) {
    return Promise.resolve({
      started: false,
      timedOut: false,
      truncated: false,
      code: null,
      signal: null,
      stdout: "",
      stderr: "unshare is not available, so the source was not executed.",
    });
  }
  return new Promise((resolve) => {
    const child = spawn(
      "unshare",
      [...JAIL_FLAGS, "bash", "-c", JAIL_SCRIPT, process.execPath, "--permission", "--max-old-space-size=64", "-e", harness],
      {
        env: { PATH: "/usr/local/bin:/usr/bin:/bin" },
        stdio: ["pipe", "pipe", "pipe"],
        detached: true,
      },
    );
    let stdout = "";
    let stderr = "";
    let settled = false;
    let truncated = false;
    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        started: true,
        timedOut,
        truncated,
        code: child.exitCode,
        signal: child.signalCode,
        stdout,
        stderr,
      });
    };
    const kill = () => {
      try {
        if (child.pid) process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    };
    const timer = setTimeout(() => {
      kill();
      finish(true);
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      if (stdout.length < maxChars * 2) stdout += chunk;
      if (stdout.length > MAX_STDOUT) {
        truncated = true;
        kill();
      }
    });
    child.stderr.on("data", (chunk: string) => {
      if (stderr.length < 8_000) stderr += chunk;
    });
    child.on("error", () => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ started: false, timedOut: false, truncated: false, code: null, signal: null, stdout: "", stderr: "The isolated process could not be started." });
    });
    child.on("close", () => finish(false));
    child.stdin.end(stdin);
  });
}

export type IsolatedRun = {
  available: boolean;
  status: "SUCCEEDED" | "TIMED_OUT" | "FAILED" | "REFUSED";
  reason: string;
  outputExcerpt: string;
  timedOut: boolean;
  truncated: boolean;
};

/** Run candidate source outside this process. The parent never evals it. No score is produced. */
export function runIsolated(
  source: string,
  requested?: { timeoutMs?: number; maxOutputChars?: number },
): Promise<IsolatedRun> {
  const limits = clampRunLimits(requested);
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
  return runCaptured(HARNESS, program, limits.timeoutMs, limits.maxOutputChars).then((captured) => {
    if (!captured.started) {
      return {
        available: false,
        status: "REFUSED" as const,
        reason: "The isolated process could not be started. The source was not executed in the application process.",
        outputExcerpt: "",
        timedOut: false,
        truncated: false,
      };
    }
    const limited = limitRunOutput({ stdout: captured.stdout, stderr: captured.stderr, timedOut: captured.timedOut, maxChars: limits.maxOutputChars });
    const excerpt = [limited.stdout, limited.stderr].filter(Boolean).join("\n").slice(0, limits.maxOutputChars);
    if (captured.timedOut) {
      return {
        available: true,
        status: "TIMED_OUT" as const,
        reason: "The run was stopped because it exceeded the time limit. No score was given.",
        outputExcerpt: excerpt,
        timedOut: true,
        truncated: limited.truncated || captured.truncated,
      };
    }
    const ok = captured.code === 0 && !captured.signal;
    return {
      available: true,
      status: ok ? "SUCCEEDED" as const : "FAILED" as const,
      reason: ok ? "The process finished. This output is not a score." : "The process exited with an error. This is not a score.",
      outputExcerpt: excerpt,
      timedOut: false,
      truncated: limited.truncated || captured.truncated,
    };
  });
}

export type JudgeCaseResult = { ms: number | null; value?: unknown; error?: string };

export type JudgeRun = {
  status: "JUDGED" | "TIMED_OUT" | "COMPILE" | "INFRA" | "OUTPUT" | "REFUSED";
  results: JudgeCaseResult[];
  error: string;
};

/** Run cases in the network namespace. Expected answers stay in the parent. */
export function judgeIsolated(
  source: string,
  entry: string,
  cases: readonly unknown[][],
): Promise<JudgeRun> {
  const program = source.slice(0, MAX_SOURCE);
  if (!program.trim() || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry)) {
    return Promise.resolve({ status: "REFUSED", results: [], error: "There is no function to judge." });
  }
  const payload = JSON.stringify({ source: program, entry, cases: cases.slice(0, 12) });
  return runCaptured(JUDGE_HARNESS, payload, TIMEOUT_MS, 4000).then((captured) => {
    if (!captured.started) {
      return { status: "REFUSED", results: [], error: "The isolated process could not be started." };
    }
    if (captured.truncated) {
      return { status: "OUTPUT", results: [], error: "The run was stopped because it wrote too much. No score was stored." };
    }
    if (captured.timedOut) {
      return { status: "TIMED_OUT", results: [], error: "The judge stopped the process at the time limit. No score was stored." };
    }
    const heap = /heap out of memory|FatalProcessOutOfMemory/i.test(captured.stderr);
    const start = captured.stdout.indexOf("{");
    if (start < 0) {
      return {
        status: "INFRA",
        results: [],
        error: heap
          ? "The judge ran out of memory and stopped. This is not a score of zero."
          : "The judge did not return a result. This is not a score of zero.",
      };
    }
    try {
      const parsed = JSON.parse(captured.stdout.slice(start)) as {
        ok?: boolean;
        kind?: string;
        error?: string;
        results?: { ms?: unknown; value?: unknown; error?: string }[];
      };
      if (!parsed.ok || !Array.isArray(parsed.results)) {
        if (parsed.kind === "compile") {
          return { status: "COMPILE", results: [], error: parsed.error ?? "The source did not load." };
        }
        return { status: "INFRA", results: [], error: parsed.error ?? "The judge failed before scoring. This is not a score of zero." };
      }
      return {
        status: "JUDGED",
        error: "",
        results: parsed.results.map((row) => ({
          ms: typeof row.ms === "number" && Number.isFinite(row.ms) ? row.ms : null,
          value: row.value,
          error: row.error,
        })),
      };
    } catch {
      return { status: "INFRA", results: [], error: "The judge result could not be read. This is not a score of zero." };
    }
  });
}
