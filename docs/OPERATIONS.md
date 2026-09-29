# Operations

The app starts with `npm run dev`, which loads environment from the platform wrapper. SQL files in `migrations/` apply on the embedded database at startup, including `0004_completion.sql`. When `DATABASE_URL` is set, `npm run db:migrate` applies the same files. A new SQL file is picked up by a process restart, not by an already-open database.

## Dispatch

Outbox rows are leased (`lease_until`, `attempts`) inside the same transaction as the domain write, then applied in the web process. Receipts stop a repeated action. Queries are serialized so the single preview connection does not interleave that transaction. This is not Redis and not a second OS process.

`node scripts/outbox-worker.mjs` explains that and exits. If `DATABASE_URL` is set it only prints the pending count. It does not mark rows processed, because rule execution lives in the web process.

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
