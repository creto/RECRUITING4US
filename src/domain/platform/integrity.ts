const WORDS = /[A-Za-z_][A-Za-z0-9_]*/g;

export function normalizeCode(source: string): string[] {
  return (source.match(WORDS) ?? []).map((word) => word.toLowerCase()).filter((word) => word.length > 1);
}

function shingles(tokens: string[], size = 5): Set<string> {
  if (tokens.length === 0) return new Set();
  if (tokens.length < size) return new Set([tokens.join(" ")]);
  const out = new Set<string>();
  for (let i = 0; i <= tokens.length - size; i += 1) out.add(tokens.slice(i, i + size).join(" "));
  return out;
}

/** Jaccard similarity of token shingles, 0 to 100. Short or empty answers stay 0. */
export function similarityPercent(left: string, right: string): number {
  const a = shingles(normalizeCode(left));
  const b = shingles(normalizeCode(right));
  if (a.size < 3 || b.size < 3) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  const union = a.size + b.size - shared;
  if (union === 0) return 0;
  return Math.round((shared / union) * 100);
}

export function similarityOpensCase(score: number, threshold: number): boolean {
  if (!Number.isInteger(threshold) || threshold < 50 || threshold > 100) return false;
  return score >= threshold;
}

/** A camera or focus signal never rejects an application by itself. */
export function signalChangesScore(): false {
  return false;
}

export function disposeCase(current: string, next: string): { ok: true; status: "DISMISSED" | "CONFIRMED" } | { ok: false; error: string } {
  if (current !== "OPEN") return { ok: false, error: "This case is already closed." };
  if (next !== "DISMISSED" && next !== "CONFIRMED") return { ok: false, error: "Choose dismissed or confirmed." };
  return { ok: true, status: next };
}
