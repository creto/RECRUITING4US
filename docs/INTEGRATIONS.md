# What is actually connected

External delivery and sync stay off until these values exist in the server environment. None of them are set in this preview. A workspace mailbox, sandbox job board, or downloaded HR file is not the external system.

## Email

- `MAIL_SMTP_HOST`, `MAIL_SMTP_PORT` (587 with STARTTLS, or 465 with `MAIL_SMTP_SECURE=1`)
- `MAIL_FROM` verified sender
- `MAIL_SMTP_USER` and `MAIL_SMTP_PASSWORD` when the server requires AUTH
- `MAIL_INBOUND_SECRET` for signed inbound and delivery webhooks

`POST /api/mail/events` with `x-mail-timestamp` and `x-mail-signature` = HMAC-SHA256 of `timestamp.body`. Body fields: `eventId`, `threadToken`, `type` (`inbound`, `delivered`, `bounced`, `complained`), `from`, `subject`, `text`.

A 250 from SMTP is **accepted**, not delivered. Delivery, bounce, and complaint are webhook events. Bounces are suppressed. The in-product message copy is a different channel and stays `CAPTURED`.

## Calendar

- `CALENDAR_VENDOR_URL` HTTPS endpoint that accepts a JSON event
- `CALENDAR_REFRESH_TOKEN` bearer token
- Optional `GOOGLE_CALENDAR_CLIENT_ID` and secret are not an OAuth login inside this product

Without those, bookings stay here and Interviews can still download ICS. Two people cannot take the same open slot. A provider error is `SYNC_FAILED` and does not pretend the outside calendar changed.

## Job board

- `JOB_BOARD_URL` and `JOB_BOARD_TOKEN`

The sandbox board never calls that URL. LinkedIn is not connected.

## Object storage

- `OBJECT_STORE_BUCKET`
- `OBJECT_STORE_ACCESS_KEY_ID`
- `OBJECT_STORE_SECRET_ACCESS_KEY`
- `OBJECT_STORE_ENDPOINT` for Cloudflare R2 or any other S3-compatible host
- `OBJECT_STORE_REGION` (defaults to `us-east-1`, or `auto` for R2)
- `OBJECT_STORE_PROVIDER` `s3` or `r2`

Without a bucket, résumé bytes stay in `file_objects`. A configured bucket receives new files. A refused upload is not saved. Existing database files still open. Deleting a file removes the object first and keeps the row if that delete fails.

## HRIS

- `HRIS_EXPORT_URL` and `HRIS_EXPORT_TOKEN`

Pushes use one idempotency key per application. Without the token, the handoff is a download. Offer acceptance does not mark someone hired.

## Code judge

JavaScript runs as `unshare --user --map-root-user --net --mount --pid --fork --mount-proc`, then Node `--permission` with a 64 MB heap. Before the program starts, tmpfs covers `/workspace`, `/home`, `/root`, `/etc`, and `/tmp`. The parent passes only `PATH`. A missing `unshare` refuses the run. This is not a hypervisor. Supported language: JavaScript. Python is not executed. Infrastructure failure is not a score of zero.
