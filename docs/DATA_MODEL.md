# Data model

Schema: `migrations/0002_talentflow.sql`, `migrations/0003_outbox_and_question_types.sql`, and `migrations/0004_completion.sql`. Auth tables come from `migrations/0001_auth.sql` and are not edited.

Employer-owned rows carry `company_id`. Child rows use composite foreign keys `(company_id, id)` so a Northstar application cannot point at a Harbor job, candidate, or stage.

Notable constraints:

- One active application per company, job, and candidate.
- One active attempt per assignment.
- Outbox rows can be leased (`lease_until`, `attempts`). A stage move inserts history and the outbox row in one transaction. This is still not a Redis queue.
- `assessment_sections.pool_pick` is null or greater than zero. A start draws that many items with a seed and stores them on the attempt.
- `attempt_extensions` keeps the previous deadline, the new deadline, and the reason.
- `file_grants` expire. `webhook_receipts` are unique per company, provider, and event key. `bulk_runs` stores the batch a bulk move just finished.
- Question types include human-reviewed `sql`, `spreadsheet`, and `recording`. They are not executed.
- One response per attempt item, with a revision counter and a unique mutation id.
- One submission snapshot per attempt.
- Offer approvals unique per company, offer, revision, and approver.
- Invitation tokens are stored as hashes.

Money on offers is integer minor units. Job salary ranges in the demo seed are whole dollars and are labeled as such on the public page. Scores are integer basis points. Pending manual work is not stored as zero.

Deletion of a candidate profile is a request row plus an anonymize action. It does not promise erasure from backups. Audit rows keep a short summary, not answer keys or offer comments.
