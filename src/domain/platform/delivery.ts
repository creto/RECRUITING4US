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
      return "Bounced. The provider rejected delivery.";
    case "COMPLAINED":
      return "Complaint recorded. Delivery was stopped for this message.";
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

export type MailMark = "both" | "logo" | "name";

export function mailMark(value: string | undefined): MailMark {
  return value === "logo" || value === "name" ? value : "both";
}

export type MailBrand = {
  companyName: string;
  fromName: string;
  footer: string;
  logoUrl: string;
  accent: string;
  /** Absolute https URL of the product mark. Empty keeps the text footer only. */
  markUrl?: string;
  /** both shows the logo and the name. logo or name hides the other when a logo exists. */
  mark?: MailMark;
  hasLogo?: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

const MAIL_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function accentColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#cefa90";
}

function inkOn(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return light > 0.62 ? "#14221b" : "#ffffff";
}

/** https, or http only on localhost. Anything else stays plain text. */
export function safeMailUrl(value: string): string | null {
  const text = value.trim().replace(/[.,);]+$/, "");
  if (!/^https?:\/\/[^\s<>"']+$/.test(text)) return null;
  try {
    const url = new URL(text);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return url.toString();
    return null;
  } catch {
    return null;
  }
}

function mailLinkLabel(url: string): string {
  if (url.includes("/assess/")) return "Open your assessment";
  if (url.includes("/code/")) return "Open the coding exercise";
  if (url.includes("/portal")) return "Open your applicant portal";
  if (url.includes("/candidate/offers/")) return "Review the offer";
  if (url.includes("/candidate/")) return "Open your application";
  return "Open this link";
}

function mailButton(url: string): string {
  const href = escapeHtml(url);
  const label = escapeHtml(mailLinkLabel(url));
  return `<a href="${href}" style="display:inline-block;background:#14221b;color:#cefa90;font-family:${MAIL_FONT};font-size:15px;font-weight:700;line-height:1.2;text-decoration:none;padding:12px 18px;border-radius:999px">${label}</a><br /><a href="${href}" style="color:#146c43;font-family:${MAIL_FONT};font-size:12px;line-height:1.4;word-break:break-all">${href}</a>`;
}

function linkifyRaw(line: string): string {
  const parts = line.split(/(https?:\/\/[^\s]+)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 0) return escapeHtml(part);
      let url = part;
      let tail = "";
      while (/[.,);]$/.test(url)) {
        tail = url.slice(-1) + tail;
        url = url.slice(0, -1);
      }
      const safe = safeMailUrl(url);
      if (!safe) return escapeHtml(part);
      const href = escapeHtml(safe);
      return `<a href="${href}" style="color:#146c43;font-family:${MAIL_FONT};font-weight:700;text-decoration:underline">${href}</a>${escapeHtml(tail)}`;
    })
    .join("");
}

function linkifyEscaped(text: string): string {
  return text.replace(/https?:\/\/[^\s<]+/g, (raw) => {
    let url = raw;
    let tail = "";
    while (/[.,);]$/.test(url)) {
      tail = url.slice(-1) + tail;
      url = url.slice(0, -1);
    }
    const safe = safeMailUrl(url.replace(/\u0026amp;/g, "\u0026"));
    if (!safe) return raw;
    const href = escapeHtml(safe);
    return `<a href="${href}" style="color:#146c43;font-family:${MAIL_FONT};font-weight:700;text-decoration:underline">${href}</a>${tail}`;
  });
}

function plainMessageHtml(body: string): string {
  return body
    .trim()
    .split("\n")
    .map((line) => {
      if (line.trim() === "") return "<br />";
      const only = !/\s/.test(line.trim()) ? safeMailUrl(line.trim()) : null;
      if (only) return `<p style="margin:16px 0 12px">${mailButton(only)}</p>`;
      return `<p style="margin:0 0 12px;font-family:${MAIL_FONT};font-size:16px;line-height:1.55;color:#14221b">${linkifyRaw(line)}</p>`;
    })
    .join("");
}

function richMessageHtml(body: string): string {
  const linked = body.trim().replace(/>([^<]+)</g, (full, text: string) => {
    if (safeMailUrl(text.trim()) && !/\s/.test(text.trim().replace(/[.,);]+$/, ""))) {
      return `>${mailButton(safeMailUrl(text.trim())!)}<`;
    }
    if (!/https?:\/\//.test(text)) return full;
    return `>${linkifyEscaped(text)}<`;
  });
  return linked.replace(/<a\b(?![^>]*\bstyle=)([^>]*)>/gi, `<a$1 style="color:#146c43;font-family:${MAIL_FONT};font-weight:700;text-decoration:underline">`);
}

/** Plain copy the mailbox stores: company name, the message, then the footer. */
export function brandPlain(body: string, brand: MailBrand): string {
  const name = (brand.fromName || brand.companyName).trim();
  const showName = mailMark(brand.mark) !== "logo" || !brand.hasLogo;
  const footer = brand.footer.trim();
  const head = showName && name ? `${name}\n\n` : "";
  const foot = footer ? `\n\n${footer}` : "";
  return `${head}${body.trim()}${foot}\n\nPowered by RECRUIT4US`.trim();
}

/** HTML the provider receives. Same card as the apply form, in a sans-serif with the company color. */
export function brandHtml(body: string, brand: MailBrand, logoCid: boolean, rich = false): string {
  const accent = accentColor(brand.accent);
  const headerInk = inkOn(accent);
  const name = escapeHtml((brand.fromName || brand.companyName).trim() || "Message");
  const mode = mailMark(brand.mark);
  const logo = mode === "name"
    ? ""
    : logoCid
      ? `<img src="cid:logo@recruit4us" alt="" width="120" style="display:block;max-width:120px;height:auto;margin:0 0 12px" />`
      : /^https:\/\//i.test(brand.logoUrl)
        ? `<img src="${escapeHtml(brand.logoUrl)}" alt="" width="120" style="display:block;max-width:120px;height:auto;margin:0 0 12px" />`
        : "";
  const showName = mode !== "logo" || !logo;
  const title = showName
    ? `<p style="margin:0;font-family:${MAIL_FONT};font-size:24px;line-height:1.2;font-weight:700;color:${headerInk}">${name}</p>`
    : "";
  const message = rich ? richMessageHtml(body) : plainMessageHtml(body);
  const footer = brand.footer.trim()
    ? `<p style="margin:16px 0 0;color:#5c6b63;font-family:${MAIL_FONT};font-size:13px;line-height:1.45">${escapeHtml(brand.footer.trim())}</p>`
    : "";
  const mark = /^https:\/\//i.test(brand.markUrl ?? "")
    ? `<img src="${escapeHtml(brand.markUrl ?? "")}" alt="" width="72" height="40" style="display:block;width:72px;height:auto;border:0" />`
    : "";
  const powered = `<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:${MAIL_FONT}"><tr><td style="vertical-align:middle">${mark}</td><td style="vertical-align:middle;padding-left:${mark ? "12px" : "0"};font-family:${MAIL_FONT};font-size:12px;line-height:1.4;color:#5c6b63">Powered by <strong style="color:#14221b">RECRUIT4US</strong></td></tr></table>`;
  return `<!DOCTYPE html><html><body style="margin:0;background:#e7eee9;color:#14221b;font-family:${MAIL_FONT}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e7eee9;font-family:${MAIL_FONT}"><tr><td align="center" style="padding:32px 16px;font-family:${MAIL_FONT}"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #d7e1da;border-radius:24px;font-family:${MAIL_FONT}"><tr><td style="height:8px;background:${accent};border-radius:24px 24px 0 0;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="padding:22px 22px 8px;background:${accent};font-family:${MAIL_FONT};color:${headerInk}">${logo}${title}</td></tr><tr><td style="padding:18px 22px 8px;font-family:${MAIL_FONT}"><p style="margin:0 0 8px;font-family:${MAIL_FONT};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#3d5c16">Message</p><div style="border:1px solid #d7e1da;border-radius:12px;background:#f7faf8;padding:14px 16px;font-family:${MAIL_FONT};font-size:16px;line-height:1.55;color:#14221b">${message}</div>${footer}</td></tr><tr><td style="padding:16px 22px 18px;border-top:1px solid #d7e1da;background:#f7faf8;font-family:${MAIL_FONT}">${powered}</td></tr><tr><td style="height:8px;background:${accent};border-radius:0 0 24px 24px;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr></table></body></html>`;
}
