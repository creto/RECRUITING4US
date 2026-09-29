import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ERROR_BUFFER_LIMIT, redactMessage, rememberError, type ObservedError } from "./observe.ts";

describe("observe", () => {
  it("redacts secrets and keeps a short message", () => {
    const text = redactMessage(
      "Failed for ada@example.com Bearer abc.def password=hunter2 https://abc@o123.ingest.sentry.io/99 extra",
    );
    assert.equal(text.includes("ada@example.com"), false);
    assert.equal(text.includes("hunter2"), false);
    assert.equal(text.includes("abc.def"), false);
    assert.match(text, /\[email\]/);
    assert.match(text, /\[dsn\]/);
    assert.match(text, /Bearer \[redacted\]/);
  });

  it("keeps only the newest errors", () => {
    let buffer: ObservedError[] = [];
    for (let index = 0; index < ERROR_BUFFER_LIMIT + 3; index += 1) {
      buffer = rememberError(buffer, {
        id: String(index),
        at: "2026-01-01T00:00:00.000Z",
        source: "manual",
        name: "Error",
        message: String(index),
      });
    }
    assert.equal(buffer.length, ERROR_BUFFER_LIMIT);
    assert.equal(buffer[0]?.message, "3");
    assert.equal(buffer.at(-1)?.message, String(ERROR_BUFFER_LIMIT + 2));
  });
});
