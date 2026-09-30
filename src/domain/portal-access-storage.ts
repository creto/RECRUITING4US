const ACCESS_KEY = "recruit4us.portalAccess";

export function storePortalAccess(applicationId: string, accessToken: string) {
  try {
    sessionStorage.setItem(`${ACCESS_KEY}:${applicationId}`, accessToken);
  } catch {
    // Private mode — caller still receives the token for this navigation.
  }
}

export function readPortalAccess(applicationId: string): string | null {
  try {
    return sessionStorage.getItem(`${ACCESS_KEY}:${applicationId}`);
  } catch {
    return null;
  }
}

/** Pull access from ?access= and persist for this tab. */
export function takePortalAccessFromSearch(applicationId: string, search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const access = new URLSearchParams(raw).get("access");
  if (!access || access.length < 20) return null;
  storePortalAccess(applicationId, access);
  return access;
}

export function portalHrefWithAccess(applicationId: string, accessToken: string): string {
  return `/portal/${applicationId}?access=${encodeURIComponent(accessToken)}`;
}

export function portalPath(): string {
  return "/portal";
}
