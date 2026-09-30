import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generatePortalOtpCode,
  hashPortalOtp,
  isPortalOtpCodeShape,
  maskEmail,
  normalizePortalOtpCode,
  portalOtpCodesEqual,
  portalOtpMailCopy,
  PORTAL_OTP_TTL_SECONDS,
} from "./portal-otp.ts";

describe("portal otp", () => {
  it("generates a six-digit code", () => {
    const code = generatePortalOtpCode();
    assert.match(code, /^\d{6}$/);
    assert.equal(isPortalOtpCodeShape(code), true);
  });

  it("hashes and compares codes in constant time shape", () => {
    const hash = hashPortalOtp({ secret: "s", challengeId: "c1", code: "123456" });
    const again = hashPortalOtp({ secret: "s", challengeId: "c1", code: "123456" });
    const other = hashPortalOtp({ secret: "s", challengeId: "c1", code: "000000" });
    assert.equal(portalOtpCodesEqual(hash, again), true);
    assert.equal(portalOtpCodesEqual(hash, other), false);
  });

  it("normalizes spaced codes and masks email", () => {
    assert.equal(normalizePortalOtpCode("12 34 56"), "123456");
    assert.equal(maskEmail("ada@example.com"), "ad***@example.com");
  });

  it("builds mail copy with ttl and purpose", () => {
    const mail = portalOtpMailCopy({
      companyName: "Northstar",
      code: "424242",
      purpose: "portal",
      ttlMinutes: Math.round(PORTAL_OTP_TTL_SECONDS / 60),
    });
    assert.match(mail.subject, /424242/);
    assert.match(mail.body, /424242/);
    assert.match(mail.body, /Northstar/);
  });
});
