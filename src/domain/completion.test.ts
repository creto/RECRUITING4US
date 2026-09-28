import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { bindQuery, runExclusive } from "./exclusive.ts";
import { signBody, webhookVerdict } from "./completion.ts";

describe("webhooks and transactions", () => {
  it("rejects unsigned, mismatched, and replayed webhook bodies", () => {
    const expected = signBody("top-secret", "{\"event\":\"ping\"}");
    assert.equal(webhookVerdict({ signature: null, expected, seen: false }), "unsigned");
    assert.equal(webhookVerdict({ signature: "00", expected, seen: false }), "mismatch");
    assert.equal(webhookVerdict({ signature: expected, expected, seen: true }), "replay");
    assert.equal(webhookVerdict({ signature: expected, expected, seen: false }), "accept");
    assert.notEqual(signBody("top-secret", "{\"event\":\"ping\"}"), signBody("other", "{\"event\":\"ping\"}"));
  });

  it("rolls back a domain write and its outbox row together", async () => {
    const pg = new PGlite();
    await pg.waitReady;
    await pg.exec(`
      create table applications (id text primary key, stage text);
      create table outbox_events (id text primary key, application_id text);
    `);
    const raw = async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows;
    await assert.rejects(
      runExclusive(async () => {
        await raw("BEGIN");
        try {
          await bindQuery(raw, async () => {
            const query = raw;
            await query("insert into applications (id, stage) values ('app-1', 'screen')");
            await query("insert into outbox_events (id, application_id) values ('evt-1', 'app-1')");
            throw new Error("boom");
          });
          await raw("COMMIT");
        } catch (error) {
          await raw("ROLLBACK");
          throw error;
        }
      }),
    );
    const apps = await pg.query("select id from applications");
    const events = await pg.query("select id from outbox_events");
    assert.equal(apps.rows.length, 0);
    assert.equal(events.rows.length, 0);
    await runExclusive(async () => {
      await raw("BEGIN");
      await bindQuery(raw, async () => {
        await raw("insert into applications (id, stage) values ('app-2', 'screen')");
        await raw("insert into outbox_events (id, application_id) values ('evt-2', 'app-2')");
      });
      await raw("COMMIT");
    });
    assert.equal((await pg.query("select id from applications")).rows.length, 1);
  });
});
