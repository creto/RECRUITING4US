export const DELIVERY_STATES = [
  "QUEUED",
  "SENDING",
  "STORED",
  "ACCEPTED",
  "DELIVERED",
  "DEFERRED",
  "BOUNCED",
  "COMPLAINED",
  "FAILED",
  "SUPPRESSED",
  "CANCELLED",
] as const;

export type DeliveryState = (typeof DELIVERY_STATES)[number];

const TERMINAL = new Set<DeliveryState>(["STORED", "DELIVERED", "BOUNCED", "COMPLAINED", "FAILED", "SUPPRESSED", "CANCELLED"]);

export function isTerminal(state: string): boolean {
  return TERMINAL.has(state as DeliveryState);
}

/** Minutes to wait after a deferral. Attempt 1 waits 1, then 2, 4, 8, capped at 8. */
export function retryDelayMinutes(attemptNo: number): number {
  const n = Math.max(1, Math.min(4, Math.floor(attemptNo)));
  return 2 ** (n - 1);
}

export function nextState(input: {
  current: DeliveryState;
  attemptNo: number;
  suppressed: boolean;
  provider: "sandbox" | "smtp" | "unconfigured";
  providerResult: "accepted" | "delivered" | "stored" | "deferred" | "bounced" | "complained" | "failed" | "none";
}): { state: DeliveryState; retry: boolean; detail: string } {
  if (isTerminal(input.current) && input.current !== "DEFERRED") {
    return { state: input.current, retry: false, detail: "This message already finished. It was not sent again." };
  }
  if (input.suppressed) {
    return { state: "SUPPRESSED", retry: false, detail: "This address is on the suppression list. Nothing was sent." };
  }
  if (input.provider === "unconfigured") {
    return { state: "FAILED", retry: false, detail: "No mail provider is configured. Nothing was sent." };
  }
  if (input.providerResult === "bounced") return { state: "BOUNCED", retry: false, detail: "The provider reported a bounce." };
  if (input.providerResult === "complained") return { state: "COMPLAINED", retry: false, detail: "The provider reported a complaint." };
  if (input.providerResult === "deferred") {
    if (input.attemptNo >= 5) return { state: "FAILED", retry: false, detail: "The message was deferred five times and then stopped." };
    return { state: "DEFERRED", retry: true, detail: "The provider asked to retry later." };
  }
  if (input.providerResult === "failed") {
    if (input.attemptNo >= 5) return { state: "FAILED", retry: false, detail: "Sending failed five times and then stopped." };
    return { state: "DEFERRED", retry: true, detail: "Sending failed. It will be retried." };
  }
  if (input.providerResult === "delivered") {
    return { state: "DELIVERED", retry: false, detail: "The provider reported delivery." };
  }
  if (input.providerResult === "accepted") {
    return { state: "ACCEPTED", retry: false, detail: "The provider accepted the message. Acceptance is not delivery." };
  }
  if (input.providerResult === "stored") {
    return { state: "STORED", retry: false, detail: "Stored in the workspace mailbox. No outside mail server accepted it." };
  }
  return { state: "QUEUED", retry: false, detail: "The message is still queued." };
}

export function deliveryLabel(state: string): string {
  switch (state) {
    case "STORED":
      return "Stored in this workspace. No outside provider accepted it.";
    case "QUEUED":
      return "Queued. Not sent yet.";
    case "SENDING":
      return "Sending.";
    case "ACCEPTED":
      return "The provider accepted it. Acceptance is not delivery.";
    case "DELIVERED":
      return "The provider reported delivery.";
    case "DEFERRED":
      return "Deferred. It will be retried.";
    case "BOUNCED":
      return "Bounced. The address is suppressed.";
    case "COMPLAINED":
      return "Complaint recorded. The address is suppressed.";
    case "FAILED":
      return "Failed. It was not delivered.";
    case "SUPPRESSED":
      return "Suppressed. Nothing was sent.";
    case "CANCELLED":
      return "Cancelled before send.";
    default:
      return "Unknown delivery state. It is not treated as delivered.";
  }
}

export function classifySandboxAddress(email: string): "deliver" | "bounce" | "defer" | "fail" {
  const host = email.trim().toLowerCase().split("@")[1] ?? "";
  if (host === "bounce.example") return "bounce";
  if (host === "defer.example") return "defer";
  if (host === "fail.example") return "fail";
  return "deliver";
}

export function renderTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_all, key: string) => {
    const value = tokens[key.toLowerCase()];
    return value == null ? "" : value.slice(0, 200);
  });
}

/** Drop a trailing quoted reply. Keeps the candidate's own lines above the quote. */
export function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (/^On .+wrote:\s*$/i.test(line.trim())) break;
    if (line.trim().startsWith(">")) break;
    if (/^-{2,}\s*original message\s*-{2,}$/i.test(line.trim())) break;
    kept.push(line);
  }
  return kept.join("\n").trim();
}

export function webhookFresh(nowMs: number, timestampSec: number, skewSec = 300): boolean {
  if (!Number.isFinite(timestampSec)) return false;
  return Math.abs(nowMs / 1000 - timestampSec) <= skewSec;
}
