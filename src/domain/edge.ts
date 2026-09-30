/** Caps applied at the runner boundary. A timeout or a cut-off output is not a score. */
export function limitRunOutput(input: {
  stdout: string;
  stderr: string;
  timedOut: boolean;
  maxChars: number;
}): { stdout: string; stderr: string; truncated: boolean; timedOut: boolean } {
  const cap = Number.isInteger(input.maxChars) && input.maxChars > 0 ? input.maxChars : 4000;
  return {
    stdout: input.stdout.slice(0, cap),
    stderr: input.stderr.slice(0, cap),
    truncated: input.stdout.length > cap || input.stderr.length > cap,
    timedOut: input.timedOut,
  };
}

export type CallbackStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

/**
 * A provider cannot pick a tenant from the body, replay an event, or walk a finished result backwards.
 * A missing secret refuses before any row is written.
 */
export function providerCallbackDecision(input: {
  secretConfigured: boolean;
  signatureOk: boolean;
  bodyCompanyId: string;
  recordCompanyId: string;
  bodyAssignmentId: string;
  recordAssignmentId: string;
  seen: boolean;
  current: CallbackStatus | "FINAL" | null;
  incoming: CallbackStatus;
}): "refuse" | "mismatch" | "replay" | "regress" | "accept" {
  if (!input.secretConfigured || !input.signatureOk) return "refuse";
  if (input.bodyCompanyId !== input.recordCompanyId || input.bodyAssignmentId !== input.recordAssignmentId) {
    return "mismatch";
  }
  if (input.seen) return "replay";
  if ((input.current === "SUCCEEDED" || input.current === "FINAL") && input.incoming !== "SUCCEEDED") {
    return "regress";
  }
  if (input.current === "SUCCEEDED" || input.current === "FINAL") return "replay";
  return "accept";
}

/** Refresh never returns a credential. Missing vendor config is a reconnect, not a connected calendar. */
export function calendarRefreshState(input: {
  hasCredential: boolean;
  providerError: string | null;
}): { status: "CONNECTED" | "RECONNECT"; secret: null; error: string } {
  if (!input.hasCredential) {
    return { status: "RECONNECT", secret: null, error: "No calendar credential is configured." };
  }
  if (input.providerError) return { status: "RECONNECT", secret: null, error: input.providerError };
  return { status: "CONNECTED", secret: null, error: "" };
}

export function runnerAvailability(): { available: true; mode: "network-namespace"; reason: string } {
  return {
    available: true,
    mode: "network-namespace",
    reason:
      "Write code in any supported language. Sample runs execute JavaScript/TypeScript in a separate Node process inside a network namespace (files, child processes, and workers denied; memory and CPU capped). Other languages are saved as text for human grading and are not executed. This is not a hypervisor and not a remote judge. A timeout or infrastructure failure is not a score.",
  };
}
