import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginPathWithNext, safeNextPath } from "./post-login-next.ts";

describe("post-login next", () => {
  it("allows assess and candidate attempt return paths", () => {
    const token = "f8b56d7e-10c5-4a23-9b5c-7325de134bf0";
    assert.equal(safeNextPath(`/assess/${token}`), `/assess/${token}`);
    assert.equal(safeNextPath(`/candidate/attempts/attempt-1`), `/candidate/attempts/attempt-1`);
    assert.equal(loginPathWithNext(`/assess/${token}`), `/login?next=${encodeURIComponent(`/assess/${token}`)}`);
  });

  it("blocks open redirects and login loops", () => {
    assert.equal(safeNextPath("https://evil.example/"), "/app");
    assert.equal(safeNextPath("//evil.example"), "/app");
    assert.equal(safeNextPath("/login?next=/app"), "/app");
    assert.equal(safeNextPath(null), "/app");
  });
});
