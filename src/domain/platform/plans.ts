export type PlanStage = { name: string; kind: string };

export const STANDARD_PLAN: PlanStage[] = [
  { name: "Application review", kind: "REVIEW" },
  { name: "Coding assessment", kind: "CODING" },
  { name: "Math and work style", kind: "ASSESSMENT" },
  { name: "Final problems", kind: "CODING" },
  { name: "Technical interview", kind: "INTERVIEW" },
  { name: "Offer", kind: "OFFER" },
];

export const SCREEN_FIRST_PLAN: PlanStage[] = [
  { name: "Recruiter screen", kind: "SCREEN" },
  { name: "Technical interview", kind: "INTERVIEW" },
  { name: "Coding assessment", kind: "CODING" },
  { name: "Offer", kind: "OFFER" },
];

export const STAGE_KINDS = ["REVIEW", "SCREEN", "CODING", "ASSESSMENT", "INTERVIEW", "PANEL", "OFFER", "CUSTOM"] as const;

export type StageDraft = {
  name: string;
  kind: string;
  reviewers?: number;
  entryRule?: string;
  exitRule?: string;
  assessmentKey?: string;
  scorecardFocus?: string;
};

export function normalizeStages(rows: StageDraft[]): { ok: true; stages: StageDraft[] } | { ok: false; error: string } {
  if (rows.length < 1 || rows.length > 12) return { ok: false, error: "A plan needs between 1 and 12 stages." };
  const names = new Set<string>();
  const stages: StageDraft[] = [];
  for (const row of rows) {
    const name = row.name.trim().slice(0, 80);
    if (name.length < 2) return { ok: false, error: "Every stage needs a name." };
    const key = name.toLowerCase();
    if (names.has(key)) return { ok: false, error: "Stage names must be unique in one plan." };
    names.add(key);
    if (!(STAGE_KINDS as readonly string[]).includes(row.kind)) return { ok: false, error: "That stage kind is not supported." };
    stages.push({
      name,
      kind: row.kind,
      reviewers: Math.min(8, Math.max(0, Math.trunc(row.reviewers ?? 1))),
      entryRule: (row.entryRule ?? "").slice(0, 200),
      exitRule: (row.exitRule ?? "").slice(0, 200),
      assessmentKey: (row.assessmentKey ?? "").slice(0, 80),
      scorecardFocus: (row.scorecardFocus ?? "").slice(0, 200),
    });
  }
  return { ok: true, stages };
}

/** A re-rank keeps issued invitations unless the caller passes an explicit cancellation. */
export function invitesAfterRerank(inviteIds: string[], cancelIds: string[] = []): string[] {
  const drop = new Set(cancelIds);
  return inviteIds.filter((id) => !drop.has(id));
}

export type Ranked = { id: string; score: number | null };

/**
 * Top percent, including everyone tied with the last person inside the cutoff.
 * Null scores stay out of the automatic advance. They are listed as missing.
 * When automatic is false, nobody is advanced by the cutoff.
 */
export function rankCutoff(rows: Ranked[], percent: number, automatic = true): {
  advancedIds: string[];
  cutoffScore: number | null;
  missingIds: string[];
  pool: number;
} {
  const pct = Math.min(100, Math.max(1, Math.round(percent)));
  const missingIds = rows.filter((row) => row.score == null).map((row) => row.id);
  const scored = rows.filter((row): row is { id: string; score: number } => row.score != null);
  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  if (!automatic || scored.length === 0) return { advancedIds: [], cutoffScore: scored[0]?.score ?? null, missingIds, pool: scored.length };
  const keep = Math.max(1, Math.ceil((scored.length * pct) / 100));
  const cutoffScore = scored[keep - 1]!.score;
  const advancedIds = scored.filter((row) => row.score >= cutoffScore).map((row) => row.id);
  return { advancedIds, cutoffScore, missingIds, pool: scored.length };
}

export function personalityCannotGate(personalityIsCutoff: boolean): { ok: true } | { ok: false; error: string } {
  if (personalityIsCutoff) return { ok: false, error: "A personality type is not a hiring cutoff." };
  return { ok: true };
}

export function explainCutoff(input: { name: string; score: number | null; advanced: boolean; missing: boolean; cutoffScore: number | null; percent: number; automatic?: boolean }): string {
  if (input.automatic === false) {
    if (input.score == null) return `${input.name} has no score. Automatic cutoff is off, so a recruiter decides. A missing CV is not a rejection.`;
    return `${input.name} scored ${input.score}. Automatic cutoff is off, so this score does not advance or withdraw anyone. Issued invitations stay.`;
  }
  if (input.missing || input.score == null) {
    return `${input.name} has no score, so the cutoff did not advance them. A recruiter can still pass them. A missing CV is listed here and is not a rejection.`;
  }
  if (input.advanced) {
    return `${input.name} scored ${input.score}. The top ${input.percent}% cutoff is ${input.cutoffScore}. Ties at that score are included.`;
  }
  return `${input.name} scored ${input.score}, below the cutoff of ${input.cutoffScore}. This does not withdraw a paper that was already sent.`;
}

export function onboardingTasks(roleTitle: string, location: string): { title: string; owner: string; visible: boolean }[] {
  const tasks = [
    { title: "Confirm the start date", owner: "RECRUITER", visible: false },
    { title: "Share a personal phone number for the first week", owner: "CANDIDATE", visible: true },
    { title: "Acknowledge the handbook", owner: "CANDIDATE", visible: true },
    { title: "Request accounts", owner: "ADMIN", visible: false },
    { title: "Schedule the first-week introduction", owner: "HIRING_MANAGER", visible: false },
  ];
  if (/engineer|developer/i.test(roleTitle)) {
    tasks.push({ title: "Confirm repository access", owner: "ADMIN", visible: false });
  }
  if (/remote/i.test(location)) {
    tasks.push({ title: "Ship equipment to the home address", owner: "RECRUITER", visible: true });
  } else if (location.trim()) {
    tasks.push({ title: `Prepare a desk at ${location.trim().slice(0, 80)}`, owner: "ADMIN", visible: false });
  }
  return tasks;
}
