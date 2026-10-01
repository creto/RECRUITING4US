import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  accessTokenSecret,
  resetPreviewAccessSecretForTests,
} from "./access-token-secret.server.ts";

describe("accessTokenSecret fail-closed", () => {
  const prevSecret = process.env.BETTER_AUTH_SECRET;
  const prevDb = process.env.DATABASE_URL;

  beforeEach(() => {
    resetPreviewAccessSecretForTests();
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    resetPreviewAccessSecretForTests();
    if (prevSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = prevSecret;
    if (prevDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDb;
  });

  it("uses configured BETTER_AUTH_SECRET", () => {
    process.env.BETTER_AUTH_SECRET = "unit-test-secret-value";
    assert.equal(accessTokenSecret(), "unit-test-secret-value");
  });

  it("fails closed when DATABASE_URL is set and secret is missing", () => {
    process.env.DATABASE_URL = "postgres://localhost/recruit4us";
    assert.throws(() => accessTokenSecret("Portal"), /BETTER_AUTH_SECRET/);
    assert.throws(() => accessTokenSecret("Assessment"), /BETTER_AUTH_SECRET/);
  });

  it("never returns the forgeable recruit4us-dev-assess-access literal", () => {
    const a = accessTokenSecret();
    const b = accessTokenSecret();
    assert.notEqual(a, "recruit4us-dev-assess-access");
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{64}$/);
  });
});
