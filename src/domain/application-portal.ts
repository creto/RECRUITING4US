/** Public applicant portal entry (email + application id, no Better Auth). */
export function applicationPortalPath(): string {
  return "/portal";
}

export function applicationPortalHref(applicationId: string, origin = ""): string {
  const path = `/portal/${applicationId}`;
  const base = origin.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export function applicationPortalGateLede(): string {
  return "Enter the email you applied with and your application id. You see your progress, assessments, interviews, offers, and messages for that application — without signing in.";
}
