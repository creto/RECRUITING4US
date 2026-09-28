export type CaseVerdict = "PASS" | "WRONG" | "RUNTIME" | "TIMEOUT" | "INFRA" | "HIDDEN_PASS" | "HIDDEN_WRONG";

export type GradedCase = {
  name: string;
  visibility: "SAMPLE" | "HIDDEN";
  weight: number;
  verdict: "PASS" | "WRONG" | "RUNTIME" | "TIMEOUT" | "INFRA";
};

export type Grade = {
  status: "SCORED" | "TIMEOUT" | "INFRA" | "COMPILE" | "EMPTY" | "OUTPUT";
  score: number | null;
  maxScore: number;
  passed: number | null;
  total: number;
  detail: string;
  cases: GradedCase[];
};

function same(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function gradeCases(input: {
  infra: boolean;
  timedOut: boolean;
  compileError: string;
  rows: { name: string; visibility: "SAMPLE" | "HIDDEN"; weight: number; expected: unknown; value?: unknown; error?: string }[];
}): Grade {
  const maxScore = input.rows.reduce((sum, row) => sum + Math.max(0, row.weight), 0);
  if (input.infra) {
    return {
      status: "INFRA",
      score: null,
      maxScore,
      passed: null,
      total: input.rows.length,
      detail: "The judge could not run. This is not a score of zero.",
      cases: input.rows.map((row) => ({ name: row.name, visibility: row.visibility, weight: row.weight, verdict: "INFRA" })),
    };
  }
  if (input.timedOut) {
    return {
      status: "TIMEOUT",
      score: null,
      maxScore,
      passed: null,
      total: input.rows.length,
      detail: "The run was stopped at the time limit. No score was stored.",
      cases: input.rows.map((row) => ({ name: row.name, visibility: row.visibility, weight: row.weight, verdict: "TIMEOUT" })),
    };
  }
  if (input.compileError === "OUTPUT") {
    return {
      status: "OUTPUT",
      score: null,
      maxScore,
      passed: null,
      total: input.rows.length,
      detail: "The run was stopped because it wrote too much. No score was stored.",
      cases: input.rows.map((row) => ({ name: row.name, visibility: row.visibility, weight: row.weight, verdict: "TIMEOUT" })),
    };
  }
  if (input.compileError) {
    return {
      status: "COMPILE",
      score: 0,
      maxScore,
      passed: 0,
      total: input.rows.length,
      detail: input.compileError.slice(0, 300),
      cases: input.rows.map((row) => ({ name: row.name, visibility: row.visibility, weight: row.weight, verdict: "RUNTIME" })),
    };
  }
  if (input.rows.length === 0) {
    return { status: "EMPTY", score: null, maxScore: 0, passed: null, total: 0, detail: "This question has no cases.", cases: [] };
  }
  let score = 0;
  let passed = 0;
  const cases: GradedCase[] = input.rows.map((row) => {
    if (row.error) return { name: row.name, visibility: row.visibility, weight: row.weight, verdict: "RUNTIME" };
    if (same(row.value, row.expected)) {
      score += row.weight;
      passed += 1;
      return { name: row.name, visibility: row.visibility, weight: row.weight, verdict: "PASS" };
    }
    return { name: row.name, visibility: row.visibility, weight: row.weight, verdict: "WRONG" };
  });
  return {
    status: "SCORED",
    score,
    maxScore,
    passed,
    total: input.rows.length,
    detail: `${passed} of ${input.rows.length} cases passed. Score ${score} of ${maxScore}.`,
    cases,
  };
}

/** Candidate view. Hidden expected values are already absent. Hidden verdicts stay, without the answer. */
export function candidateCases(grade: Grade): { name: string; visibility: string; verdict: string }[] {
  return grade.cases.map((row) => ({
    name: row.name,
    visibility: row.visibility,
    verdict: row.visibility === "HIDDEN" ? (row.verdict === "PASS" ? "PASS" : row.verdict) : row.verdict,
  }));
}
