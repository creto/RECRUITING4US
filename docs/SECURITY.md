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

Limitations, stated plainly:

- No PostgreSQL row-level security. A bug in a query that forgets `company_id` would leak data. Composite foreign keys stop cross-company links, not a missing filter.
- No separate database role for the application versus migrations.
- Email/password sessions use the auth library's cookies. Preview sign-in with Google or X uses the platform popup. There is no production demo password and no user-switching control.
- Rate limits are not shared across instances. There is no Redis.
- The product is not claimed to be GDPR, EEOC, or SOC 2 compliant.
