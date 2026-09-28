# Line count

Counter: `node scripts/measure-loc.mjs`. Measured 2026-09-28T01:18:19Z.

Nonblank, non-comment-only lines. Excludes `node_modules`, lockfiles, build output, the generated route tree, and platform auth routes.

| Category | Lines |
|---|---:|
| Application (`src` product code and styles) | 8439 |
| Tests in `src/domain` | 662 |
| App migrations `0002`, `0003`, and `0004` | 608 |
| Product scripts (loc, pglite copy, outbox helper) | 109 |
| **Total** | **9818** |

The previous measurement on the same counter was 8863 at 2026-09-28T00:44:29Z. The difference is the completion work (pools, transactions, grants, webhooks, and their tests), not padded filler. The 48,000-line planning baseline was not used as a goal. Documentation is excluded.

Platform script tests, `src/lib`, and the auth migration copy are outside this product total.
