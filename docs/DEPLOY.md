# Deploy

The production build is `npm run build`. It compiles the app, copies the embedded-database assets, and applies `migrations/*.sql` only when `DATABASE_URL` is set. The Vercel preset is already selected. Put secrets in the host's environment, not in the repository. Names and empty behavior are in [`.env.example`](../.env.example). Nothing in that file is a live credential.

## What has to be set

| Name | Secret | If it is missing |
|---|---|---|
| `DATABASE_URL` | yes | The process uses an embedded database. A restart drops it. |
| `BETTER_AUTH_SECRET` | yes | Each process mints its own secret and sessions die on restart. |
| `BETTER_AUTH_URL` | no | The origin is taken from the request. Set the public `https` origin on a real host. |

Auth federation (`GROK_AUTH_ISSUER`, `GROK_AUTH_CLIENT_ID`, `GROK_AUTH_CLIENT_SECRET`, `GROK_PROJECT_ID`, `GROK_GATE_ORIGIN`) is injected by the preview host. A deploy that does not use that host must set them itself. `VITE_AUTH_ENABLED=false` turns sign-in off.

## What stays off until set

These are listed in [INTEGRATIONS.md](INTEGRATIONS.md). Missing values do not fail the boot. They keep the local behavior.

- Mail: `MAIL_SMTP_HOST`, `MAIL_SMTP_PORT`, `MAIL_FROM`, `MAIL_SMTP_USER`, `MAIL_SMTP_PASSWORD`, `MAIL_INBOUND_SECRET`, optional `RESEND_API_KEY` (for in-app Unsuppress against Resend)
- Calendar: `CALENDAR_VENDOR_URL`, `CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `CALENDAR_REDIRECT_URI`, `CALENDAR_TOKEN_URL`
- Job board: `JOB_BOARD_URL`, `JOB_BOARD_TOKEN`
- HR: `HRIS_EXPORT_URL`, `HRIS_EXPORT_TOKEN`
- Files: `OBJECT_STORE_BUCKET`, `OBJECT_STORE_ACCESS_KEY_ID`, `OBJECT_STORE_SECRET_ACCESS_KEY`, and `OBJECT_STORE_ENDPOINT` for R2. Optional `OBJECT_STORE_PROVIDER`, `OBJECT_STORE_REGION`
- Refused until set: `WEBHOOK_SECRET`, `PROVIDER_CALLBACK_SECRET`
- Not sending yet: `SENTRY_DSN`, `VITE_SENTRY_DSN`

`VITE_` names are visible in the browser. Do not put a server password in one. `OUTBOUND_ALLOW_LOOPBACK` is for tests. Leave it unset on a deploy.

## After the first boot

`GET /api/health/live` answers without the database. `GET /api/health/ready` runs `select 1` and returns 503 when the database is down. Connectors shows which optional integrations are only configured, not which ones have succeeded.

Changing `BETTER_AUTH_SECRET` signs every session out. Changing `DATABASE_URL` to another database does not move files that already live in a bucket. Backup and restore are in [RUNBOOK.md](RUNBOOK.md).

## What the package keeps

Guest sign-in stays. "Continue without an account" creates a real user named Guest and opens that person's workspace. It is not a shared anonymous session.

Mail, files, and errors stay as adapters. SMTP sends only when `MAIL_SMTP_HOST` and `MAIL_FROM` are set. New résumé bytes go to S3 or R2 only when the bucket variables are set; otherwise they stay in `file_objects`. `SENTRY_DSN` and `VITE_SENTRY_DSN` are detected by `GET /api/health` and do not send until `setErrorSink` / `setServerErrorSink` are given a client. Live and ready probes stay at `/api/health/live` and `/api/health/ready`.

## Background drain worker

On a durable deploy with shared Postgres, run a second process that drains idle tenants:

```sh
npm run outbox:worker
```

It needs `DATABASE_URL` (required) and the same mail variables as the web app when sending (`MAIL_SMTP_HOST`, `MAIL_SMTP_PORT`, `MAIL_FROM`, optional `MAIL_SMTP_USER`, `MAIL_SMTP_PASSWORD`, `MAIL_INBOUND_SECRET`). Optional `OUTBOX_POLL_MS` (default 5000). The web process still drains on write and workspace load for low latency. Do not add Redis for this.

## Host chrome


`public/manifest.webmanifest`, `public/favicon.svg`, and `public/license.txt` are the product. `public/__grok/`, `scripts/grok-pwa-*`, and the preview bridge are the host frame. They stay in this repository so the preview can wrap the app. They are not the RECRUIT4US name, icon, or license.

The HTML injector still adds the host script. If the document already has a manifest and an apple touch icon, it does not replace them with the host ones. Do not delete those host files to "clean" a build. A self-hosted copy uses the product manifest. The host banner is a project setting on the preview, not a line to strip from the source.

