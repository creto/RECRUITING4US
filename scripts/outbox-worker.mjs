#!/usr/bin/env node
/**
 * Separate outbox process.
 *
 * The durable record is the PostgreSQL outbox_events row, leased by the web
 * process (see src/server/talent/workflows.server.ts). This file is not a Redis
 * or BullMQ worker. Preview data lives in the web process memory, so a second
 * process cannot see it and must not pretend that it drained those events.
 */
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.log(
    "[outbox-worker] No shared DATABASE_URL. Dispatch stays in the web process, which leases outbox rows in its own database. Redis is not configured. This process did not mark any event processed.",
  );
  process.exit(0);
}

const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString: url });
try {
  const pending = await pool.query("select app_pending_outbox_count() as n");
  console.log(
    `[outbox-worker] Shared database has ${pending.rows[0]?.n ?? 0} pending outbox rows. Rule execution stays in the web process so a second process cannot apply an action without the application receipts. Nothing was marked processed.`,
  );
} finally {
  await pool.end();
}
