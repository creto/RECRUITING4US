import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applicationIdGateHint, assessmentInviteGateLede, assessmentInviteHref, assessmentInvitePath, isApplicationIdShape } from "./assessment-invite.ts";

describe("assessment invite", () => {
  it("builds the candidate path and absolute href", () => {
    const token = "11111111-1111-1111-1111-111111111111";
    assert.equal(assessmentInvitePath(token), `/assess/${token}`);
    assert.equal(assessmentInviteHref(token), `/assess/${token}`);
    assert.equal(
      assessmentInviteHref(token, "https://hire.example.com/"),
      `https://hire.example.com/assess/${token}`,
    );
  });

  it("explains the email OTP unlock", () => {
    assert.match(assessmentInviteGateLede(), /one-time code/i);
    assert.match(assessmentInviteGateLede(), /does not start the timer/i);
    assert.doesNotMatch(assessmentInviteGateLede(), /application id/i);
  });

  it("rejects truncated application ids before unlock", () => {
    const full = "bd546960-cae6-4cfd-873a-73e06c51015b";
    assert.equal(isApplicationIdShape(full), true);
    assert.equal(applicationIdGateHint(full), null);
    assert.match(applicationIdGateHint(full.slice(0, -1)) ?? "", /incomplete/i);
    assert.match(applicationIdGateHint("not-a-uuid") ?? "", /36/i);
  });
});
