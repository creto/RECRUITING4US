export type HalfRow = { id: string; score: number };

export type HalfResult = {
  pool: number;
  cutoff: number | null;
  note: string;
  byId: Map<string, { rank: number; advanced: boolean }>;
};

/**
 * Top half. The cutoff is the score at position ceil(n / 2).
 * Everyone tied with that score continues, so a tie can send more than half.
 * Order inside a tie is by id, and that order does not decide who continues.
 */
export function rankTopHalf(rows: HalfRow[]): HalfResult {
  const ordered = [...rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const pool = ordered.length;
  if (pool === 0) {
    return { pool: 0, cutoff: null, note: "Nobody is in this ranking yet.", byId: new Map() };
  }
  const slots = Math.ceil(pool / 2);
  const cutoff = ordered[slots - 1]!.score;
  const byId = new Map<string, { rank: number; advanced: boolean }>();
  ordered.forEach((row, index) => {
    byId.set(row.id, { rank: index + 1, advanced: row.score >= cutoff });
  });
  const advanced = [...byId.values()].filter((row) => row.advanced).length;
  const note = advanced === slots
    ? `Top half of ${pool}. Cutoff ${cutoff}. ${advanced} continue.`
    : `Top half of ${pool} would be ${slots}, but the cutoff score ${cutoff} is tied, so ${advanced} continue.`;
  return { pool, cutoff, note, byId };
}
