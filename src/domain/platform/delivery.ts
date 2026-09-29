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

export type MailApplicationHit = {
  id: string;
  lifecycle: string;
  title: string;
  name: string;
};

/** One clear application, or a list the recruiter can copy an id from. Never guess among several. */
export function chooseMailApplication(rows: MailApplicationHit[]): { id: string } | { error: string } {
  if (rows.length === 0) return { error: "No application matches that name." };
  const active = rows.filter((row) => row.lifecycle === "ACTIVE");
  const pool = active.length === 1 ? active : rows.length === 1 ? rows : active.length > 1 ? active : rows;
  if (pool.length === 1) return { id: pool[0]!.id };
  const shown = pool.slice(0, 8).map((row) => `${row.id} · ${row.title} · ${row.name}`).join("; ");
  const more = pool.length > 8 ? ` (+${pool.length - 8} more)` : "";
  return { error: `More than one application matches that name. Use an application id: ${shown}${more}` };
}

export type MailBrand = {
  companyName: string;
  fromName: string;
  footer: string;
  logoUrl: string;
  accent: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

/** Plain copy the mailbox stores: company name, the message, then the footer. */
export function brandPlain(body: string, brand: MailBrand): string {
  const name = (brand.fromName || brand.companyName).trim();
  const footer = brand.footer.trim();
  const head = name ? `${name}\n\n` : "";
  const foot = footer ? `\n\n${footer}` : "";
  return `${head}${body.trim()}${foot}`.trim();
}

/** HTML the provider receives. Same card as the apply form: name, then the message in a field. */
export function brandHtml(body: string, brand: MailBrand, logoCid: boolean, rich = false): string {
  const name = escapeHtml((brand.fromName || brand.companyName).trim() || "Message");
  const accent = /^#[0-9a-fA-F]{6}$/.test(brand.accent) ? brand.accent : "#14221b";
  const logo = logoCid
    ? `<img src="cid:logo@recruit4us" alt="" width="120" style="display:block;max-width:120px;height:auto;margin:0 0 12px" />`
    : /^https:\/\//i.test(brand.logoUrl)
      ? `<img src="${escapeHtml(brand.logoUrl)}" alt="" width="120" style="display:block;max-width:120px;height:auto;margin:0 0 12px" />`
      : "";
  const paragraphs = rich
    ? body.trim()
    : escapeHtml(body.trim())
        .split("\n")
        .map((line) => (line === "" ? "<br />" : `<p style="margin:0 0 12px">${line}</p>`))
        .join("");
  const footer = brand.footer.trim()
    ? `<p style="margin:16px 0 0;color:#5c6b63;font-size:13px">${escapeHtml(brand.footer.trim())}</p>`
    : "";
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f7f5;color:#14221b;font-family:Figtree,Georgia,serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="560" style="max-width:560px;background:#ffffff;border:1px solid #d7e1da;border-radius:24px"><tr><td style="padding:16px 16px 4px">${logo}<p style="margin:0;font-size:24px;line-height:1.2">${name}</p></td></tr><tr><td style="padding:8px 16px 16px"><p style="margin:0 0 6px;font-size:14px;font-weight:600">Message</p><div style="border:1px solid #d7e1da;border-radius:12px;padding:12px 14px;font-size:16px;line-height:1.5">${paragraphs}</div>${footer}</td></tr><tr><td style="height:8px;background:${accent};border-radius:0 0 24px 24px;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr></table></body></html>`;
}
