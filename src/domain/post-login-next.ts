/** Safe in-app path for login ?next= (open redirect guard). */
export function safeNextPath(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return fallback;
  if (value.startsWith("/login")) return fallback;
  return value.slice(0, 300);
}

/** Build /login?next=… so post-auth returns to assess / attempt / invite. */
export function loginPathWithNext(returnPath: string): string {
  const next = safeNextPath(returnPath, "");
  if (!next) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

/** Prefer a hard navigation after auth so dynamic routes like /assess/$token always match. */
export function goAfterLogin(nextPath: string): void {
  const target = safeNextPath(nextPath);
  if (typeof window !== "undefined") {
    window.location.assign(target);
    return;
  }
}
