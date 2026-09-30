import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessmentInviteGateLede, assessmentInviteHref, assessmentInvitePath } from "./assessment-invite.ts";

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

  it("explains the email + application id unlock", () => {
    assert.match(assessmentInviteGateLede(), /application id/i);
    assert.match(assessmentInviteGateLede(), /does not start the timer/i);
  });
});
