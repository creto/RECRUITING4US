/** Public applicant portal entry (email + one-time code). */
export function applicationPortalPath(): string {
  return "/portal";
}

export function applicationPortalHref(applicationId: string, origin = ""): string {
  const path = `/portal/${applicationId}`;
  const base = origin.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export function applicationPortalGateLede(): string {
  return "Enter the email you applied with. We send a short one-time code to that inbox. After you unlock, you see your applications for that employer — progress, assessments, interviews, offers, and messages — without signing in.";
}
