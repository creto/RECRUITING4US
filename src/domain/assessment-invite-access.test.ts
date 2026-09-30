import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mintAssessAccess, verifyAssessAccess } from "./assessment-invite-access.ts";

describe("assessment invite access", () => {
  it("mints and verifies a bound attempt token", () => {
    const token = mintAssessAccess({
      attemptId: "attempt-1",
      assignmentId: "assign-1",
      secret: "test-secret",
      ttlSeconds: 60,
    });
    assert.equal(verifyAssessAccess(token, "attempt-1", "test-secret").ok, true);
    assert.equal(verifyAssessAccess(token, "attempt-2", "test-secret").ok, false);
    assert.equal(verifyAssessAccess(token, "attempt-1", "wrong").ok, false);
  });
});
