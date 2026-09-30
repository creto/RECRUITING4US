#!/usr/bin/env node
/**
 * Outbox + mail drain worker (PostgreSQL, not Redis/BullMQ).
 *
 * Leases pending outbox_events with SKIP LOCKED and processes due
 * message_intents using the same server helpers as the web process. Keep the
 * web-path drain for low latency; this process covers idle tenants.
 *
 * Requires Node 22+ (same as `npm test`) so TypeScript server modules load:
 *   npm run outbox:worker
 *   node --experimental-strip-types --import ./scripts/test-alias.mjs scripts/outbox-worker.mjs
 *
 * Env:
 *   DATABASE_URL   required (shared Postgres; preview PGLite is not visible here)
 *   MAIL_SMTP_* / MAIL_FROM / MAIL_INBOUND_SECRET  same as web when sending
 *   OUTBOX_POLL_MS poll interval when idle (default 5000)
 *   OUTBOX_ONCE=1  run one tick and exit (useful for smoke checks)
 */
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.log(
    "[outbox-worker] DATABASE_URL is required. Preview data lives in the web process memory, so this worker cannot see it. Redis is not used. Exiting without draining.",
  );
  process.exit(0);
}

const pollMs = Math.max(1000, Number(process.env.OUTBOX_POLL_MS ?? 5000) || 5000);
const once = process.env.OUTBOX_ONCE === "1" || process.argv.includes("--once");

const { drainDueWork } = await import("../src/server/talent/drain.server.ts");
const { getSql } = await import("../src/lib/db.ts");

let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    console.log(`[outbox-worker] ${signal} received; stopping after this tick.`);
  });
}

console.log(
  `[outbox-worker] Draining outbox_events and due message_intents every ${pollMs}ms. Web-path drain stays for low latency.`,
);

while (!stopping) {
  try {
    const sql = await getSql();
    const pending = await sql`select app_pending_outbox_count() as n`;
    const result = await drainDueWork();
    const pendingAfter = await sql`select app_pending_outbox_count() as n`;
    console.log(
      `[outbox-worker] companies=${result.companies} pending_outbox_before=${pending[0]?.n ?? 0} pending_outbox_after=${pendingAfter[0]?.n ?? 0}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[outbox-worker] tick failed: ${message.slice(0, 240)}`);
  }
  if (once || stopping) break;
  await new Promise((resolve) => setTimeout(resolve, pollMs));
}

process.exit(0);
