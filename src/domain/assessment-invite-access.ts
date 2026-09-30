import { createHmac, timingSafeEqual } from "node:crypto";

/** Short-lived proof that email+applicationId unlocked an invite attempt. */
export function mintAssessAccess(input: {
  attemptId: string;
  assignmentId: string;
  secret: string;
  ttlSeconds?: number;
}): string {
  const exp = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 60 * 60 * 36);
  const body = `v1.${input.attemptId}.${input.assignmentId}.${exp}`;
  const mac = createHmac("sha256", input.secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyAssessAccess(
  token: string,
  attemptId: string,
  secret: string,
): { ok: true; assignmentId: string } | { ok: false } {
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") return { ok: false };
  const [, tokAttempt, assignmentId, expRaw, mac] = parts;
  if (!tokAttempt || !assignmentId || !expRaw || !mac) return { ok: false };
  if (tokAttempt !== attemptId) return { ok: false };
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return { ok: false };
  const body = `v1.${tokAttempt}.${assignmentId}.${expRaw}`;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  try {
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }
  return { ok: true, assignmentId };
}
