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
  return "Enter the invited email and your application id. Opening this page does not start the timer. Unlock only when you are ready.";
}
