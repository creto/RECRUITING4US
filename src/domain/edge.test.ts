import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calendarRefreshState, limitRunOutput, providerCallbackDecision } from "./edge.ts";

describe("runner, callbacks, and calendar", () => {
  it("truncates output and keeps a timeout flag", () => {
    const limited = limitRunOutput({ stdout: "x".repeat(20), stderr: "y".repeat(5), timedOut: true, maxChars: 8 });
    assert.equal(limited.stdout.length, 8);
    assert.equal(limited.truncated, true);
    assert.equal(limited.timedOut, true);
  });

  it("refuses a callback without a secret and ignores a forged company", () => {
    const base = {
      secretConfigured: false,
      signatureOk: false,
      bodyCompanyId: "other",
      recordCompanyId: "co-a",
      bodyAssignmentId: "as-1",
      recordAssignmentId: "as-1",
      seen: false,
      current: null,
      incoming: "SUCCEEDED" as const,
    };
    assert.equal(providerCallbackDecision(base), "refuse");
    assert.equal(providerCallbackDecision({ ...base, secretConfigured: true, signatureOk: true }), "mismatch");
    assert.equal(
      providerCallbackDecision({
        ...base,
        secretConfigured: true,
        signatureOk: true,
        bodyCompanyId: "co-a",
        seen: true,
      }),
      "replay",
    );
    assert.equal(
      providerCallbackDecision({
        ...base,
        secretConfigured: true,
        signatureOk: true,
        bodyCompanyId: "co-a",
        current: "SUCCEEDED",
        incoming: "FAILED",
      }),
      "regress",
    );
    assert.equal(
      providerCallbackDecision({
        ...base,
        secretConfigured: true,
        signatureOk: true,
        bodyCompanyId: "co-a",
        incoming: "SUCCEEDED",
      }),
      "accept",
    );
  });

  it("does not return a calendar secret when the credential is missing", () => {
    const missing = calendarRefreshState({ hasCredential: false, providerError: null });
    assert.equal(missing.status, "RECONNECT");
    assert.equal(missing.secret, null);
    assert.equal(JSON.stringify(missing).includes("token"), false);
    const failed = calendarRefreshState({ hasCredential: true, providerError: "Calendar vendor could not be reached." });
    assert.equal(failed.status, "RECONNECT");
    assert.equal(failed.secret, null);
    assert.equal(calendarRefreshState({ hasCredential: true, providerError: null }).status, "CONNECTED");
  });
});
