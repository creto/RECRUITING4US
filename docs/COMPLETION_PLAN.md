# Completion plan

The 48,000-line planning baseline is not a target. This repository is a TanStack Start app on an embedded database, not the original Next.js, Redis, MinIO, and Judge0 stack. Existing hiring behavior was kept.

## Done

- Assessment authoring, deterministic question pools, archive, and pinned published versions.
- Deadline extensions with history, same-company merge preview and commit, external score import, candidate export, short-lived file grants, and retention deletes scoped to one company.
- Stage moves and attempt starts share a database transaction with their outbox row. Queries are serialized so the single preview connection cannot interleave a transaction.
- Webhook HMAC check. With `WEBHOOK_SECRET` unset, the event is refused and not stored.
- Bulk move writes a `bulk_runs` row for the batch it just finished (at most 50). That batch is still handled in the request.
- Domain, schema, and transaction tests. Status for all 130 acceptance IDs is in `docs/COMPLETION_MATRIX.md`.

## Still open

1. Fifty-nine implemented behaviors have no automated assertion yet (auth calls, invite reuse, attempt save races, offer send).
2. Eight partial items: no shared cache, no separate worker tenant, concurrent save/submit not proven on two connections, outbox crash recovery not restarted as a second process, guest entry stays available because preview has no identity provider, and sample runs execute locally because no remote judge key exists.
3. Webhooks and provider callbacks stay refused, and store nothing, until their secrets are set. Mail stays captured. Do not invent a passing score.

## Weight

Verified 63/130 (48.5%). The product is not complete.
