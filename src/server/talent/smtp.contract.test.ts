import assert from "node:assert/strict";
import net from "node:net";
import { describe, it } from "node:test";
import { normalizeMailFrom, sendSmtp } from "./smtp.server.ts";
import { interpretBoardResponse, parseOAuthToken } from "../../domain/platform/adapters.ts";
import { postForm, postJson } from "./outbound.server.ts";

function listen(): Promise<{ port: number; server: net.Server }> {
  return new Promise((resolve) => {
    const server = net.createServer((socket) => {
      socket.write("220 local\r\n");
      let mode: "line" | "data" = "line";
      let buffer = "";
      const pump = () => {
        if (mode === "data") {
          if (!buffer.includes("\r\n.\r\n")) return;
          socket.write("250 queued\r\n");
          buffer = "";
          mode = "line";
        }
        while (mode === "line" && buffer.includes("\r\n")) {
          const index = buffer.indexOf("\r\n");
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          if (line.startsWith("EHLO") || line.startsWith("HELO")) socket.write("250 local\r\n");
          else if (line.startsWith("MAIL FROM")) socket.write("250 ok\r\n");
          else if (line.startsWith("RCPT TO:<bounce@")) socket.write("550 no such user\r\n");
          else if (line.startsWith("RCPT TO:")) socket.write("250 ok\r\n");
          else if (line.startsWith("DATA")) {
            socket.write("354 go\r\n");
            mode = "data";
            pump();
            return;
          } else if (line.startsWith("QUIT")) socket.end("221 bye\r\n");
        }
      };
      socket.on("data", (chunk) => {
        buffer += chunk.toString();
        pump();
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ port, server });
    });
  });
}

describe("smtp contract", () => {
  it("accepts a message without calling it delivered, and records a bounce", async () => {
    const { port, server } = await listen();
    const accepted = await sendSmtp(
      { host: "127.0.0.1", port, user: "", password: "", from: "jobs@example.com", secure: false },
      { to: ["ada@example.com"], cc: "", subject: "Hello", body: "Body", messageId: "m1@recruit4us" },
    );
    assert.equal(accepted.result, "accepted");
    assert.match(accepted.detail, /not delivery/i);
    const bounced = await sendSmtp(
      { host: "127.0.0.1", port, user: "", password: "", from: "jobs@example.com", secure: false },
      { to: ["bounce@example.com"], cc: "", subject: "Hello", body: "Body", messageId: "m2@recruit4us" },
    );
    assert.equal(bounced.result, "failed");
    await new Promise((resolve) => server.close(resolve));
  });
});


describe("normalizeMailFrom", () => {
  it("extracts bare email from display-name angle brackets", () => {
    assert.equal(
      normalizeMailFrom("RECRUIT4US <noreply@recruit.tiglobal.com.co>"),
      "noreply@recruit.tiglobal.com.co",
    );
  });

  it("lowercases and strips stray outer brackets", () => {
    assert.equal(normalizeMailFrom("<Jobs@Example.COM>"), "jobs@example.com");
  });

  it("returns bare address unchanged aside from case", () => {
    assert.equal(normalizeMailFrom("noreply@recruit.tiglobal.com.co"), "noreply@recruit.tiglobal.com.co");
  });

  it("returns empty for blank input", () => {
    assert.equal(normalizeMailFrom("   "), "");
  });
});

describe("provider contract", () => {
  it("posts to a local board and does not treat a failure as published", async () => {
    process.env.OUTBOUND_ALLOW_LOOPBACK = "1";
    const server = net.createServer((socket) => {
      let buf = "";
      let sent = false;
      socket.on("data", (chunk) => {
        if (sent) return;
        buf += chunk.toString();
        if (!buf.includes("\r\n\r\n")) return;
        sent = true;
        const fail = buf.includes("fail");
        const body = fail ? "{\"error\":\"no\"}" : "{\"id\":\"ext-1\"}";
        socket.end(`HTTP/1.1 ${fail ? "422" : "200"} ${fail ? "Unprocessable" : "OK"}\r\ncontent-type: application/json\r\ncontent-length: ${Buffer.byteLength(body)}\r\nconnection: close\r\n\r\n${body}`);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const ok = await postJson(`http://127.0.0.1:${port}/jobs`, "token", { idempotencyKey: "job-1", action: "publish" });
    assert.equal(ok.status, 200);
    assert.equal(interpretBoardResponse(ok.status, ok.body).externalId, "ext-1");
    const bad = await postJson(`http://127.0.0.1:${port}/jobs`, "token", { idempotencyKey: "fail", action: "publish" });
    assert.equal(interpretBoardResponse(bad.status, bad.body).status, "FAILED");
    await new Promise((resolve) => server.close(resolve));
  });

  it("exchanges an OAuth code without treating a refusal as a token", async () => {
    process.env.OUTBOUND_ALLOW_LOOPBACK = "1";
    const server = net.createServer((socket) => {
      let buf = "";
      socket.on("data", (chunk) => {
        buf += chunk.toString();
        if (!buf.includes("\r\n\r\n")) return;
        const refused = buf.includes("bad-code");
        const body = refused ? "{\"error\":\"invalid_grant\"}" : "{\"access_token\":\"ya29\",\"refresh_token\":\"1//refresh\",\"expires_in\":3600}";
        socket.end(`HTTP/1.1 ${refused ? "400" : "200"} OK\r\ncontent-type: application/json\r\ncontent-length: ${Buffer.byteLength(body)}\r\nconnection: close\r\n\r\n${body}`);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const ok = await postForm(`http://127.0.0.1:${port}/token`, "grant_type=authorization_code&code=abc");
    const parsed = parseOAuthToken(ok.status, ok.body);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.refreshToken, "1//refresh");
    const refused = await postForm(`http://127.0.0.1:${port}/token`, "code=bad-code");
    assert.equal(parseOAuthToken(refused.status, refused.body).ok, false);
    await new Promise((resolve) => server.close(resolve));
  });
});
