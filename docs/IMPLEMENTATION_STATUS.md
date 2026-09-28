# Implementation status

## Usable now

- Sign in, including a guest account that is a real user, or open Northstar Labs. Harbor Analytics is seeded so that person cannot open it.
- Jobs, public careers, applications, pipeline moves, notes, tags, CSV export, and CSV dry-run import.
- Assessments can be drafted with a pool size, published, and archived. A start draws a stable subset and does not reshuffle on refresh.
- Objective scoring, autosave, a server deadline, a receipt, and an audited extension while the attempt is open.
- On an application: merge preview, an external score with its scale, five extra minutes, and reopening a withdrawal. Hired stays hired.
- The candidate portal can download that person's applications as JSON.
- Settings → Privacy can delete this company's files that are past retention.
- Objective scoring, autosave, a server deadline, and a receipt. Written and code answers wait for review.
- Reviews, interviews with an ICS file, exclusive slots, offer approval (approvers can open the list), and candidate accept or decline.
- Rules with a dry run, captured mail, audit, and anonymize. Withdrawn applications can be reopened by staff. Hired applications cannot.
- Outbox rows are leased so a second drain skips a row that is still held.

## Not done, and not pretended

- PostgreSQL row-level security.
- Redis, a separate worker that executes rules, object storage, real SMTP, Judge0, or a live calendar vendor.
- A webhook is accepted only when `WEBHOOK_SECRET` is set. It is not set in this preview.
- The full browser, security, and load suites. Verified acceptance coverage is 57 of 130. See `docs/COMPLETION_MATRIX.md`.

## Resume

Domain rules: `src/domain/rules.ts` and `src/domain/rules.test.ts`. Schema checks: `src/domain/schema.invariants.test.ts`. Server use cases: `src/server/talent/`.
