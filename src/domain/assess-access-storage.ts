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
