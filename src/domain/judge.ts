import { deduplicateEvents, type DedupeEvent } from "./rules.ts";

/** Lower index is a better (faster) class. `unknown` means the source could not be classified. */
export const TIME_CLASSES = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(n^3)", "O(2^n)", "unknown"] as const;
export const SPACE_CLASSES = ["O(1)", "O(log n)", "O(n)", "O(n^2)", "unknown"] as const;

export type TimeClass = (typeof TIME_CLASSES)[number];
export type SpaceClass = (typeof SPACE_CLASSES)[number];

const TIME_POINTS: Record<TimeClass, number> = {
  "O(1)": 2000,
  "O(log n)": 1800,
  "O(n)": 1600,
  "O(n log n)": 1300,
  "O(n^2)": 700,
  "O(n^3)": 300,
  "O(2^n)": 100,
  unknown: 0,
};

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export type JudgeCase = { args: unknown[]; expected: unknown };

export type ComplexityEstimate = {
  timeClass: TimeClass;
  spaceClass: SpaceClass;
  reasons: string[];
};

export type RankRow = {
  id: string;
  status: "ESTIMATE" | "JUDGED" | "TIMED_OUT" | "FAILED" | "REFUSED";
  passed: number | null;
  total: number | null;
  timeClass: TimeClass;
  spaceClass: SpaceClass;
  measuredMs: number | null;
  basisPoints: number | null;
};

function classIndex(order: readonly string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

function stripLiterals(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, "''")
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, "''");
}

/** Heuristic only. It does not prove a bound. */
export function estimateComplexity(source: string): ComplexityEstimate {
  const code = stripLiterals(source);
  const reasons: string[] = [];
  if (!code.trim()) {
    return {
      timeClass: "unknown",
      spaceClass: "unknown",
      reasons: ["No source was saved, so complexity was not estimated."],
    };
  }
  let maxLoop = 0;
  let loopDepth = 0;
  let pending = 0;
  let paren = 0;
  const loopStack: boolean[] = [];
  for (let i = 0; i < code.length; i += 1) {
    const rest = code.slice(i);
    const word = /^(for|while)\b/.exec(rest);
    const method = /^\.(?:forEach|map|filter|reduce|flatMap|some|every)\s*\(/.exec(rest);
    if (word || method) {
      pending += 1;
      i += (word ?? method)![0].length - 1;
      continue;
    }
    const ch = code[i];
    if (ch === "(") {
      paren += 1;
      continue;
    }
    if (ch === ")") {
      paren = Math.max(0, paren - 1);
      continue;
    }
    if (ch === "{") {
      if (pending > 0) {
        pending -= 1;
        loopDepth += 1;
        maxLoop = Math.max(maxLoop, loopDepth);
        loopStack.push(true);
      } else {
        loopStack.push(false);
      }
      continue;
    }
    if (ch === "}") {
      if (loopStack.pop()) loopDepth = Math.max(0, loopDepth - 1);
      continue;
    }
    if (ch === ";" && paren === 0) pending = 0;
  }

  const declared = /function\s+([A-Za-z_$][\w$]*)/.exec(code);
  let calls = 0;
  if (declared) {
    const name = declared[1]!;
    const mentions = [...code.matchAll(new RegExp(`\\b${name}\\s*\\(`, "g"))].length;
    calls = Math.max(0, mentions - 1);
  }
  const hasSort = /\.sort\s*\(/.test(code);
  const hasHash = /new\s+(?:Map|Set)\b/.test(code);

  let timeClass: TimeClass = "O(1)";
  if (calls >= 2) {
    timeClass = "O(2^n)";
    reasons.push("The function calls itself more than once, which usually branches exponentially.");
  } else if (maxLoop >= 3) {
    timeClass = "O(n^3)";
    reasons.push("Three or more nested loops.");
  } else if (maxLoop === 2) {
    timeClass = "O(n^2)";
    reasons.push("Two nested loops.");
  } else if (hasSort) {
    timeClass = "O(n log n)";
    reasons.push("A sort is treated as n log n.");
  } else if (maxLoop === 1 || calls === 1) {
    timeClass = "O(n)";
    reasons.push(maxLoop === 1 ? "One loop over the input." : "One recursive call, treated as linear.");
  } else {
    reasons.push("No loop or recursion was found, so this is treated as constant time.");
  }
  if (hasHash) reasons.push("A map or set is present.");

  const allocates = /new\s+(?:Map|Set|Array)\b|\[\s*\]/.test(code);
  let spaceClass: SpaceClass = "O(1)";
  if (maxLoop >= 2 && /new\s+Array\b|Array\.from\s*\(/.test(code)) {
    spaceClass = "O(n^2)";
    reasons.push("An array is built inside nested loops, so extra space is treated as quadratic.");
  } else if (calls >= 1 || hasHash || allocates || maxLoop >= 1) {
    spaceClass = "O(n)";
    reasons.push("A collection or a recursive call is treated as linear extra space.");
  } else {
    reasons.push("No extra collection was found, so extra space is treated as constant.");
  }
  return { timeClass, spaceClass, reasons: reasons.slice(0, 4) };
}

export function codeEntry(source: string, hinted: string | null): string | null {
  if (hinted && IDENT.test(hinted) && new RegExp(`\\b${hinted}\\b`).test(source)) return hinted;
  const declared = /function\s+([A-Za-z_$][\w$]*)/.exec(source);
  if (declared) return declared[1]!;
  const assigned = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|\()/.exec(source);
  return assigned?.[1] ?? null;
}

export function dedupeCases(): JudgeCase[] {
  const samples: { events: DedupeEvent[]; windowMs: number }[] = [
    {
      events: [
        { id: "a", timestampMs: 0 },
        { id: "a", timestampMs: 5 },
        { id: "b", timestampMs: 6 },
        { id: "a", timestampMs: 10 },
        { id: "a", timestampMs: 11 },
      ],
      windowMs: 10,
    },
    { events: [{ id: "a", timestampMs: 0 }], windowMs: 0 },
    { events: [], windowMs: 4 },
    {
      events: [
        { id: "a", timestampMs: 0 },
        { id: "a", timestampMs: 0 },
      ],
      windowMs: 0,
    },
  ];
  const generated: DedupeEvent[] = [];
  for (let i = 0; i < 24; i += 1) {
    generated.push({ id: i % 3 === 0 ? "a" : "b", timestampMs: i * 3 });
  }
  samples.push({ events: generated, windowMs: 5 });
  return samples.map((sample) => ({
    args: [sample.events, sample.windowMs],
    expected: deduplicateEvents(sample.events, sample.windowMs),
  }));
}

/** Cases for a known problem. Other code is ranked on the estimate only. */
export function casesForQuestion(input: { logicalKey: string; prompt: string; entry: string | null }): JudgeCase[] {
  const blob = `${input.logicalKey}\n${input.prompt}\n${input.entry ?? ""}`.toLowerCase();
  if (input.logicalKey === "dedupe" || blob.includes("deduplicateevents")) return dedupeCases();
  return [];
}

function isEvent(value: unknown): value is { id: string; timestampMs: number } {
  if (!value || typeof value !== "object") return false;
  const row = value as { id?: unknown; timestampMs?: unknown };
  return typeof row.id === "string" && typeof row.timestampMs === "number";
}

function normalizeAnswer(value: unknown): unknown {
  if (Array.isArray(value) && value.every(isEvent)) {
    return value.map((event) => ({ id: event.id, timestampMs: event.timestampMs }));
  }
  return value;
}

/** Full events match. A timestamp list matches the expected timestamps in order. */
export function answersMatch(actual: unknown, expected: unknown): boolean {
  if (JSON.stringify(normalizeAnswer(actual)) === JSON.stringify(normalizeAnswer(expected))) return true;
  if (
    Array.isArray(expected) &&
    expected.every(isEvent) &&
    Array.isArray(actual) &&
    actual.every((item) => typeof item === "number")
  ) {
    return JSON.stringify(actual) === JSON.stringify(expected.map((event) => event.timestampMs));
  }
  return false;
}

/**
 * Up to 7000 for cases passed, 2000 for the time class, and 1000 for measured time.
 * Class and speed credit apply only when every case passes. No cases means no score.
 */
export function codeJudgeScore(input: {
  passed: number;
  total: number;
  timeClass: TimeClass;
  measuredMs: number | null;
}): { basisPoints: number | null; reason: string } {
  if (!Number.isInteger(input.total) || input.total <= 0 || !Number.isInteger(input.passed) || input.passed < 0 || input.passed > input.total) {
    return { basisPoints: null, reason: "No judge cases ran, so no score was given." };
  }
  const correctness = Math.round((input.passed / input.total) * 7000);
  if (input.passed !== input.total) {
    return { basisPoints: correctness, reason: "Complexity credit is withheld until every case passes." };
  }
  const complexity = TIME_POINTS[input.timeClass] ?? 0;
  let speed = 0;
  if (typeof input.measuredMs === "number" && Number.isFinite(input.measuredMs) && input.measuredMs >= 0) {
    if (input.measuredMs <= 5) speed = 1000;
    else if (input.measuredMs <= 20) speed = 700;
    else if (input.measuredMs <= 50) speed = 400;
    else speed = 100;
  }
  return {
    basisPoints: Math.min(10000, correctness + complexity + speed),
    reason: "Correctness, estimated time class, and measured time.",
  };
}

function band(row: RankRow): number {
  if (row.status === "TIMED_OUT" || row.status === "FAILED" || row.status === "REFUSED") return 4;
  if (row.total && row.total > 0 && row.passed === row.total && row.status === "JUDGED") return 0;
  if (row.total && row.total > 0 && (row.passed ?? 0) > 0 && row.status === "JUDGED") return 1;
  if (row.status === "ESTIMATE" || !row.total) return 2;
  return 3;
}

function measuredKey(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

/** Correct answers first, then a better time class, then space, then measured time. Ties share a rank. */
export function rankCodeResponses<T extends RankRow>(rows: readonly T[]): (T & { rank: number | null })[] {
  const decorated = rows.map((row, index) => ({ row, index }));
  decorated.sort((a, b) => {
    const bandDelta = band(a.row) - band(b.row);
    if (bandDelta !== 0) return bandDelta;
    const timeDelta = classIndex(TIME_CLASSES, a.row.timeClass) - classIndex(TIME_CLASSES, b.row.timeClass);
    if (timeDelta !== 0) return timeDelta;
    const spaceDelta = classIndex(SPACE_CLASSES, a.row.spaceClass) - classIndex(SPACE_CLASSES, b.row.spaceClass);
    if (spaceDelta !== 0) return spaceDelta;
    const measuredDelta = measuredKey(a.row.measuredMs) - measuredKey(b.row.measuredMs);
    if (measuredDelta !== 0) return measuredDelta;
    const basisDelta = (b.row.basisPoints ?? -1) - (a.row.basisPoints ?? -1);
    if (basisDelta !== 0) return basisDelta;
    return a.index - b.index;
  });
  let rank = 0;
  let lastKey = "";
  return decorated.map((item, position) => {
    if (item.row.status === "TIMED_OUT" || item.row.status === "FAILED" || item.row.status === "REFUSED") {
      return { ...item.row, rank: null };
    }
    const key = [
      band(item.row),
      item.row.timeClass,
      item.row.spaceClass,
      item.row.measuredMs ?? "",
      item.row.basisPoints ?? "",
    ].join("|");
    if (key !== lastKey) {
      rank = position + 1;
      lastKey = key;
    }
    return { ...item.row, rank };
  });
}
