import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { bindRequestTenant, currentTenant, type TenantScope } from "../../lib/tenant.ts";
import { setTestSql } from "./db.server.ts";
import { companiesNeedingDrain, drainDueWork } from "./drain.server.ts";

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
    insert into companies (id, name, slug, created_by) values
      ('co-a', 'Northstar', 'northstar', 'owner-a'),
      ('co-idle', 'Idle Co', 'idle-co', 'owner-a');
    insert into memberships (id, company_id, user_id, role) values
      ('mem-owner-a', 'co-a', 'owner-a', 'OWNER');
    insert into outbox_events (id, company_id, event_type, aggregate_id, payload)
    values ('evt-1', 'co-a', 'STAGE_CHANGED', 'app-1', '{"stage":"screen"}'::jsonb);
    insert into message_intents (
      id, company_id, kind, subject, body, to_email, idempotency_key, status, thread_token, scheduled_for
    ) values (
      'mail-1', 'co-a', 'OUTREACH', 'Hello', 'Body', 'ada@example.com', 'key-1', 'QUEUED', 'thread-1', now() - interval '1 minute'
    );
  `);
  setTestSql(restrictedSql(pg));
  return pg;
}

describe("outbox worker drain", () => {
  it("discovers due work across tenants and drains outbox plus mail", async () => {
    const pg = await boot();
    try {
      const needing = await companiesNeedingDrain();
      assert.deepEqual(needing.sort(), ["co-a"]);

      const tick = await drainDueWork();
      assert.equal(tick.companies, 1);

      const events = await pg.query<{ status: string }>("select status from outbox_events where id = 'evt-1'");
      assert.equal(events.rows[0]?.status, "PROCESSED");

      const mail = await pg.query<{ status: string }>("select status from message_intents where id = 'mail-1'");
      assert.equal(mail.rows[0]?.status, "STORED");

      const again = await companiesNeedingDrain();
      assert.deepEqual(again, []);
    } finally {
      setTestSql(null);
    }
  });
});
