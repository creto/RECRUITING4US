# Test report

Environment: Node 22, TanStack Start, embedded PGLite (no `DATABASE_URL`). 2026-09-28 UTC.

## Passed

- `node --experimental-strip-types --test src/domain/rules.test.ts src/domain/schema.invariants.test.ts src/domain/completion.test.ts` — 33 passed, 0 failed.
  - Deadlines, exclusive boundary, exact choice, numeric tolerance, weighted scores (8750 and the 40/30/20/10 case at 6750), threshold 1599/1600, publish rules including a missing rubric and an oversized pool, CSV escaping, saved filters, tri-state workflow, DST, ICS uid and sequence, idempotency decision, download gate, peer feedback, start-by boundary.
  - Pools stay stable for a seed. Extensions refuse a submitted attempt. Cross-company merge throws. External 8/10 maps to 8000; unparseable raw maps to failed with a null score. Scanner errors stay quarantined. Grants expire exclusively. Distinct applications, final-only score inclusion, a New York local day, retention, export shape, bulk remainder, booking reuse, and outbox claim/skip/fail.
  - Webhook bodies that are unsigned, mismatched, or replayed are rejected. An application insert and its outbox insert roll back together.
  - Fresh database: one active application, cross-company foreign key, one idempotency key, illegal scan state, one offer response, one slot claim, one outbox lease, distinct stage events, a file delete that leaves the other company, two evaluation revisions, and an extension update that misses a submitted attempt.
- `npx tsc --noEmit` — clean.
- `npm run build` — client and server bundles produced. Migrate skipped because `DATABASE_URL` is unset. PGLite wasm sidecars were copied next to the server bundle.
- Dev server returned HTTP 200 after a restart so migration `0004` could apply. Production preview returned HTTP 200 with the same homepage text hash as that dev capture, no console errors, and no horizontal overflow. Preview was then stopped. The dev server was left running.

## `npm test`

`npm test` runs platform script tests first and stops before the domain files if those fail. Result this pass was not re-counted line by line; the previous full script run was 182 passed, 13 failed, and those failures are template assertions that no longer match this auth-on product:

- Brand injector tests expect the blank template title, not RECRUIT4US.
- `with-app-env` tests expect `VITE_AUTH_ENABLED=false`. This app leaves that key unset so sign-in stays on.
- `migration-plan` expects `migrations/` to contain no SQL files. This app has `0001` through `0004`.

Those assertions were not deleted or weakened. They are not evidence that hiring rules failed. The domain, schema, and completion command above is the product result.

## Not run

Playwright, axe, row-level security, Judge0, SMTP, a second-process worker crash, and load tests. No performance numbers are claimed.

A search of `.vercel/output/static` for `HIDDEN_SENTINEL_northstar_key_9f3a` found no matches. The sentinel remains in the seed's `key_payload` only.
