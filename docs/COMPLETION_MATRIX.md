# Completion matrix

Product: RECRUIT4US. Equal weight: one point per original acceptance ID (130). A row is `VERIFIED` only when an automated test asserts that behavior. Code that exists without that test is `IMPLEMENTED_UNVERIFIED`. `PARTIAL` is not counted as complete. `EXTERNAL_BLOCKER` cannot be closed in this runtime without a service this environment does not provide.

| Status | Count | Share of 130 |
|---|---:|---:|
| VERIFIED | 57 | 57/130 (43.8%) |
| IMPLEMENTED_UNVERIFIED | 60 | 60/130 (46.2%) |
| PARTIAL | 7 | 7/130 (5.4%) |
| MISSING | 0 | 0/130 (0%) |
| EXTERNAL_BLOCKER | 6 | 6/130 (4.6%) |

Verified completion: **57/130 (43.8%)**. Local denominator excluding external blockers: **57/124 (46.0%)**. Implemented-but-unverified weight is shown separately and is not treated as done. The product is not fully complete: six items need services this runtime does not provide, and seven remain partial.

## T-AUTH

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-AUTH-001 | IMPLEMENTED_UNVERIFIED | Staff server functions use auth middleware | Direct unauthenticated call test |
| T-AUTH-002 | IMPLEMENTED_UNVERIFIED | `acceptInvite` creates one membership | Repeat-accept test |
| T-AUTH-003 | IMPLEMENTED_UNVERIFIED | Expired, revoked, and used invites are rejected in `acceptInvite` | Automated invite cases |
| T-AUTH-004 | IMPLEMENTED_UNVERIFIED | Actor company comes from membership, not a client company id | Poisoned-id API test |
| T-AUTH-005 | IMPLEMENTED_UNVERIFIED | Reads filter `company_id` | Known-id cross read test |
| T-AUTH-006 | VERIFIED | `schema.invariants.test.ts` rejects a cross-company application foreign key | — |
| T-AUTH-007 | EXTERNAL_BLOCKER | No row-level security or restricted runtime role. Neon/PGLite pool cannot use transaction-local tenant context | RLS only on a dedicated role |
| T-AUTH-008 | EXTERNAL_BLOCKER | No session tenant variable is set, so there is nothing to leak, but the specified RLS context test cannot be run | Same as T-AUTH-007 |
| T-AUTH-009 | IMPLEMENTED_UNVERIFIED | Interviewer reads require assignment; `canReadApplication` | Packet API test |
| T-AUTH-010 | IMPLEMENTED_UNVERIFIED | Removed memberships fail `requireActor` | Revoke-then-call test |
| T-AUTH-011 | IMPLEMENTED_UNVERIFIED | Unverified email cannot claim another candidate | API test |
| T-AUTH-012 | IMPLEMENTED_UNVERIFIED | Candidate queries require user id or verified email | Cross-candidate test |
| T-AUTH-013 | IMPLEMENTED_UNVERIFIED | `removeMember` blocks the last owner | API test |
| T-AUTH-014 | PARTIAL | Exports and reports filter company. No separate worker tenant context | Worker only if a shared database exists |
| T-AUTH-015 | IMPLEMENTED_UNVERIFIED | `allow()` on mutations | Role matrix API test |
| T-AUTH-016 | PARTIAL | No shared response cache | Not required until a cache exists |

## T-ATS

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-ATS-001 | IMPLEMENTED_UNVERIFIED | Public apply requires `PUBLISHED` | API test |
| T-ATS-002 | IMPLEMENTED_UNVERIFIED | Public job returns the published revision | API test |
| T-ATS-003 | VERIFIED | `storeResume` inserts `QUARANTINE` first. `applyScan("ERROR")` stays quarantine. This is a local demo scanner, not commercial antivirus | — |
| T-ATS-004 | IMPLEMENTED_UNVERIFIED | Same idempotency key returns the stored result | HTTP replay test |
| T-ATS-005 | VERIFIED | `idempotencyDecision` conflict test; unique `(actor, operation, key)` | — |
| T-ATS-006 | VERIFIED | Partial unique index; schema test rejects a second active application | — |
| T-ATS-007 | VERIFIED | `moveApplication` writes stage history and the outbox inside `withTransaction`. `completion.test.ts` rolls both back together | — |
| T-ATS-008 | IMPLEMENTED_UNVERIFIED | Move requires `expectedVersion` | Conflict test |
| T-ATS-009 | IMPLEMENTED_UNVERIFIED | Stages are archived, not rewritten history | — |
| T-ATS-010 | IMPLEMENTED_UNVERIFIED | No silent stage delete; archive is the operation | — |
| T-ATS-011 | IMPLEMENTED_UNVERIFIED | Workflow skips actions when lifecycle is not active | Replay test |
| T-ATS-012 | VERIFIED | `assertSameCompany` throws across companies. `mergeCandidates` previews, then commits only inside one company | — |
| T-ATS-013 | IMPLEMENTED_UNVERIFIED | CSV dry-run returns a report and does not insert | Fixture test |
| T-ATS-014 | VERIFIED | `escapeCsvCell` formula cases | — |
| T-ATS-015 | VERIFIED | `validateSavedViewFilters` | — |
| T-ATS-016 | VERIFIED | `bulkProgress` leaves the remainder. `bulkMove` stores `bulk_runs` for the in-request batch of at most 50. It is not a separate worker | — |

## T-ASMT

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-ASMT-001 | VERIFIED | `validateAssessmentPublish` empty | — |
| T-ASMT-002 | VERIFIED | Weight total must be 10000 | — |
| T-ASMT-003 | VERIFIED | Objective item without a key | — |
| T-ASMT-004 | VERIFIED | Human item without a rubric | — |
| T-ASMT-005 | IMPLEMENTED_UNVERIFIED | Publish updates only `DRAFT`; question versions are inserted, not edited | — |
| T-ASMT-006 | IMPLEMENTED_UNVERIFIED | Assignments store `assessment_version_id` | Two-version test |
| T-ASMT-007 | VERIFIED | `choosePool` throws when the draw is larger than the bank. Publish reports code `pool` | — |
| T-ASMT-008 | VERIFIED | `seededShuffle` and `choosePool` repeat for the same seed. Start stores that draw on the attempt | — |
| T-ASMT-009 | IMPLEMENTED_UNVERIFIED | `archiveAssessment` sets `archived` and does not delete versions or assignments | Assignment-after-archive API test |
| T-ASMT-010 | VERIFIED | Candidate attempt payload selects prompt and options, not `key_payload`. Static client assets contain no `HIDDEN_SENTINEL_northstar_key_9f3a` | — |

## T-ATT

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-ATT-001 | IMPLEMENTED_UNVERIFIED | `startAttempt` creates one attempt and a server deadline | API test |
| T-ATT-002 | IMPLEMENTED_UNVERIFIED | `attempts_one_active` unique index | Concurrent start test |
| T-ATT-003 | IMPLEMENTED_UNVERIFIED | Invite and attempt pages do not start on load | Browser test |
| T-ATT-004 | VERIFIED | `canStartAttempt` rejects now equal to start-by | — |
| T-ATT-005 | VERIFIED | 1.5x plus 120 seconds | — |
| T-ATT-006 | VERIFIED | Hard finish cap | — |
| T-ATT-007 | IMPLEMENTED_UNVERIFIED | Save stores revision; reload reads it | Two-tab test |
| T-ATT-008 | VERIFIED | `acceptsResponseAt` is exclusive at the deadline | — |
| T-ATT-009 | IMPLEMENTED_UNVERIFIED | Deadline uses database time | Manipulated-clock test |
| T-ATT-010 | IMPLEMENTED_UNVERIFIED | Mutation id replay returns the same revision | — |
| T-ATT-011 | IMPLEMENTED_UNVERIFIED | Stale revision conflicts | — |
| T-ATT-012 | VERIFIED | `saveStatusLabel` distinguishes unsaved, saved, and not-saved. The attempt page announces that label | — |
| T-ATT-013 | IMPLEMENTED_UNVERIFIED | Submitted attempts reject new answers | — |
| T-ATT-014 | IMPLEMENTED_UNVERIFIED | Repeat submit returns the snapshot | — |
| T-ATT-015 | PARTIAL | No concurrent save/submit proof | Race test on a multi-connection database |
| T-ATT-016 | PARTIAL | `sweepCompany` finalizes from stored answers; the race is not tested | — |
| T-ATT-017 | IMPLEMENTED_UNVERIFIED | Late answers use server time, not a worker clock | — |
| T-ATT-018 | IMPLEMENTED_UNVERIFIED | Expiry sweep uses last stored answers | — |
| T-ATT-019 | VERIFIED | `planExtension` adds time only while `IN_PROGRESS` and will not pass a hard finish. A SQL update of a `SUBMITTED` attempt changes zero rows. The command writes `attempt_extensions` | — |
| T-ATT-020 | IMPLEMENTED_UNVERIFIED | Allowance creates another attempt; snapshots stay | — |
| T-ATT-021 | IMPLEMENTED_UNVERIFIED | Cancelled, expired, and completed assignments cannot start | — |
| T-ATT-022 | VERIFIED | `questionIndex` moves on ArrowRight and stops on ArrowLeft at the first item. The attempt page uses that helper and ignores keys typed in fields | — |

## T-SCORE

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-SCORE-001 | VERIFIED | Exact set `{a,c}` | — |
| T-SCORE-002 | VERIFIED | 10.1 passes, 10.1001 fails | — |
| T-SCORE-003 | VERIFIED | NaN and locale comma rejected | — |
| T-SCORE-004 | VERIFIED | 8/10 at 25% and 18/20 at 75% is 8750; 40/30/20/10 fixture is 6750 not a raw average | — |
| T-SCORE-005 | VERIFIED | Pending section stays pending | — |
| T-SCORE-006 | VERIFIED | `operationalFailure()` is `FAILED` with null basis points. `sampleRun` returns that failure and does not invent a score | — |
| T-SCORE-007 | VERIFIED | 1599/2000 fails 80%; 1600/2000 passes | — |
| T-SCORE-008 | VERIFIED | `rubricComplete` | — |
| T-SCORE-009 | VERIFIED | Schema test inserts a second evaluation revision on the same attempt | — |
| T-SCORE-010 | VERIFIED | `mapExternalScore` maps 8 on a 0–10 scale to 8000 and an unparseable raw value to `FAILED` with null basis points. Import writes origin `EXTERNAL` | — |
| T-SCORE-011 | VERIFIED | `executionUnavailable` returns no hidden cases | — |
| T-SCORE-012 | IMPLEMENTED_UNVERIFIED | Objective grade reads stored responses, not a sample run | — |
| T-SCORE-013 | EXTERNAL_BLOCKER | No isolated runner to enforce CPU, memory, or output caps | Provider credentials and a patched runner |
| T-SCORE-014 | VERIFIED | Unavailable result; no local execution | — |
| T-SCORE-015 | EXTERNAL_BLOCKER | No provider completion callback | Same runner |
| T-SCORE-016 | IMPLEMENTED_UNVERIFIED | Aggregate release returns basis points only when final | DTO test |
| T-SCORE-017 | IMPLEMENTED_UNVERIFIED | Seed keys exist; not checked by an independent grader test | Fixture test |
| T-SCORE-018 | EXTERNAL_BLOCKER | Reference solutions cannot be executed here | Do not run them on the app server |

## T-WF

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-WF-001 | VERIFIED | Same rollback fixture as T-ATS-007: application insert and outbox insert commit or roll back together | — |
| T-WF-002 | IMPLEMENTED_UNVERIFIED | Action receipts are unique per event, rule, and index | Redispatch test |
| T-WF-003 | VERIFIED | Unknown score is not a failure | — |
| T-WF-004 | IMPLEMENTED_UNVERIFIED | Drain loads `enabled = true` only | — |
| T-WF-005 | IMPLEMENTED_UNVERIFIED | Receipts store `rule_id`; versions are not rewritten | — |
| T-WF-006 | IMPLEMENTED_UNVERIFIED | `simulate` explains and does not enqueue | Dry-run assertion |
| T-WF-007 | IMPLEMENTED_UNVERIFIED | Depth above 4 stops the chain | — |
| T-WF-008 | PARTIAL | Lease skips a row still leased. A separate crashed worker was not restarted | Shared database |
| T-WF-009 | PARTIAL | Receipts stop a second action. Crash-between-commit-and-ack was not executed | Same |
| T-WF-010 | VERIFIED | `classifyDelivery('timeout')` is UNKNOWN | — |
| T-WF-011 | VERIFIED | `outboxDisposition(5)` is fail. Drain marks pending rows at five attempts `FAILED` before claiming | — |
| T-WF-012 | IMPLEMENTED_UNVERIFIED | Non-active applications skip reminder-like actions | — |
| T-WF-013 | IMPLEMENTED_UNVERIFIED | Lifecycle changes require a reason and write audit | — |
| T-WF-014 | VERIFIED | `webhookVerdict` rejects unsigned, mismatched, and replayed bodies. `receiveWebhook` stores nothing when `WEBHOOK_SECRET` is unset and uses the member's company, not the body | — |
| T-WF-015 | IMPLEMENTED_UNVERIFIED | Actions use the event's company id, not a body tenant | — |
| T-WF-016 | EXTERNAL_BLOCKER | No connected calendar or vendor credential to refresh | Real connector |

## T-INT

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-INT-001 | IMPLEMENTED_UNVERIFIED | Schedule writes an interview and `buildIcs` | — |
| T-INT-002 | VERIFIED | Second slot update matches zero rows | — |
| T-INT-003 | VERIFIED | DST gap and overlap throw | — |
| T-INT-004 | VERIFIED | Same UID, sequence increases | — |
| T-INT-005 | IMPLEMENTED_UNVERIFIED | Cancel sets status and ICS method | — |
| T-INT-006 | VERIFIED | Interviewer peer feedback stays hidden until they submit | — |
| T-INT-007 | VERIFIED | Incomplete required ratings fail `rubricComplete` | — |
| T-INT-008 | VERIFIED | Slot claim is exclusive in the schema test. `bookingIntent` reuses an existing interview id instead of creating another | — |

## T-OFFER

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-OFFER-001 | IMPLEMENTED_UNVERIFIED | Send requires an approval of the current revision | API test |
| T-OFFER-002 | IMPLEMENTED_UNVERIFIED | Approval is tied to revision number | Edit-after-approve test |
| T-OFFER-003 | IMPLEMENTED_UNVERIFIED | Accept requires `SENT` and the current revision | — |
| T-OFFER-004 | VERIFIED | Unique response per offer | — |
| T-OFFER-005 | IMPLEMENTED_UNVERIFIED | Non-sent offers cannot be accepted | — |
| T-OFFER-006 | VERIFIED | Interviewer lacks `offer.read_comp`; list nulls salary without that permission. Approvers can open the list | — |

## T-SEC

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-SEC-001 | VERIFIED | Extension, MIME, and size policy | — |
| T-SEC-002 | VERIFIED | Download allowed only for `CLEAN`. Bad scan states are rejected by the check constraint | — |
| T-SEC-003 | VERIFIED | `readFile` writes a five-minute `file_grants` row. `grantAllows` is exclusive at expiry and refuses another company or user | — |
| T-SEC-004 | IMPLEMENTED_UNVERIFIED | Prompts render as text, not HTML | — |
| T-SEC-005 | IMPLEMENTED_UNVERIFIED | Mutations call `assertSameSiteRequest` | Origin test |
| T-SEC-006 | IMPLEMENTED_UNVERIFIED | Audit summaries are truncated; keys stay in `key_payload` | Log fixture |
| T-SEC-007 | VERIFIED | Link-local and metadata hosts rejected | — |
| T-SEC-008 | PARTIAL | Guest entry creates a real account for preview. It is not a production demo bypass switch | Deployment policy |
| T-SEC-009 | VERIFIED | `retentionDue` waits the full day count. The schema test deletes company A files and leaves company B | — |
| T-SEC-010 | VERIFIED | `candidateExportPayload` returns applications only. `exportMine` loads the signed-in person's applications | — |

## T-REPORT and T-UI

| ID | Status | Evidence | Next |
|---|---|---|---|
| T-REPORT-001 | VERIFIED | `distinctApplicationCount` counts a repeated application once. Funnel SQL uses `count(distinct application_id)` and the schema fixture returns 1 | — |
| T-REPORT-002 | VERIFIED | `includeInScoreDistribution` is true only for `FINAL`. The score query filters `status = 'FINAL'` | — |
| T-REPORT-003 | VERIFIED | `reportDayWindow('2026-06-15', 'America/New_York')` is 04:00Z through the next 04:00Z. Reports use that window when a local date is passed | — |
| T-UI-001 | IMPLEMENTED_UNVERIFIED | Workspace has a skip link, current page, live save status, visible focus, and reduced-motion styles. No automated axe suite | Keyboard journey |
| T-UI-002 | IMPLEMENTED_UNVERIFIED | Candidate layout was checked earlier at a phone width; not re-run as a named test this pass | Smoke |
| T-UI-003 | IMPLEMENTED_UNVERIFIED | Server errors use alerts; some forms reload and drop input | Keep field values |
| T-UI-004 | IMPLEMENTED_UNVERIFIED | Empty states and the unavailable runner are explicit | — |
| T-UI-005 | IMPLEMENTED_UNVERIFIED | Sidebar routes render working pages, not placeholders | Route audit |

Rows: 16+16+10+22+18+16+8+6+10+3+5 = 130.
