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

export type MailFile = { filename: string; mime: string; base64: string };

const MAIL_FILE_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAIL_FILE_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
  csv: "text/csv",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** At most three readable office or image files, 700 KB each, 1.5 MB together. */
export function normalizeMailFiles(files: { filename: string; mime: string; base64: string }[] | undefined): MailFile[] {
  const list = files ?? [];
  if (list.length > 3) throw new Error("Attach at most 3 files.");
  let total = 0;
  return list.map((file) => {
    const filename = safeMailFilename(file.filename);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const hinted = MAIL_FILE_EXT[ext] ?? "";
    const mime = MAIL_FILE_MIMES.has(file.mime) ? file.mime : hinted;
    if (!MAIL_FILE_MIMES.has(mime)) throw new Error(`${filename} must be a PDF, PNG, JPEG, text, CSV, or Word file.`);
    const base64 = file.base64.replace(/\s+/g, "");
    if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error(`${filename} could not be read.`);
    const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    if (bytes < 1) throw new Error(`${filename} is empty.`);
    if (bytes > 700_000) throw new Error(`${filename} is over 700 KB.`);
    total += bytes;
    if (total > 1_500_000) throw new Error("Attachments together are over 1.5 MB.");
    return { filename, mime, base64 };
  });
}

function safeMailFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const clean = base.replace(/[^\w.\- ]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
  return clean || "file";
}

function wrapBase64(value: string): string {
  return value.replace(/\s+/g, "").replace(/(.{76})/g, "$1\r\n");
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
  files?: MailFile[];
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
  const part = explicit
    ? rfcPart(token, encodeBody(input.body), encodeBody(explicit), input.logo)
    : looksLikeHtml(prepareMailBody(input.body))
      ? (() => {
          const prepared = prepareMailBody(input.body);
          const plain = htmlToPlain(prepared) || " ";
          const htmlDoc = `<!DOCTYPE html><html><body style="font-family:system-ui,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#14221b">${prepared}</body></html>`;
          return rfcPart(token, encodeBody(plain), encodeBody(htmlDoc), input.logo);
        })()
      : { typeHeader: "Content-Type: text/plain; charset=utf-8", body: `${encodeBody(prepareMailBody(input.body))}\r\n` };
  const files = input.files ?? [];
  if (files.length === 0) {
    headers.push(part.typeHeader);
    return `${headers.join("\r\n")}\r\n\r\n${part.body}`;
  }
  const mix = `mix_${token}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${mix}"`);
  const blocks = [`--${mix}`, part.typeHeader, "", part.body.replace(/\s+$/, "")];
  for (const file of files) {
    const name = file.filename.replace(/[\r\n"]/g, "");
    blocks.push(
      `--${mix}`,
      `Content-Type: ${file.mime}; name="${name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${name}"`,
      "",
      wrapBase64(file.base64),
    );
  }
  blocks.push(`--${mix}--`, "");
  return `${headers.join("\r\n")}\r\n\r\n${blocks.join("\r\n")}`;
}

function rfcPart(
  token: string,
  plain: string,
  html: string,
  logo?: { mime: string; base64: string } | null,
): { typeHeader: string; body: string } {
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
    return { typeHeader: `Content-Type: multipart/alternative; boundary="${alt}"`, body: alternative };
  }
  const rel = `rel_${token}`;
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
    wrapBase64(logo.base64),
    `--${rel}--`,
    "",
  ].join("\r\n");
  return { typeHeader: `Content-Type: multipart/related; boundary="${rel}"; type="multipart/alternative"`, body: related };
}

export function redactSecrets(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret.length < 4) continue;
    out = out.split(secret).join("[redacted]");
  }
  return out.slice(0, 300);
}
