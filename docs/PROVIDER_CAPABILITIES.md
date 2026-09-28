# Provider capabilities

| Integration | State | What actually happens |
|---|---|---|
| Email | Local capture | Rows in `mail_messages` with status `CAPTURED`, `FAILED`, or `UNKNOWN`. No SMTP. `CAPTURED` is not external delivery. A timeout is classified `UNKNOWN` by `classifyDelivery` and is not retried as success. |
| Files | Local database | Bytes stay in `file_objects`. Upload inserts `QUARANTINE`, then a local demo scanner may mark `CLEAN` or `INFECTED`. A scanner error stays quarantined. A clean download writes a five-minute `file_grants` row. This is not a commercial antivirus and not object storage. |
| Code execution | Local process, no remote key | A sample run is not a score. Reviews can judge saved source in a separate process against known cases. Fully correct answers rank by an estimated time class, then space, then measured time. The class is a heuristic, not a proof. A timeout stores no score. No remote runner key is configured. |
| Queue | PostgreSQL outbox | `outbox_events` is leased in the web process, in the same transaction as the domain write. `scripts/outbox-worker.mjs` does not process events and does not use Redis. Without a shared database it cannot see preview data. |
| Object storage | Not connected | No S3 or MinIO. Downloads are an authorized server call plus a short-lived database grant, not a signed object URL. |
| Calendar | Reconnect until a credential exists | Interviews and ICS files work. Refresh polls on the interviews page. Without `CALENDAR_REFRESH_TOKEN` and `CALENDAR_VENDOR_URL` the status is `RECONNECT` and no token is stored or returned. A failed vendor call becomes reconnect and does not echo the token. |
| External assessments | Manual import only | Staff can record a raw score and its scale. 8 on 0–10 becomes 8000 basis points. Text that is not a number becomes `FAILED` with a null score. |
| Provider callbacks | Secret required | `POST /api/provider/callback` stores nothing until `PROVIDER_CALLBACK_SECRET` is set. The company and assignment come from the attempt, not the body. A replay or a step backward from succeeded is refused. |
| Webhooks | Secret required | `receiveWebhook` checks HMAC-SHA256 against `WEBHOOK_SECRET`. If that variable is unset, the call is refused and nothing is stored. Replay of the same provider event key is rejected. |
| Google / X sign-in | Configured | Platform auth. Email and password are also enabled. Guest entry creates a real account. |
| Row security | On | `app.company_id`, `app.user_id`, and `app.public_slug` are transaction-local. Employer tables force row security for `app_user`, which cannot bypass it. The sign-in tables are not under that policy. |
| E-signature, billing, SAML, background checks | Out of scope | Offer acceptance records a response to an exact revision only. |
