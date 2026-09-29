# Runbook

This matches the code. It does not describe Redis, MinIO, or a code runner.

1. Start the app with `npm run dev`.
2. Check types with `npm run typecheck`.
3. Run product tests with `npm test`. That command runs `src/**/*.test.ts` only.

4. Build with `npm run build`. The build applies SQL only when `DATABASE_URL` is set. The embedded database applies `migrations/*.sql` when the app starts.
5. Count handwritten lines with `node scripts/measure-loc.mjs`.
6. Inspect the outbox helper with `node scripts/outbox-worker.mjs`. It must not mark events processed.

If a workflow row stays pending, open the company workspace so the web process leases it again. If `attempts` reaches 5, read `last_error` on `outbox_events` instead of retrying forever.

If a file will not download, its `scan_state` is not `CLEAN`. Infected files stay blocked.

If a candidate says the timer started from an email link, the start button is the only start. Reloading does not consume the attempt.

Answer keys live in `question_versions.key_payload`. They must not appear in the client bundle.

## Backup

The embedded database has no durable backup. A process restart deletes it. This section is for Postgres reached by `DATABASE_URL`.

Take a custom-format dump from a role that can read the application tables and the auth tables. Both live in the same database.

```sh
pg_dump --format=custom --no-owner --file=recruit4us.dump "$DATABASE_URL"
```

Do not print the URL. The shell expands it from the environment.

That dump includes résumé bytes only while they still sit in `file_objects.content`. After object storage is configured, new files are pointers (`object:v1:`) and the bytes are in the bucket. Copy the bucket with the same keys (`companyId/fileId`). A database dump without that copy cannot open those files. A bucket copy without the database is a set of unnamed objects.

A dump also keeps people who were anonymized after the dump was taken. Restoring it brings them back. It does not satisfy a deletion request.

Keep `BETTER_AUTH_SECRET` with the dump, outside the database. The dump does not contain it. Restoring under a different secret signs everyone out.

## Restore

Restore into a new empty database. Do not run a clean restore over the live one.

```sh
createdb recruit4us_restore
pg_restore --no-owner --dbname="$RESTORE_URL" recruit4us.dump
```

Point `DATABASE_URL` at `RESTORE_URL` only after the restore finishes. Restart the app. `npm run db:migrate` applies any migration that is newer than the dump. It does not roll back.

If the dump contains object pointers, the new process needs the same bucket credentials and the same objects. Missing objects fail the download and leave the row in place.

Check `GET /api/health/ready`, then open one company and one file you know was in the dump. Sessions from before the restore work only when `BETTER_AUTH_SECRET` is the one that signed them.

