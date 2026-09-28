# Implementation status

## Usable now

- Sign in, including a guest account that is a real user, or open Northstar Labs. Harbor Analytics is seeded so that person cannot open it.
- Jobs, public careers, applications, pipeline moves, notes, tags, CSV export, and CSV dry-run import.
- Assessments can be drafted with a pool size, published, and archived. A start draws a stable subset and does not reshuffle on refresh.
- Objective scoring, autosave, a server deadline, a receipt, and an audited extension while the attempt is open.
- On an application: merge preview, an external score with its scale, five extra minutes, and reopening a withdrawal. Hired stays hired.
- The candidate portal can download that person's applications as JSON.
- Settings → Privacy can delete this company's files that are past retention.
- Reviews rank submitted code by cases passed, then estimated time class, then space, then measured time. The class is a heuristic. A timeout is not stored as zero. The human rubric is still required.
- A CV screen looks for the job’s must-have words in an uploaded PDF or text file. Every word must be present before an assessment is sent. A missing CV, an unreadable file, or a missing skill does not send one. This is not a model score, and it does not read photos.
- A published job can be embedded with an iframe. The form is white by default. Each company can set the background, text, and button colors in Settings. The form takes a name, email, essays, and a CV. The CV is screened. The other answers are one row in a CSV the employer downloads. The receipt is shown on the page and stored. It is not emailed.
- Reviews, interviews with an ICS file, exclusive slots, offer approval (approvers can open the list), and candidate accept or decline.
- The interviews page refreshes calendar state. Without a vendor token the state stays reconnect and the token is never shown.
- A code sample runs in a separate process. It is not a score. Provider callbacks are refused until a secret is set.
- Rules with a dry run, captured mail, audit, and anonymize. Withdrawn applications can be reopened by staff. Hired applications cannot.
- Outbox rows are leased so a second drain skips a row that is still held.

## Not done, and not pretended

- Redis, a separate worker that executes rules, object storage, real SMTP, or a remote code judge.
- A webhook is accepted only when `WEBHOOK_SECRET` is set. It is not set in this preview, and the event is not stored.
- A provider callback is accepted only when `PROVIDER_CALLBACK_SECRET` is set. It is not set in this preview, and nothing is stored.
- Calendar refresh does not call a vendor until both a token and an https vendor URL exist.
- The full browser, security, and load suites. Verified acceptance coverage is 63 of 130. See `docs/COMPLETION_MATRIX.md`.

## Resume

Domain rules: `src/domain/rules.ts` and `src/domain/rules.test.ts`. Schema checks: `src/domain/schema.invariants.test.ts`. Server use cases: `src/server/talent/`.
