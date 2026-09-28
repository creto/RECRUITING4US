# Runbook

This matches the code. It does not describe Redis, MinIO, or a code runner.

1. Start the app with `npm run dev`.
2. Check types with `npm run typecheck`.
3. Run product tests with `node --experimental-strip-types --test src/domain/rules.test.ts src/domain/schema.invariants.test.ts src/domain/completion.test.ts`. `npm test` also runs platform template checks that fail while auth stays on and app migrations exist. Do not delete those checks.
4. Build with `npm run build`. The build applies SQL only when `DATABASE_URL` is set. The embedded database applies `migrations/*.sql` when the app starts.
5. Count handwritten lines with `node scripts/measure-loc.mjs`.
6. Inspect the outbox helper with `node scripts/outbox-worker.mjs`. It must not mark events processed.

If a workflow row stays pending, open the company workspace so the web process leases it again. If `attempts` reaches 5, read `last_error` on `outbox_events` instead of retrying forever.

If a file will not download, its `scan_state` is not `CLEAN`. Infected files stay blocked.

If a candidate says the timer started from an email link, the start button is the only start. Reloading does not consume the attempt.

Answer keys live in `question_versions.key_payload`. They must not appear in the client bundle.
