import net from "node:net";
import tls from "node:tls";
import { buildRfc822, classifySmtpCode, pullSmtpReplies, redactSecrets, type SmtpReply } from "../../domain/platform/smtp.ts";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  secure: boolean;
};

export function smtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.MAIL_SMTP_HOST?.trim() ?? "";
  const from = process.env.MAIL_FROM?.trim() ?? "";
  if (!host || !from) return null;
  const port = Number(process.env.MAIL_SMTP_PORT ?? 587);
  return {
    host,
    port: Number.isInteger(port) && port > 0 ? port : 587,
    user: process.env.MAIL_SMTP_USER?.trim() ?? "",
    password: process.env.MAIL_SMTP_PASSWORD ?? "",
    from,
    secure: process.env.MAIL_SMTP_SECURE === "1" || Number(process.env.MAIL_SMTP_PORT) === 465,
  };
}

type Session = {
  write: (line: string) => void;
  read: () => Promise<SmtpReply>;
  close: () => void;
  raw: (data: string) => void;
};

function session(socket: net.Socket): Session {
  let buffer = "";
  const queue: SmtpReply[] = [];
  const pending: { resolve: (reply: SmtpReply) => void; reject: (error: Error) => void }[] = [];
  socket.setEncoding("utf8");
  const onData = (chunk: string) => {
    buffer += chunk;
    const pulled = pullSmtpReplies(buffer);
    buffer = pulled.rest;
    for (const reply of pulled.replies) {
      const wait = pending.shift();
      if (wait) wait.resolve(reply);
      else queue.push(reply);
    }
  };
  socket.on("data", onData);
  socket.on("error", (error) => {
    const wait = pending.shift();
    wait?.reject(error instanceof Error ? error : new Error("The mail connection failed."));
  });
  return {
    write(line: string) {
      socket.write(line.endsWith("\r\n") ? line : `${line}\r\n`);
    },
    raw(data: string) {
      socket.write(data);
    },
    read() {
      const queued = queue.shift();
      if (queued) return Promise.resolve(queued);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("The mail server did not answer in time.")), 8000);
        pending.push({
          resolve: (reply) => {
            clearTimeout(timer);
            resolve(reply);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
      });
    },
    close() {
      socket.end();
    },
  };
}

async function ehlo(io: Session): Promise<SmtpReply> {
  io.write("EHLO recruit4us");
  const reply = await io.read();
  if (reply.code !== 250) throw new Error(`EHLO was refused with ${reply.code}.`);
  return reply;
}

async function hello(io: Session): Promise<SmtpReply> {
  const greet = await io.read();
  if (greet.code !== 220) throw new Error(`Mail server greeted with ${greet.code}.`);
  return ehlo(io);
}

async function afterHello(
  io: Session,
  config: SmtpConfig,
  message: {
    to: string[];
    cc: string;
    subject: string;
    body: string;
    messageId: string;
    fromName?: string;
    html?: string;
    logo?: { mime: string; base64: string } | null;
  },
  secrets: string[],
) {
  if (config.user) {
    const token = Buffer.from(`\u0000${config.user}\u0000${config.password}`).toString("base64");
    io.write(`AUTH PLAIN ${token}`);
    const auth = await io.read();
    if (auth.code !== 235) throw new Error(`Authentication was refused with ${auth.code}.`);
  }
  io.write(`MAIL FROM:<${config.from}>`);
  const from = await io.read();
  if (from.code < 200 || from.code >= 300) throw new Error(`MAIL FROM was refused with ${from.code}.`);
  for (const recipient of message.to) {
    io.write(`RCPT TO:<${recipient}>`);
    const rcpt = await io.read();
    const kind = classifySmtpCode(rcpt.code);
    if (kind !== "accepted") {
      io.write("QUIT");
      io.close();
      return { result: kind, detail: redactSecrets(`Recipient refused with ${rcpt.code}.`, secrets) };
    }
  }
  io.write("DATA");
  const data = await io.read();
  if (data.code !== 354) throw new Error(`DATA was refused with ${data.code}.`);
  const raw = buildRfc822({
    from: config.from,
    to: message.to.join(", "),
    cc: message.cc,
    subject: message.subject,
    body: message.body,
    messageId: message.messageId,
    fromName: message.fromName,
    html: message.html,
    logo: message.logo,
  });
  io.raw(`${raw}.\r\n`);
  const accepted = await io.read();
  const kind = classifySmtpCode(accepted.code);
  io.write("QUIT");
  io.close();
  return {
    result: kind === "accepted" ? "accepted" as const : kind,
    detail: redactSecrets(
      kind === "accepted" ? `Provider accepted the message (${accepted.code}). This is not delivery.` : `DATA ended with ${accepted.code}.`,
      secrets,
    ),
  };
}

/**
 * Submits one message over SMTP. A 2xx after DATA means the provider accepted it.
 * Acceptance is not delivery. Delivery, bounce, and complaint come from a signed webhook.
 */
export async function sendSmtp(
  config: SmtpConfig,
  message: {
    to: string[];
    cc: string;
    subject: string;
    body: string;
    messageId: string;
    fromName?: string;
    html?: string;
    logo?: { mime: string; base64: string } | null;
  },
): Promise<{ result: "accepted" | "deferred" | "bounced" | "failed"; detail: string }> {
  const secrets = [config.password, config.user].filter((value) => value.length >= 4);
  try {
    if (config.secure) {
      const socket = tls.connect({ host: config.host, port: config.port, servername: config.host });
      await new Promise<void>((resolve, reject) => {
        socket.once("secureConnect", () => resolve());
        socket.once("error", reject);
      });
      const io = session(socket);
      await hello(io);
      return await afterHello(io, config, message, secrets);
    }
    const socket = net.connect({ host: config.host, port: config.port });
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve());
      socket.once("error", reject);
    });
    const plain = session(socket);
    const greeted = await hello(plain);
    if (/\bSTARTTLS\b/i.test(greeted.text)) {
      plain.write("STARTTLS");
      const ready = await plain.read();
      if (ready.code !== 220) throw new Error(`STARTTLS was refused with ${ready.code}.`);
      socket.removeAllListeners("data");
      socket.removeAllListeners("error");
      const secure = tls.connect({ socket, servername: config.host });
      await new Promise<void>((resolve, reject) => {
        secure.once("secureConnect", () => resolve());
        secure.once("error", reject);
      });
      const upgraded = session(secure);
      await ehlo(upgraded);
      return await afterHello(upgraded, config, message, secrets);
    }
    return await afterHello(plain, config, message, secrets);
  } catch (error) {
    const text = error instanceof Error ? error.message : "SMTP failed.";
    return { result: "failed", detail: redactSecrets(text, secrets) };
  }
}
