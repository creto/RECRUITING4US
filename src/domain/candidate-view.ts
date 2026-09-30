export type SavedAnswer = {
  optionId?: string;
  optionIds?: string[];
  value?: string;
  text?: string;
  /** Write-code language chosen by the candidate. */
  language?: string;
};

export type CandidateItem = {
  id: string;
  position: number;
  points: number;
  prompt: string;
  type: string;
  section: string;
  options: { id: string; label: string }[];
  numeric: { absTolerance: string; relTolerance: string } | null;
  answer: SavedAnswer | null;
  revision: number;
};

/** The exam page receives the prompt and the saved answer. It does not receive a key. */
export function candidateItem(input: {
  id: string;
  position: number;
  points: number;
  prompt: string;
  type: string;
  section: string;
  options?: { id: string; label: string }[];
  absTolerance?: string;
  relTolerance?: string;
  answer: unknown;
  revision: number;
}): CandidateItem {
  return {
    id: input.id,
    position: input.position,
    points: input.points,
    prompt: input.prompt,
    type: input.type,
    section: input.section,
    options: (input.options ?? []).map((option) => ({ id: option.id, label: option.label })),
    numeric: input.type === "numeric"
      ? { absTolerance: input.absTolerance ?? "0", relTolerance: input.relTolerance ?? "0" }
      : null,
    answer: savedAnswer(input.answer),
    revision: input.revision,
  };
}

function savedAnswer(value: unknown): SavedAnswer | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const answer: SavedAnswer = {};
  if (typeof record.optionId === "string") answer.optionId = record.optionId;
  if (Array.isArray(record.optionIds) && record.optionIds.every((id) => typeof id === "string")) {
    answer.optionIds = record.optionIds;
  }
  if (typeof record.value === "string") answer.value = record.value;
  if (typeof record.text === "string") answer.text = record.text;
  if (typeof record.language === "string" && record.language.trim()) answer.language = record.language.trim();
  return Object.keys(answer).length ? answer : null;
}

export function coerceAnswer(value: unknown): SavedAnswer | null {
  if (typeof value === "string") {
    try {
      return coerceAnswer(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  return savedAnswer(value);
}

export function answerComplete(type: string, answer: SavedAnswer | null | undefined): boolean {
  if (!answer) return false;
  if (type === "single" || type === "likert") return Boolean(answer.optionId);
  if (type === "multi") return Boolean(answer.optionIds && answer.optionIds.length > 0);
  if (type === "numeric") return Boolean(answer.value && answer.value.trim());
  return Boolean(answer.text && answer.text.trim());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

/** Choice labels only. Never reads a key, expected value, or scoring weight. */
export function orderedOptions(payload: unknown, order: unknown): { id: string; label: string }[] {
  const record = asRecord(payload);
  const raw = record?.options;
  const options: { id: string; label: string }[] = [];
  if (Array.isArray(raw)) {
    for (const option of raw) {
      if (Array.isArray(option) && typeof option[0] === "string" && typeof option[1] === "string") {
        const label = option[1].trim();
        if (label) options.push({ id: option[0], label });
        continue;
      }
      if (!option || typeof option !== "object") continue;
      const id = (option as { id?: unknown }).id;
      const label = (option as { label?: unknown }).label;
      if (typeof id === "string" && typeof label === "string" && label.trim()) {
        options.push({ id, label: label.trim() });
      }
    }
  }
  const ids = readOrder(order);
  if (!ids.length) return options;
  const ranked = ids
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is { id: string; label: string } => Boolean(option));
  return ranked.length ? ranked : options;
}

function readOrder(order: unknown): string[] {
  if (typeof order === "string") {
    try {
      return readOrder(JSON.parse(order) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(order)) return [];
  return order.filter((id): id is string => typeof id === "string");
}

const SECRET = /"expected"|"correct"|"toward"|"key_payload"|"dimension"/;

export function examPayloadLeaksKey(value: unknown): boolean {
  return SECRET.test(JSON.stringify(value));
}
