# Provider capabilities

| Integration | State | What actually happens |
|---|---|---|
| Email | Adapter ready, external delivery blocked in this preview | `message_intents` keeps queued, accepted, delivered, bounced, failed, and stored apart from in-product `mail_messages`. SMTP runs when `MAIL_SMTP_HOST` and `MAIL_FROM` are set. A 250 is accepted, not delivered. No credentials are set here, so real inboxes are not reached. |
| Files | Local database | Bytes stay in `file_objects`. Upload inserts `QUARANTINE`, then a local demo scanner may mark `CLEAN` or `INFECTED`. A scanner error stays quarantined. A clean download writes a five-minute `file_grants` row. This is not a commercial antivirus and not object storage. |
| Code execution | Local isolated Node | JavaScript runs in a user, mount, pid, and network namespace with Node's permission model. Sample output is not a score. A timeout or infrastructure failure stores no zero. No remote judge is configured. |
| Queue | PostgreSQL outbox | `outbox_events` is leased (`SKIP LOCKED`) in the web process after writes and by `npm run outbox:worker` on shared `DATABASE_URL`. Due `message_intents` drain the same way. Not Redis/BullMQ. Without a shared database the worker exits; preview data stays in the web process. |
| Object storage | Not connected | No S3 or MinIO. Downloads are an authorized server call plus a short-lived database grant, not a signed object URL. |
| Calendar | Reconnect until a credential exists | Interviews and ICS files work. Refresh polls on the interviews page. Without `CALENDAR_REFRESH_TOKEN` and `CALENDAR_VENDOR_URL` the status is `RECONNECT` and no token is stored or returned. A failed vendor call becomes reconnect and does not echo the token. |
| External assessments | Manual import only | Staff can record a raw score and its scale. 8 on 0–10 becomes 8000 basis points. Text that is not a number becomes `FAILED` with a null score. |
| Provider callbacks | Secret required | `POST /api/provider/callback` stores nothing until `PROVIDER_CALLBACK_SECRET` is set. The company and assignment come from the attempt, not the body. A replay or a step backward from succeeded is refused. |
| Webhooks | Secret required | `receiveWebhook` checks HMAC-SHA256 against `WEBHOOK_SECRET`. If that variable is unset, the call is refused and nothing is stored. Replay of the same provider event key is rejected. |
| Google / X sign-in | Configured | Platform auth. Email and password are also enabled. Guest entry creates a real account. |
| Row security | On | `app.company_id`, `app.user_id`, and `app.public_slug` are transaction-local. Employer tables force row security for `app_user`, which cannot bypass it. The sign-in tables are not under that policy. |
| E-signature, billing, SAML, background checks | Out of scope | Offer acceptance records a response to an exact revision only. |
