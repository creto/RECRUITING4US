import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { bindRequestTenant, currentTenant, type TenantScope } from "../../lib/tenant.ts";
import { setTestSql } from "./db.server.ts";
import {
  getPortalApplication,
  openApplicationPortal,
  requestPortalOtp,
  verifyPortalOtp,
} from "./portal.server.ts";
import { verifyPortalAccess } from "../../domain/application-portal-access.ts";

type Sql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

function restrictedSql(pg: PGlite): Sql {
  const run = async <T>(text: string, params: unknown[]): Promise<T[]> => {
    await pg.query("begin");
    try {
      await pg.query("set local role app_user");
      const tenant = currentTenant();
      await pg.query(
        "select set_config('app.company_id', $1, true), set_config('app.user_id', $2, true), set_config('app.public_slug', $3, true)",
        [tenant?.companyId ?? "", tenant?.userId ?? "", tenant?.publicSlug ?? ""],
      );
      const result = await pg.query<T>(text, params);
      await pg.query("commit");
      return result.rows;
    } catch (error) {
      await pg.query("rollback");
      throw error;
    }
  };
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ""}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = (text, params = []) => run(text, params);
  return sql;
}

async function boot() {
  let scope: TenantScope | undefined;
  bindRequestTenant(
    () => scope,
    (next) => {
      scope = next;
    },
  );
  const pg = new PGlite();
  await pg.waitReady;
  const dir = fileURLToPath(new URL("../../../migrations/", import.meta.url));
  const names = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of names) {
    await pg.exec(await readFile(new URL(`../../../migrations/${name}`, import.meta.url), "utf8"));
  }
  await pg.exec(`
    insert into "user" (id, name, email, "emailVerified") values
      ('owner-a', 'Owner A', 'owner-a@example.com', true);
    insert into companies (id, name, slug, created_by, timezone) values
      ('co-a', 'Northstar', 'northstar', 'owner-a', 'UTC'),
      ('co-b', 'Harbor', 'harbor', 'owner-a', 'UTC');
    insert into memberships (id, company_id, user_id, role) values
      ('mem-a', 'co-a', 'owner-a', 'OWNER'),
      ('mem-b', 'co-b', 'owner-a', 'OWNER');
    insert into jobs (id, company_id, title, slug, work_arrangement, employment_type, status) values
      ('job-a', 'co-a', 'Platform Engineer', 'platform', 'REMOTE', 'FULL_TIME', 'PUBLISHED'),
      ('job-b', 'co-b', 'Harbor Analyst', 'analyst', 'HYBRID', 'FULL_TIME', 'PUBLISHED');
    insert into pipeline_stages (id, company_id, job_id, name, category, position) values
      ('st-a', 'co-a', 'job-a', 'Screen', 'SCREEN', 1),
      ('st-b', 'co-b', 'job-b', 'Screen', 'SCREEN', 1);
    insert into candidates (id, company_id, name, email, email_normalized, source) values
      ('cand-a', 'co-a', 'Ada Lovelace', 'ada@example.com', 'ada@example.com', 'CAREERS'),
      ('cand-b', 'co-b', 'Ada Lovelace', 'ada@example.com', 'ada@example.com', 'CAREERS'),
      ('cand-c', 'co-a', 'Other Person', 'other@example.com', 'other@example.com', 'CAREERS');
    insert into applications (
      id, company_id, job_id, candidate_id, current_stage_id, lifecycle, source, version
    ) values
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'co-a', 'job-a', 'cand-a', 'st-a', 'ACTIVE', 'CAREERS', 1),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'co-b', 'job-b', 'cand-b', 'st-b', 'ACTIVE', 'CAREERS', 1),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'co-a', 'job-a', 'cand-c', 'st-a', 'ACTIVE', 'CAREERS', 1);
  `);
  setTestSql(restrictedSql(pg));
  return pg;
}

async function latestOtpCode(pg: PGlite, companyId: string): Promise<string> {
  // Prefer sandbox mailbox body (queued + drained by queueSystemMail).
  const boxed = await pg.query<{ body: string }>(
    `select body from sandbox_mailbox where company_id = $1 order by created_at desc limit 5`,
    [companyId],
  );
  for (const row of boxed.rows) {
    const match = row.body.match(/\b(\d{6})\b/);
    if (match) return match[1]!;
  }
  const intents = await pg.query<{ body: string }>(
    `select body from message_intents where company_id = $1 and kind = 'PORTAL_OTP' order by created_at desc limit 5`,
    [companyId],
  );
  for (const row of intents.rows) {
    const match = row.body.match(/\b(\d{6})\b/);
    if (match) return match[1]!;
  }
  throw new Error("OTP mail body not found");
}

describe("portal otp unlock", () => {
  it("keeps email+UUID unlock and scopes OTP apps per company", async () => {
    const pg = await boot();
    try {
      const uuidUnlock = await openApplicationPortal({
        email: "ada@example.com",
        applicationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
      });
      assert.equal(uuidUnlock.applicationId, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");
      assert.equal(
        verifyPortalAccess(uuidUnlock.accessToken, uuidUnlock.applicationId, process.env.BETTER_AUTH_SECRET ?? "recruit4us-dev-assess-access").ok,
        true,
      );

      const shell = await getPortalApplication(uuidUnlock.applicationId, uuidUnlock.accessToken);
      assert.equal(shell.application.id, uuidUnlock.applicationId);
      assert.equal(shell.application.company_name, "Northstar");
      assert.ok(Array.isArray(shell.application.steps));
      assert.ok(Array.isArray(shell.assignments));
      assert.ok(Array.isArray(shell.interviews));
      assert.ok(Array.isArray(shell.offers));
      assert.ok(Array.isArray(shell.messages));

      await assert.rejects(
        () =>
          openApplicationPortal({
            email: "ada@example.com",
            applicationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
          }),
        /do not match/i,
      );

      const pick = await requestPortalOtp({ email: "ada@example.com" });
      assert.equal(pick.status, "pick_company");
      if (pick.status !== "pick_company") throw new Error("expected pick_company");
      assert.deepEqual(
        pick.companies.map((c) => c.slug).sort(),
        ["harbor", "northstar"],
      );

      const sent = await requestPortalOtp({ email: "ada@example.com", companySlug: "northstar" });
      assert.equal(sent.status, "code_sent");
      const code = await latestOtpCode(pg, "co-a");
      const unlocked = await verifyPortalOtp({
        email: "ada@example.com",
        code,
        companySlug: "northstar",
      });
      assert.equal(unlocked.companySlug, "northstar");
      assert.equal(unlocked.applications.length, 1);
      assert.equal(unlocked.applications[0]?.id, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");
      assert.equal(
        unlocked.applications.some((app) => app.id.startsWith("bbbb")),
        false,
        "harbor application must not leak into northstar OTP unlock",
      );

      const unknown = await requestPortalOtp({ email: "nobody@example.com" });
      assert.equal(unknown.status, "code_sent");
    } finally {
      setTestSql(null);
      await pg.close();
    }
  });
});
