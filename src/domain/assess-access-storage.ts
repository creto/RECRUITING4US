const ACCESS_KEY = "recruit4us.assessAccess";

export function storeAssessAccess(attemptId: string, accessToken: string) {
  try {
    sessionStorage.setItem(`${ACCESS_KEY}:${attemptId}`, accessToken);
  } catch {
    // Private mode — caller still receives the token for this navigation.
  }
}

export function readAssessAccess(attemptId: string): string | null {
  try {
    return sessionStorage.getItem(`${ACCESS_KEY}:${attemptId}`);
  } catch {
    return null;
  }
}

/** Pull access from ?access= (invite unlock backup) and persist for this tab. */
export function takeAssessAccessFromSearch(attemptId: string, search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const access = new URLSearchParams(raw).get("access");
  if (!access || access.length < 20) return null;
  storeAssessAccess(attemptId, access);
  return access;
}

/** Attempt URL that carries the short-lived access proof (survives login round-trips). */
export function attemptHrefWithAccess(attemptId: string, accessToken: string): string {
  return `/candidate/attempts/${attemptId}?access=${encodeURIComponent(accessToken)}`;
}
