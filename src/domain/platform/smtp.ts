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
  if (code === 550 || code === 551 || code === 552 || code === 553) return "bounced";
  return "failed";
}

export function buildRfc822(input: { from: string; to: string; cc: string; subject: string; body: string; messageId: string }): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    input.cc.trim() ? `Cc: ${input.cc.trim()}` : "",
    `Subject: ${input.subject.replace(/[\r\n]/g, " ").slice(0, 200)}`,
    `Message-ID: <${input.messageId}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
  ].filter(Boolean);
  const body = input.body.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
  return `${headers.join("\r\n")}\r\n\r\n${body}\r\n`;
}

export function redactSecrets(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret.length < 4) continue;
    out = out.split(secret).join("[redacted]");
  }
  return out.slice(0, 300);
}
