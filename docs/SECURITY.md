# Security

Implemented:

- Server functions that read or change employer data require a session and an active membership.
- Interviewers and reviewers are limited by role permissions in `src/domain/rules.ts`. Compensation is omitted unless the role has `offer.read_comp`.
- Peer interview feedback stays hidden until the viewer submits, unless they can manage interviews.
- Public application idempotency stores a payload hash. The same key with a different body conflicts.
- CSV export prefixes spreadsheet formula characters.
- Upload policy checks extension, MIME, and size before a row is marked clean by the local demo scanner. This is not a commercial malware product.
- Outbound integration URLs reject embedded credentials and obvious metadata hosts.
- The client production bundle does not contain the demo answer-key sentinel.
- Employer tables use Postgres row-level security forced for a non-superuser role. A query with no company, user, or public slug sees no employer rows and cannot insert one. The preview connection sets that role only inside a transaction, so it does not stick for sign-in queries.
- Composite foreign keys still reject a link that points at another company's row.
- Portal and assessment access tokens are HMAC-signed with `BETTER_AUTH_SECRET`. When `DATABASE_URL` is set and that secret is missing, mint/verify fail closed (no forgeable literal). Local preview without a database uses a process-stable random secret.
- `/live/$token` staff access uses the same permission gate as listing active exam attempts (`canWatchActiveAttempts`); an ANALYST membership alone cannot act as INTERVIEWER.
- Offer approve/send/respond updates require the expected prior status in the same `UPDATE` (optimistic concurrency).
- Applicant portal OTP request requires an employer slug and never returns a company list for an email (anti-enumeration).
- `GET /api/health` omits stored error message text from the public payload.
- Applicant portal / assess unlock uses a company-scoped email one-time code (short TTL, hashed at rest, rate-limited). Applications returned after verify are limited to that company. The portal and assess forms do not ask for an application UUID; server-side email+UUID unlock and `?access=` deep links remain for legacy links and APIs only.

Limitations, stated plainly:

- Email/password sessions use the auth library's cookies. Preview sign-in with Google or X uses the platform popup. There is no production demo password and no user-switching control.
- Rate limits are not shared across instances. There is no Redis.
- The product is not claimed to be GDPR, EEOC, or SOC 2 compliant.
