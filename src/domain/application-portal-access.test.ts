import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mintPortalAccess, verifyPortalAccess } from "./application-portal-access.ts";

describe("application portal access", () => {
  it("mints and verifies a bound application token", () => {
    const token = mintPortalAccess({
      applicationId: "app-1",
      companyId: "co-1",
      secret: "test-secret",
      ttlSeconds: 60,
    });
    assert.equal(verifyPortalAccess(token, "app-1", "test-secret").ok, true);
    const ok = verifyPortalAccess(token, "app-1", "test-secret");
    assert.equal(ok.ok && ok.companyId, "co-1");
    assert.equal(verifyPortalAccess(token, "app-2", "test-secret").ok, false);
    assert.equal(verifyPortalAccess(token, "app-1", "wrong").ok, false);
  });
});
