# Requirements matrix

This is a map of the specification's themes to code, not a claim that every numbered test id has an automated case.

| Area | Where | What was executed |
|---|---|---|
| Deadline, scoring, dedupe, CSV, workflow tri-state, DST | `src/domain/rules.ts` | `node --experimental-strip-types --test src/domain/rules.test.ts` — 18 passed |
| Tenant membership | `src/server/talent/db.server.ts`, composite FKs in `migrations/0002_talentflow.sql` | Browser: Harbor slug returns "You do not have access to this company." |
| Public jobs | `workspace.server.ts`, `src/routes/careers` | Browser: four published Northstar jobs; paused designer hidden |
| Attempts | `assess.server.ts`, `src/routes/candidate/attempts/$attemptId.tsx` | Browser: start did not happen on GET; 1.5× plus 120s showed ~32:00; answer `80` survived reload; submit returned one receipt; reload showed 100.00% for the numerical demo |
| Offers | `schedule.server.ts`, `src/routes/candidate/offers/$offerId.tsx` | Browser: decline of revision 1 stored `DECLINED` and the comment |
| Hidden keys | `question_versions.key_payload`, seed sentinel | Client production assets do not contain `HIDDEN_SENTINEL_northstar_key_9f3a` |
| Code runner | `executionUnavailable()` | Sample run copy says the runner is unavailable. No local execution. |
| T-AUTH-007, T-AUTH-008, Playwright T-UI-*, load tests | — | Not implemented. RLS session context is intentionally absent. |

Demo assessments are fictional. They are not a validated hiring instrument.
