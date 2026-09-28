# ADR 0001 — Runtime instead of the specified Next.js stack

The product specification asks for Next.js, Prisma, PostgreSQL row-level security, BullMQ, Redis, MinIO, Mailpit, and Docker Compose.

This workspace is a TanStack Start app with Better Auth and a SQL migration runner. Preview uses embedded PGLite; deployment uses Neon when `DATABASE_URL` is set. Those constraints override the specified stack.

Consequences:

- Employer tables force row-level security. Preview sets `app_user` for the transaction only, because the embedded database's owner bypasses policies. Tenant settings are transaction-local and do not remain on the connection used for sign-in.
- Durable events live in `outbox_events`. They are drained in the web process when a workspace loads and after domain writes. There is no Redis queue and no separate worker.
- Mail is inserted into `mail_messages` with status `CAPTURED`. Nothing is sent to the public internet.
- Files are stored in `file_objects` and scanned by a local demo policy, not a commercial antivirus and not MinIO.
- A sample program runs in a separate process with filesystem permission denied, a short timeout, and truncated output. The application process does not eval it. There is no remote runner key, and the output is not a score.
- Answer keys stay in `question_versions.key_payload` and are read only on the server during grading.

The product name is RECRUIT4US. The original specification used TalentFlow; the name change was requested and kept.
