import { createHmac, timingSafeEqual } from "node:crypto";

/** Short-lived proof that the applicant portal was unlocked (OTP or email+application id). */
export function mintPortalAccess(input: {
  applicationId: string;
  companyId: string;
  secret: string;
  ttlSeconds?: number;
}): string {
  const exp = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 60 * 60 * 36);
  const body = `p1.${input.applicationId}.${input.companyId}.${exp}`;
  const mac = createHmac("sha256", input.secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyPortalAccess(
  token: string,
  applicationId: string,
  secret: string,
): { ok: true; companyId: string } | { ok: false } {
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "p1") return { ok: false };
  const [, tokApp, companyId, expRaw, mac] = parts;
  if (!tokApp || !companyId || !expRaw || !mac) return { ok: false };
  if (tokApp !== applicationId) return { ok: false };
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return { ok: false };
  const body = `p1.${tokApp}.${companyId}.${expRaw}`;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  try {
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }
  return { ok: true, companyId };
}
