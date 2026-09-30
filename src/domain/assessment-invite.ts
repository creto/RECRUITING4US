/** Candidate path for an assessment assignment invite. */
export function assessmentInvitePath(token: string): string {
  return `/assess/${token}`;
}

/**
 * Absolute invite URL when a public origin is known (BETTER_AUTH_URL).
 * Falls back to the path so queued mail still carries a usable link.
 */
export function assessmentInviteHref(token: string, origin = ""): string {
  const path = assessmentInvitePath(token);
  const base = origin.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/** Copy on the public /assess/$token gate (no Better Auth). */
export function assessmentInviteGateLede(): string {
  return "Enter the invited email. We send a short one-time code to that inbox. Opening this page does not start the timer. Unlock only when you are ready.";
}

/** Application ids are UUIDs (36 chars). Reject truncated pastes early. */
const APPLICATION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeApplicationId(raw: string): string {
  return raw.trim();
}

export function isApplicationIdShape(raw: string): boolean {
  return APPLICATION_ID_RE.test(normalizeApplicationId(raw));
}

/** User-facing hint when the pasted application id is incomplete or malformed. */
export function applicationIdGateHint(raw: string): string | null {
  const value = normalizeApplicationId(raw);
  if (!value) return "Paste the full application id from your apply confirmation.";
  if (value.length < 36) {
    return `That application id looks incomplete (${value.length} of 36 characters). Paste the full id — do not cut off the last character.`;
  }
  if (value.length > 36 || !APPLICATION_ID_RE.test(value)) {
    return "Application id must be a full UUID (36 characters), like bd546960-cae6-4cfd-873a-73e06c51015b.";
  }
  return null;
}
