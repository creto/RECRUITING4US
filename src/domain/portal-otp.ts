import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/** OTP lifetime for portal / assess unlock emails. */
export const PORTAL_OTP_TTL_SECONDS = 12 * 60;

/** Max active verify attempts per challenge. */
export const PORTAL_OTP_MAX_ATTEMPTS = 5;

/** Max challenge creates per email+company in the rolling window. */
export const PORTAL_OTP_REQUEST_LIMIT = 5;

/** Rolling window for request rate limit. */
export const PORTAL_OTP_REQUEST_WINDOW_SECONDS = 15 * 60;

export type PortalOtpPurpose = "portal" | "assess";

export function generatePortalOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashPortalOtp(input: {
  secret: string;
  challengeId: string;
  code: string;
}): string {
  return createHash("sha256")
    .update(`${input.secret}:portal-otp:${input.challengeId}:${input.code.trim()}`, "utf8")
    .digest("hex");
}

export function portalOtpCodesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function normalizePortalOtpCode(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

export function isPortalOtpCodeShape(raw: string): boolean {
  return /^\d{6}$/.test(normalizePortalOtpCode(raw));
}

export function portalOtpExpiresAt(nowMs = Date.now()): Date {
  return new Date(nowMs + PORTAL_OTP_TTL_SECONDS * 1000);
}

export function maskEmail(email: string): string {
  const value = email.trim().toLowerCase();
  const at = value.indexOf("@");
  if (at < 1) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}***@${domain}`;
}

export function portalOtpMailCopy(input: {
  companyName: string;
  code: string;
  purpose: PortalOtpPurpose;
  ttlMinutes: number;
}): { subject: string; body: string } {
  const who = input.companyName.trim() || "the employer";
  const what =
    input.purpose === "assess"
      ? `your assessment for ${who}`
      : `your applicant portal for ${who}`;
  return {
    subject: `${input.code} is your RECRUIT4US code`,
    body: [
      `Your one-time code for ${what} is:`,
      "",
      input.code,
      "",
      `It expires in about ${input.ttlMinutes} minutes. If you did not request this, you can ignore this message.`,
    ].join("\n"),
  };
}
