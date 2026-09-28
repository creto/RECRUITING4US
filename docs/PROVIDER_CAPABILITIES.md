# Provider capabilities

| Integration | State | What actually happens |
|---|---|---|
| Email | Local capture | Rows in `mail_messages` with status `CAPTURED`, `FAILED`, or `UNKNOWN`. No SMTP. `CAPTURED` is not external delivery. A timeout is classified `UNKNOWN` by `classifyDelivery` and is not retried as success. |
| Files | Local database | Bytes stay in `file_objects`. Upload inserts `QUARANTINE`, then a local demo scanner may mark `CLEAN` or `INFECTED`. A scanner error stays quarantined. A clean download writes a five-minute `file_grants` row. This is not a commercial antivirus and not object storage. |
| Code execution | Unavailable | `sampleRun` returns `executionUnavailable()` plus `operationalFailure()` (`FAILED`, basis points null). Candidate code is not executed on the app server. No score is invented. |
| Queue | PostgreSQL outbox | `outbox_events` is leased in the web process, in the same transaction as the domain write. `scripts/outbox-worker.mjs` does not process events and does not use Redis. Without a shared database it cannot see preview data. |
| Object storage | Not connected | No S3 or MinIO. Downloads are an authorized server call plus a short-lived database grant, not a signed object URL. |
| Calendar | Manual | Interviews, exclusive slots, and ICS files work. External availability is unknown. |
| External assessments | Manual import only | Staff can record a raw score and its scale. 8 on 0–10 becomes 8000 basis points. Text that is not a number becomes `FAILED` with a null score. There is no live vendor callback. |
| Webhooks | Secret required | `receiveWebhook` checks HMAC-SHA256 against `WEBHOOK_SECRET`. If that variable is unset, the call is refused and nothing is stored. Replay of the same provider event key is rejected. |
| Google / X sign-in | Configured | Platform auth. Email and password are also enabled. Guest entry creates a real account. |
| Row security | Not available | Isolation is membership checks and composite foreign keys, not Postgres RLS. |
| E-signature, billing, SAML, background checks | Out of scope | Offer acceptance records a response to an exact revision only. |
