export const RATINGS = [
  { id: "definite_no", label: "Definite no", points: 0, background: "var(--color-danger)", color: "#1a0505" },
  { id: "no", label: "No", points: 1, background: "var(--color-warn)", color: "#1a1204" },
  { id: "yes", label: "Yes", points: 2, background: "var(--color-leaf)", color: "#f4f8ee" },
  { id: "strong_yes", label: "Strong yes", points: 3, background: "var(--color-accent)", color: "var(--color-accent-ink)" },
] as const;

export type RatingId = (typeof RATINGS)[number]["id"];

export type ScoreAttribute = { id: string; label: string };

export const DEFAULT_ATTRIBUTES: ScoreAttribute[] = [
  { id: "evidence", label: "Evidence for the role" },
  { id: "collaboration", label: "Collaboration" },
  { id: "communication", label: "Communication" },
];

export const SCOREBOARD_NOTE =
  "Rank is the average of submitted overall recommendations. Definite no is 0, No is 1, Yes is 2, and Strong yes is 3. The same average and the same number of scorecards share a rank. Attribute ratings are listed and are not added into that average. This is not a prediction, and it does not move anyone on the pipeline.";

export function ratingById(id: string) {
  return RATINGS.find((item) => item.id === id) ?? null;
}

/** Recruiter-written attributes. Blank means the three defaults are used later. */
export function parseAttributes(value: string): ScoreAttribute[] {
  const seen = new Set<string>();
  const out: ScoreAttribute[] = [];
  for (const part of value.split(/[\n,]/)) {
    const label = part.trim().replace(/\s+/g, " ");
    if (label.length < 2 || label.length > 80) continue;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label });
    if (out.length === 12) break;
  }
  return out;
}

export function attributesFromJson(value: unknown): ScoreAttribute[] {
  if (typeof value === "string") {
    try {
      return attributesFromJson(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: ScoreAttribute[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const id = String((item as { id?: unknown }).id ?? "");
    const label = String((item as { label?: unknown }).label ?? "").trim();
    if (!/^[a-z0-9-]{1,40}$/.test(id) || label.length < 2 || label.length > 80 || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label });
    if (out.length === 12) break;
  }
  return out;
}

export function attributesOrDefault(value: unknown): ScoreAttribute[] {
  const parsed = attributesFromJson(value);
  return parsed.length > 0 ? parsed : DEFAULT_ATTRIBUTES;
}

/** Focus is the subset checked for this interview. At least one is required. */
export function focusAttributes(source: ScoreAttribute[], selectedIds: string[]): { attributes: ScoreAttribute[] } | { error: string } {
  const pool = source.length > 0 ? source : DEFAULT_ATTRIBUTES;
  const chosen = pool.filter((item) => selectedIds.includes(item.id));
  if (chosen.length === 0) return { error: "Choose at least one focus attribute for this interview." };
  return { attributes: chosen };
}

export function submissionError(input: {
  attributes: ScoreAttribute[];
  ratings: Record<string, string>;
  recommendation: string;
  notes: string;
}): string | null {
  for (const attribute of input.attributes) {
    if (!ratingById(input.ratings[attribute.id] ?? "")) return "Rate every focus attribute before submitting.";
  }
  if (!ratingById(input.recommendation)) return "Choose an overall recommendation.";
  if (input.notes.trim().length < 8) return "Write a short note with the recommendation.";
  return null;
}

export type RankRow = {
  applicationId: string;
  recommendations: string[];
};

/** Higher average ranks first. Ties share a rank. No submitted recommendation stays unranked. */
export function rankScoreboard<T extends RankRow>(rows: T[]): Array<T & { rank: number | null; tied: boolean; average: number | null; submitted: number }> {
  const scored = rows.map((row) => {
    const points: number[] = [];
    for (const id of row.recommendations) {
      const rating = ratingById(id);
      if (rating) points.push(rating.points);
    }
    const average = points.length === 0
      ? null
      : Math.round((points.reduce((sum, value) => sum + value, 0) / points.length) * 100) / 100;
    return { ...row, average, submitted: points.length };
  });
  const rated = scored.filter((row) => row.average != null).sort((a, b) => {
    if (a.average !== b.average) return (b.average ?? 0) - (a.average ?? 0);
    if (a.submitted !== b.submitted) return b.submitted - a.submitted;
    return a.applicationId < b.applicationId ? -1 : a.applicationId > b.applicationId ? 1 : 0;
  });
  const unrated = scored.filter((row) => row.average == null).sort((a, b) => (
    a.applicationId < b.applicationId ? -1 : a.applicationId > b.applicationId ? 1 : 0
  ));
  let rank = 0;
  let seen = 0;
  let last = "";
  const ranked = rated.map((row) => {
    seen += 1;
    const key = `${row.average}:${row.submitted}`;
    if (key !== last) {
      rank = seen;
      last = key;
    }
    return { ...row, rank, tied: false };
  });
  const counts = new Map<number, number>();
  for (const row of ranked) counts.set(row.rank, (counts.get(row.rank) ?? 0) + 1);
  return [
    ...ranked.map((row) => ({ ...row, tied: (counts.get(row.rank) ?? 0) > 1 })),
    ...unrated.map((row) => ({ ...row, rank: null, tied: false })),
  ];
}
