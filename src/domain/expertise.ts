import { skillHit } from "./screen.ts";

export type ExpertiseScore = {
  score: number;
  ranked: boolean;
  lines: string[];
};

const YEAR_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20,
};

const SIGNALS: { pattern: RegExp; label: string; points: number }[] = [
  { pattern: /\b(shipped|production)\b/i, label: "Shipped or production work", points: 8 },
  { pattern: /\b(designed|design|architected|architecture)\b/i, label: "Design or architecture", points: 8 },
  { pattern: /\b(led|leading|managed|manager)\b/i, label: "Leading or managing", points: 6 },
  { pattern: /\b(mentor|mentored)\b/i, label: "Mentoring", points: 4 },
  { pattern: /\b(on-call|on call|incident)\b/i, label: "On-call or incident work", points: 4 },
  { pattern: /\b(open source|open-source)\b/i, label: "Open source", points: 4 },
];

/** Counted phrases and years. Not a model, and not a judgment of the person. */
export function scoreExpertise(input: {
  text: string | null;
  readable: boolean;
  required: string[];
  preferred: string[];
  strictness?: number;
}): ExpertiseScore {
  if (!input.readable || !input.text?.trim()) {
    return {
      score: 0,
      ranked: false,
      lines: ["The CV could not be read, so this person is left out of the ranking."],
    };
  }
  const text = input.text;
  const lines: string[] = [];
  let score = 0;
  for (const term of input.required) {
    const how = skillHit(text, term, input.strictness);
    if (how === "miss") {
      lines.push(`Must-have “${term}” was not found. 0 points.`);
      continue;
    }
    score += 25;
    if (how === "related") lines.push(`Must-have “${term}” counted from a related word. 25 points.`);
    else if (how === "alias") lines.push(`Must-have “${term}” counted from a close form. 25 points.`);
    else lines.push(`Must-have “${term}” found. 25 points.`);
  }
  for (const term of input.preferred) {
    const how = skillHit(text, term, input.strictness);
    if (how === "miss") continue;
    score += 10;
    lines.push(`Preferred “${term}” found. 10 points.`);
  }
  const years = yearsMentioned(text);
  if (years > 0) {
    const points = years * 4;
    score += points;
    lines.push(`${years} years mentioned. ${points} points.`);
  }
  for (const signal of SIGNALS) {
    if (!signal.pattern.test(text)) continue;
    score += signal.points;
    lines.push(`${signal.label}. ${signal.points} points.`);
  }
  lines.push(`Expertise total ${score}. The top half of readable CVs continue.`);
  return { score, ranked: true, lines };
}

function yearsMentioned(text: string): number {
  let best = 0;
  const pattern = new RegExp(
    `\\b(\\d{1,2}|${Object.keys(YEAR_WORDS).join("|")})\\s*\\+?\\s*(?:years|yrs)\\b`,
    "gi",
  );
  for (const match of text.matchAll(pattern)) {
    const raw = match[1]?.toLowerCase() ?? "";
    const value = /^\d+$/.test(raw) ? Number(raw) : YEAR_WORDS[raw] ?? 0;
    if (value > best) best = value;
  }
  return Math.min(best, 20);
}
