import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorizationHeader, encodeLocator, objectHttpRequest, parseLocator, readObjectStoreEnv } from "./object-store.ts";

describe("object storage", () => {
  it("keeps files in the database when the bucket is missing", () => {
    const plan = readObjectStoreEnv({});
    assert.equal(plan.configured, false);
    if (!plan.configured) assert.match(plan.reason, /database/);
  });

  it("builds an R2 path-style request and an S3 virtual-host request", () => {
    const r2 = readObjectStoreEnv({
      OBJECT_STORE_PROVIDER: "r2",
      OBJECT_STORE_BUCKET: "resumes",
      OBJECT_STORE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
      OBJECT_STORE_ACCESS_KEY_ID: "key",
      OBJECT_STORE_SECRET_ACCESS_KEY: "secret",
    });
    assert.equal(r2.configured, true);
    if (!r2.configured) return;
    const put = objectHttpRequest({
      method: "PUT",
      config: r2.config,
      key: "company/file",
      body: new TextEncoder().encode("cv"),
      contentType: "application/pdf",
      now: new Date("2026-01-02T03:04:05.000Z"),
    });
    assert.equal(put.url, "https://account.r2.cloudflarestorage.com/resumes/company/file");
    assert.match(put.headers.authorization, /^AWS4-HMAC-SHA256 /);
    assert.equal(r2.config.region, "auto");

    const s3 = readObjectStoreEnv({
      OBJECT_STORE_BUCKET: "resumes",
      OBJECT_STORE_REGION: "us-east-1",
      OBJECT_STORE_ACCESS_KEY_ID: "key",
      OBJECT_STORE_SECRET_ACCESS_KEY: "secret",
    });
    assert.equal(s3.configured, true);
    if (!s3.configured) return;
    const get = objectHttpRequest({
      method: "GET",
      config: s3.config,
      key: "company/file",
      now: new Date("2026-01-02T03:04:05.000Z"),
    });
    assert.equal(get.url, "https://resumes.s3.us-east-1.amazonaws.com/company/file");
  });

  it("matches the published AWS signature for the sample GET", () => {
    const hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const header = authorizationHeader({
      method: "GET",
      path: "/test.txt",
      headers: {
        host: "examplebucket.s3.amazonaws.com",
        range: "bytes=0-9",
        "x-amz-content-sha256": hash,
        "x-amz-date": "20130524T000000Z",
      },
      payloadHash: hash,
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      region: "us-east-1",
      amzDate: "20130524T000000Z",
    });
    assert.match(header, /Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41$/);
  });

  it("round-trips a locator and refuses a path escape", () => {
    const locator = encodeLocator({ provider: "r2", bucket: "resumes", key: "co/file" });
    assert.deepEqual(parseLocator(locator), { provider: "r2", bucket: "resumes", key: "co/file" });
    assert.equal(parseLocator("plain-base64"), null);
    const bad = encodeLocator({ provider: "s3", bucket: "resumes", key: "../secret" });
    assert.equal(parseLocator(bad), null);
  });
});
