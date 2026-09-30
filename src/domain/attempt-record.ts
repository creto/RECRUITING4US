import { gradeExactMultipleChoice, gradeNumeric } from "./rules.ts";

export type ResponseResult = "blank" | "saved" | "correct" | "incorrect" | "pending" | "preference";

const SUBMITTED = new Set(["SUBMITTED", "GRADING", "AWAITING_REVIEW", "COMPLETED"]);

export function attemptWasSubmitted(status: string): boolean {
  return SUBMITTED.has(status);
}

export function describeSavedAnswer(input: {
  type: string;
  points: number;
  answer: unknown;
  options?: { id: string; label: string }[];
  correct?: string[];
  expected?: string;
  absTolerance?: string;
  relTolerance?: string;
  submitted: boolean;
}): { text: string; result: ResponseResult; earned: number | null; possible: number } {
  const points = Number.isInteger(input.points) && input.points > 0 ? input.points : 0;
  const answer = asRecord(input.answer);
  const options = input.options ?? [];
  const labelOf = (id: string) => options.find((option) => option.id === id)?.label ?? id;
  const objective = input.type === "single" || input.type === "multi" || input.type === "numeric";

  if (input.type === "likert") {
    const id = typeof answer?.optionId === "string" ? answer.optionId : "";
    if (!id) return empty(input.submitted, points, false);
    return { text: labelOf(id), result: input.submitted ? "preference" : "saved", earned: null, possible: points };
  }
  if (input.type === "single") {
    const id = typeof answer?.optionId === "string" ? answer.optionId : "";
    if (!id) return empty(input.submitted, points, objective);
    if (!input.submitted) return { text: labelOf(id), result: "saved", earned: null, possible: points };
    const credit = gradeExactMultipleChoice([id], input.correct ?? []);
    return graded(labelOf(id), credit, points);
  }
  if (input.type === "multi") {
    const ids = Array.isArray(answer?.optionIds) ? answer.optionIds.filter((id): id is string => typeof id === "string") : [];
    if (ids.length === 0) return empty(input.submitted, points, objective);
    const text = ids.map(labelOf).join(", ");
    if (!input.submitted) return { text, result: "saved", earned: null, possible: points };
    return graded(text, gradeExactMultipleChoice(ids, input.correct ?? []), points);
  }
  if (input.type === "numeric") {
    const value = typeof answer?.value === "string" ? answer.value.trim() : "";
    if (!value) return empty(input.submitted, points, objective);
    if (!input.submitted) return { text: value, result: "saved", earned: null, possible: points };
    const credit = input.expected
      ? gradeNumeric({
          answer: value,
          expected: input.expected,
          absTolerance: input.absTolerance ?? "0",
          relTolerance: input.relTolerance ?? "0",
        })
        ? 1
        : 0
      : 0;
    return graded(value, credit, points);
  }
  const text = typeof answer?.text === "string" ? answer.text.trim() : "";
  if (!text) return empty(input.submitted, points, false);
  const language = typeof answer?.language === "string" && answer.language.trim() ? answer.language.trim() : "";
  const labeled = language ? `[${language}]\n${text}` : text;
  if (!input.submitted) return { text: labeled, result: "saved", earned: null, possible: points };
  return { text: labeled, result: "pending", earned: null, possible: points };
}

export function responseResultLabel(input: { result: ResponseResult; earned: number | null; possible: number }): string {
  if (input.result === "blank") return "No answer saved.";
  if (input.result === "saved") return "Saved on this application. Not scored until the attempt is submitted.";
  if (input.result === "pending") return "Saved on this application. A person still grades this. Pending is not zero.";
  if (input.result === "preference") return "Saved preference. This question has no correct answer.";
  if (input.result === "correct") return `Correct. ${input.earned ?? 0} of ${input.possible} points.`;
  return `Incorrect. 0 of ${input.possible} points.`;
}

function empty(submitted: boolean, points: number, objective: boolean): { text: string; result: ResponseResult; earned: number | null; possible: number } {
  if (!submitted) return { text: "", result: "blank", earned: null, possible: points };
  if (!objective) return { text: "", result: "blank", earned: null, possible: points };
  return { text: "", result: "incorrect", earned: 0, possible: points };
}

function graded(text: string, credit: number, points: number) {
  return {
    text,
    result: credit > 0 ? ("correct" as const) : ("incorrect" as const),
    earned: Math.round(credit * points),
    possible: points,
  };
}

function asRecord(value: unknown): { optionId?: unknown; optionIds?: unknown; value?: unknown; text?: unknown; language?: unknown } | null {
  if (!value || typeof value !== "object") return null;
  return value as { optionId?: unknown; optionIds?: unknown; value?: unknown; text?: unknown; language?: unknown };
}
