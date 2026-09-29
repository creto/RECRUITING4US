# Operations

The app starts with `npm run dev`, which loads environment from the platform wrapper. SQL files in `migrations/` apply on the embedded database at startup, including `0004_completion.sql`. When `DATABASE_URL` is set, `npm run db:migrate` applies the same files. A new SQL file is picked up by a process restart, not by an already-open database.

## Dispatch

Outbox rows are leased (`lease_until`, `attempts`, `FOR UPDATE SKIP LOCKED`) inside the web process after domain writes and on workspace maintenance, then applied with workflow receipts. Queries are serialized so the single preview connection does not interleave that transaction. This is not Redis and not BullMQ.

When `DATABASE_URL` points at shared Postgres, `npm run outbox:worker` runs a long-lived Node process that discovers companies with pending outbox rows or due `message_intents` (`app_companies_needing_drain`) and drains them with the same helpers as the web path (`drain` / `drainMail`). Keep the web-path drain for low latency; the worker covers idle tenants. Without `DATABASE_URL` the worker exits: preview data lives in the web process and is not visible to a second process. Use the same `MAIL_SMTP_*` / `MAIL_FROM` values as the web app when the worker should send mail.

## Health

`/api/health/live` and `/api/health/ready` (`select 1`).

## Recovery

- A leased row becomes eligible again after two minutes if it is still `PENDING`.
- After five attempts a failure can be marked `FAILED` instead of looping forever.
- Mail `CAPTURED` was never given to an outside provider. `UNKNOWN` means the outcome is not known; do not announce success.
- Code submissions stay in the snapshot. There is no runner to retry.
- Anonymize removes that company's profile and files. A restored backup can bring the person back. This does not erase backups. The dump and restore steps are in `docs/RUNBOOK.md`. Deploy variable names are in `docs/DEPLOY.md` and `.env.example`.
- Do not add a `.env` file here. Do not put answer keys or the seed sentinel in client code.

## Line count

`node scripts/measure-loc.mjs`
