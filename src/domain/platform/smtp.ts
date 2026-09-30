import { htmlToPlain, looksLikeHtml, prepareMailBody } from "../mail-html.ts";

export type SmtpReply = { code: number; text: string };

/** Pull complete SMTP replies out of a buffer. A reply ends on a line whose fourth character is a space. */
export function pullSmtpReplies(buffer: string): { replies: SmtpReply[]; rest: string } {
  const lines = buffer.split(/\r?\n/);
  const rest = buffer.endsWith("\n") ? "" : (lines.pop() ?? "");
  const replies: SmtpReply[] = [];
  let code = 0;
  let text: string[] = [];
  for (const line of lines) {
    if (line.length < 4 || !/^\d{3}[ -]/.test(line)) continue;
    code = Number(line.slice(0, 3));
    text.push(line.slice(4));
    if (line[3] === " ") {
      replies.push({ code, text: text.join(" ") });
      text = [];
    }
  }
  if (text.length) {
    return { replies, rest: text.map((line, index) => `${code}${index === text.length - 1 ? " " : "-"}${line}`).join("\r\n") + (rest ? `\r\n${rest}` : "") };
  }
  return { replies, rest };
}

export function classifySmtpCode(code: number): "accepted" | "deferred" | "bounced" | "failed" {
  if (code >= 200 && code < 300) return "accepted";
  if (code >= 400 && code < 500) return "deferred";
  // 5xx at submit time is a send failure, not an address suppression. Bounce/complaint
  // suppressions are only recorded from the Suppress UI (or a signed provider webhook
  // that maps to BOUNCED without auto-writing mail_suppressions).
  if (code === 550 || code === 551 || code === 552 || code === 553) return "failed";
  return "failed";
}

function encodeBody(raw: string): string {
  return raw.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

/** RFC822 message. A caller-supplied HTML document (the company card) wins. Otherwise an HTML body is sanitized and sent as multipart/alternative. */
export function buildRfc822(input: {
  from: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  messageId: string;
  fromName?: string;
  html?: string;
  logo?: { mime: string; base64: string } | null;
}): string {
  const display = (input.fromName ?? "").replace(/[\r\n"]/g, "").trim().slice(0, 80);
  const from = display ? `"${display}" <${input.from}>` : input.from;
  const subject = input.subject.replace(/[\r\n]/g, " ").slice(0, 200);
  const headers = [
    `From: ${from}`,
    `To: ${input.to}`,
    input.cc.trim() ? `Cc: ${input.cc.trim()}` : "",
    `Subject: ${subject}`,
    `Message-ID: <${input.messageId}>`,
    "MIME-Version: 1.0",
  ].filter(Boolean);
  const token = input.messageId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "mail";
  const explicit = (input.html ?? "").trim();
  if (explicit) {
    return finishRfc822(headers, token, encodeBody(input.body), encodeBody(explicit), input.logo);
  }
  const prepared = prepareMailBody(input.body);
  if (looksLikeHtml(prepared)) {
    const plain = htmlToPlain(prepared) || " ";
    const htmlDoc = `<!DOCTYPE html><html><body style="font-family:system-ui,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#14221b">${prepared}</body></html>`;
    return finishRfc822(headers, token, encodeBody(plain), encodeBody(htmlDoc), input.logo);
  }
  headers.push("Content-Type: text/plain; charset=utf-8");
  return `${headers.join("\r\n")}\r\n\r\n${encodeBody(prepared)}\r\n`;
}

function finishRfc822(
  headers: string[],
  token: string,
  plain: string,
  html: string,
  logo?: { mime: string; base64: string } | null,
): string {
  const alt = `alt_${token}`;
  const alternative = [
    `--${alt}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    plain,
    `--${alt}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${alt}--`,
    "",
  ].join("\r\n");
  if (!logo?.base64) {
    headers.push(`Content-Type: multipart/alternative; boundary="${alt}"`);
    return `${headers.join("\r\n")}\r\n\r\n${alternative}`;
  }
  const rel = `rel_${token}`;
  const wrapped = logo.base64.replace(/\s+/g, "").replace(/(.{76})/g, "$1\r\n");
  headers.push(`Content-Type: multipart/related; boundary="${rel}"; type="multipart/alternative"`);
  const related = [
    `--${rel}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    alternative.trimEnd(),
    `--${rel}`,
    `Content-Type: ${logo.mime}`,
    "Content-Transfer-Encoding: base64",
    "Content-ID: <logo@recruit4us>",
    "Content-Disposition: inline; filename=\"logo\"",
    "",
    wrapped,
    `--${rel}--`,
    "",
  ].join("\r\n");
  return `${headers.join("\r\n")}\r\n\r\n${related}`;
}

export function redactSecrets(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret.length < 4) continue;
    out = out.split(secret).join("[redacted]");
  }
  return out.slice(0, 300);
}
