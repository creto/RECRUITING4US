# Feature verification matrix

Status vocabulary (directive §13): VERIFIED CURRENT PRODUCT · SANDBOX WORKING · PRODUCTION WORKING · PARTIAL · BLOCKED BY EXTERNAL CREDENTIALS · OWNER PROVIDED · INFERRED / INTERNAL ONLY · NOT DONE · DO NOT PUBLISH.

How statuses were assigned:
- **VERIFIED CURRENT PRODUCT** = behaviour is present in current code (read in this pass) *and* documented as usable in `docs/IMPLEMENTATION_STATUS.md`; automated coverage is noted where `docs/COMPLETION_MATRIX.md` marks the ID VERIFIED ("[T]"). Features with code but no test are still eligible if the claim is modest.
- **SANDBOX WORKING** = works end-to-end inside the workspace but does not reach an outside system.
- **PRODUCTION WORKING** = reaches its real destination in a verified deployment. **Nothing qualifies today** (`docs/REQUIREMENTS_MATRIX.md:3-4`; no credentials set).
- Line refs point to the app repo; see `recruit4us-product-inventory.md` for detail.

Website section keys: HOME · PIPELINE · CAREERS · CV · ASSESS · CODE · INTERVIEW · SCHED · CANDIDATE · SOURCING · OFFER · AUTOMATION · TRUST (privacy/security) · INTEGRATIONS · TECH (architecture page) · — (not on site).

| Feature | Status | Evidence | Website section |
|---|---|---|---|
| Company workspace, members, roles | VERIFIED CURRENT PRODUCT | `db.server.ts` `requireActor`/`allow`; T-AUTH-001..015 mostly IMPLEMENTED_UNVERIFIED | HOME, TRUST |
| Email/password + Google/X sign-in | PARTIAL | Google/X via host federation `GROK_AUTH_*` (`docs/DEPLOY.md:11`) | — |
| Guest "continue without account" | INFERRED / INTERNAL ONLY | T-SEC-008 PARTIAL | — |
| Jobs lifecycle + published revisions | VERIFIED CURRENT PRODUCT | `migrations/0002_talentflow.sql:61`; T-ATS-001/002 unverified | PIPELINE, CAREERS |
| Public careers page per company | VERIFIED CURRENT PRODUCT | `src/routes/careers/$companySlug/*` | CAREERS |
| Embedded job form with company colors | VERIFIED CURRENT PRODUCT | `src/routes/embed/...`, `embed-theme.ts`, `IMPLEMENTATION_STATUS.md:17` | CAREERS |
| Idempotent apply (no duplicate applications) | VERIFIED CURRENT PRODUCT | T-ATS-005/006 VERIFIED [T] | TECH |
| Application receipt | VERIFIED CURRENT PRODUCT | `sheet.ts` `applicationReceipt`; not emailed (`IMPLEMENTATION_STATUS.md:17`) | CAREERS, CANDIDATE |
| Public `/track` status lookup by email | DO NOT PUBLISH | Email-only, cross-company, RLS-off lookup (`migrations/0027_track_applications.sql:15-31`) | — |
| Pipeline stages, moves, history | VERIFIED CURRENT PRODUCT | T-ATS-007 VERIFIED [T]; stage names `workspace.server.ts:42-51` | PIPELINE |
| Bulk move (≤50 per request) | VERIFIED CURRENT PRODUCT | T-ATS-016 VERIFIED [T] | PIPELINE |
| Reopen withdrawn/rejected; hired stays hired | VERIFIED CURRENT PRODUCT | `rules.ts:124-133` | PIPELINE |
| Candidate merge (same company, preview first) | VERIFIED CURRENT PRODUCT | T-ATS-012 VERIFIED [T] | PIPELINE |
| Notes, tags, saved views | VERIFIED CURRENT PRODUCT | T-ATS-015 VERIFIED [T] | PIPELINE |
| CSV export (formula-safe) | VERIFIED CURRENT PRODUCT | T-ATS-014 VERIFIED [T] | PIPELINE |
| CSV import with dry run + commit | VERIFIED CURRENT PRODUCT | `workspace.server.ts:1679-1720`; T-ATS-013 unverified | PIPELINE |
| CV intake: PDF text, TXT, DOCX; `.doc` kept not read | VERIFIED CURRENT PRODUCT | `screen.ts:179-200`, `docx.ts`; Req I sandbox working | CV |
| File quarantine + local scanner + 5-min download grant | VERIFIED CURRENT PRODUCT | T-ATS-003, T-SEC-001..003 VERIFIED [T]; "not a commercial antivirus" | TRUST |
| OCR of scanned/photo CVs | NOT DONE | `screen.ts:189-194` | — |
| CV must-have screen (not a model) | VERIFIED CURRENT PRODUCT | `screen.ts:118-176`; `IMPLEMENTATION_STATUS.md:13` | CV |
| Screen strictness (aliases / related words) | VERIFIED CURRENT PRODUCT | `screen.ts:65-116` | CV |
| Counted expertise rank + auto-send to top half | PARTIAL | `expertise.ts`, `ladder.server.ts:225-232`; plans "do not yet replace every ladder send" | CV (careful) |
| Resume index (titles, skills, education, locations, years, history) | VERIFIED CURRENT PRODUCT | `cv-index.ts:1-105` | CV |
| Boolean search AND/OR/NOT, quotes, parentheses | VERIFIED CURRENT PRODUCT | `cv-index.ts:108-181`; `cv-index.test.ts` exists | CV |
| Semantic / embedding search | NOT DONE | keyword matcher only (`cv-index.ts:170-181`) | — |
| Knockout questions (min years, work authorization) | VERIFIED CURRENT PRODUCT | `cv-index.ts:215-270`; closes as `REJECTED` (`workspace.server.ts:2300-2308`) | CV |
| Assessment authoring, publish checks | VERIFIED CURRENT PRODUCT | T-ASMT-001..004 VERIFIED [T] | ASSESS |
| Pools with stable seeded subset | VERIFIED CURRENT PRODUCT | T-ASMT-007/008 VERIFIED [T] | ASSESS |
| Archive assessment (versions kept) | VERIFIED CURRENT PRODUCT | T-ASMT-009 unverified | ASSESS |
| Answer keys never sent to the browser | VERIFIED CURRENT PRODUCT | T-ASMT-010 VERIFIED [T]; sentinel check `docs/TEST_REPORT.md` | ASSESS, TRUST |
| Autosave with save-status label | VERIFIED CURRENT PRODUCT | T-ATT-012 VERIFIED [T]; T-ATT-007 unverified | ASSESS |
| Server (database-clock) deadline | VERIFIED CURRENT PRODUCT | T-ATT-004/008 VERIFIED [T]; T-ATT-009 unverified | ASSESS |
| Submission receipt / snapshot | VERIFIED CURRENT PRODUCT | `IMPLEMENTATION_STATUS.md:8`; T-ATT-014 unverified | ASSESS |
| Audited time extension (open attempts only) | VERIFIED CURRENT PRODUCT | T-ATT-019 VERIFIED [T] | ASSESS |
| Accommodation multiplier (1.5× + 120 s) | VERIFIED CURRENT PRODUCT | T-ATT-005/006 VERIFIED [T] | ASSESS |
| Objective scoring (exact, tolerance, weights, thresholds) | VERIFIED CURRENT PRODUCT | T-SCORE-001..009 VERIFIED [T] | ASSESS |
| Pending manual work never stored as zero | VERIFIED CURRENT PRODUCT | T-SCORE-005/006 VERIFIED [T] | ASSESS, CODE |
| External score import with scale | VERIFIED CURRENT PRODUCT | T-SCORE-010 VERIFIED [T] | ASSESS |
| Built-in papers: mental math (20 items), code reading (500-bank, pool 20) | VERIFIED CURRENT PRODUCT | `mental.server.ts:9-13`, `read-code.server.ts:9-15` | ASSESS |
| Save/submit race safety | PARTIAL | T-ATT-015/016 PARTIAL | — |
| Coding: frozen versions + hidden weighted cases (code-bank track) | SANDBOX WORKING | `platform.server.ts:720-800`; Req B sandbox working | CODE |
| Formal judge = JavaScript only, isolated process | SANDBOX WORKING | `runner.server.ts:260-318`, `INTEGRATIONS.md:51`; runner tests [T] (T-SCORE-013/018) | CODE, TECH |
| Formal judge in 12 languages | NOT DONE | `platform.server.ts:938` "Python is not executed" | — |
| 12-language editor with sample runs (Judge0 CE) | PARTIAL | `coding-languages.ts:28-41`, `judge0.server.ts:21-50`; default public endpoint, no live verification in this pass | CODE |
| Sample run is never a score; infra failure ≠ zero | VERIFIED CURRENT PRODUCT | `runner.server.ts:329-358`; T-SCORE-011/014 | CODE |
| Code ranking: cases → time class → space → measured time | VERIFIED CURRENT PRODUCT | `judge.ts:270-305`; `README.md:5` | CODE |
| Complexity class estimate | PARTIAL | regex heuristic, "Heuristic, not a proof" (`platform.server.ts:793`) | CODE (labelled) |
| Hidden cases for all 2,500 bank problems | NOT DONE | only `dedupe` has cases (`judge.ts:194-199`); pipeline papers "not auto-judged" (`ladder.server.ts:47`) | — |
| Rejudge with history | SANDBOX WORKING | `platform.server.ts:987-1010` | CODE |
| Remote formal code judge | NOT DONE | `IMPLEMENTATION_STATUS.md:35` | — |
| Live room: shared source by revision, stale-save rejection | SANDBOX WORKING | Req C; op-transform test in `platform.test.ts` | INTERVIEW |
| Live room: private interviewer notes, reveal, chat, package, run solve.js | SANDBOX WORKING | `src/routes/live/$token.tsx:130-194` | INTERVIEW |
| Live room realtime transport | PARTIAL | polling `setInterval` (`live/$token.tsx:44-56`) | — |
| Hosted video call | NOT DONE | "No hosted video" (`REQUIREMENTS_MATRIX.md:11`) | — |
| Live-room clipboard/screen signals | DO NOT PUBLISH | `live-watch.ts:1-15`, `0028_live_signals.sql` | — |
| Staff live watch of in-progress exams | DO NOT PUBLISH | `attempt-live.server.ts`, `0031_attempt_live.sql` | — |
| Scorecards: job attributes, focus subset, 4-step scale, note, lock, hidden until submit | VERIFIED CURRENT PRODUCT | `scorecard.ts`; T-INT-006/007 VERIFIED [T] | INTERVIEW |
| Scoreboard rank by average recommendation (not a prediction) | VERIFIED CURRENT PRODUCT | `scorecard.ts:18-19, 97+` | INTERVIEW |
| Interview scheduling + ICS (UID/sequence) | VERIFIED CURRENT PRODUCT | T-INT-004 VERIFIED [T]; T-INT-001/005 unverified | SCHED |
| Open slots + self-schedule, exclusive claim, reschedule | SANDBOX WORKING | T-INT-002/008 VERIFIED [T]; Req F | SCHED |
| DST-safe slot times | VERIFIED CURRENT PRODUCT | T-INT-003 VERIFIED [T] | SCHED |
| "Add to Google Calendar" deep link | VERIFIED CURRENT PRODUCT | `src/domain/interview-invite.ts` | SCHED |
| Calendar vendor sync / Google Calendar + Meet | BLOCKED BY EXTERNAL CREDENTIALS | `calendar.server.ts:247-300`; "Google itself is unverified" | INTEGRATIONS |
| Mail templates, attachments, branded sender | VERIFIED CURRENT PRODUCT | `mail.server.ts`, `0026_mail_brand.sql`, `0035_mail_attachments.sql` | AUTOMATION |
| Mail queue with 11 delivery states | SANDBOX WORKING | `delivery.ts:1-13`; T-WF-010/011 VERIFIED [T] | TECH, INTEGRATIONS |
| External SMTP delivery | BLOCKED BY EXTERNAL CREDENTIALS | `PROVIDER_CAPABILITIES.md:5` | INTEGRATIONS |
| Signed inbound / delivery webhooks | BLOCKED BY EXTERNAL CREDENTIALS | `MAIL_INBOUND_SECRET`; T-WF-014 VERIFIED [T] | INTEGRATIONS |
| Automatic suppression on bounce | NOT DONE | manual only (`platform.server.ts:706-710`) vs `INTEGRATIONS.md:14` | — |
| Candidate portal (signed-in) | VERIFIED CURRENT PRODUCT | `src/routes/candidate/*` | CANDIDATE |
| Application portal with email one-time code | VERIFIED CURRENT PRODUCT (logic) / BLOCKED BY EXTERNAL CREDENTIALS (real code delivery) | `portal-otp.ts:4-18`; `portal-otp.test.ts`; the code is sent through the mail queue (`portal.server.ts` `createAndSendPortalOtp` → `queueSystemMail`), so without SMTP it stays in the workspace mailbox | CANDIDATE, TRUST |
| Candidate-facing notifications (assessment/code invites, interview, offer, onboarding mail) | BLOCKED BY EXTERNAL CREDENTIALS | all go through `message_intents` (`docs/REQUIREMENTS_MATRIX.md:9`); stored, not delivered, without SMTP | INTEGRATIONS |
| Candidate JSON download | VERIFIED CURRENT PRODUCT | T-SEC-010 VERIFIED [T]; minimal fields (`assess.server.ts:2144-2149`) | CANDIDATE, TRUST |
| Privacy: remove files past retention (manual) | VERIFIED CURRENT PRODUCT | T-SEC-009 VERIFIED [T]; `settings.tsx:123` | TRUST |
| Deletion requests + anonymize (company-scoped) | VERIFIED CURRENT PRODUCT | `settings.tsx:125-129`; not backups (`DATA_MODEL.md:23`) | TRUST |
| Postgres RLS on employer tables | VERIFIED CURRENT PRODUCT | T-AUTH-006..008 VERIFIED [T] on embedded PG; not tested on hosted Neon | TRUST, TECH |
| Composite FKs block cross-company links | VERIFIED CURRENT PRODUCT | T-AUTH-006 VERIFIED [T] | TECH |
| Database-per-customer isolation | NOT DONE | shared schema + RLS (`0006_rls_policies.sql`) | — |
| Compensation hidden by role | VERIFIED CURRENT PRODUCT | T-OFFER-006 VERIFIED [T] | OFFER, TRUST |
| Integrity events + similarity cases, human dismiss/confirm, no score change | VERIFIED CURRENT PRODUCT | `integrity.ts:3-41`; Req D partial | ASSESS, TRUST |
| Webcam / face-count browser proctor | DO NOT PUBLISH | `proctor.tsx`; directive §55; "not a certified exam browser" | — |
| Plagiarism vendor | NOT DONE | `REQUIREMENTS_MATRIX.md:12` | — |
| Work-style questionnaire (5 scales, type code, not MBTI/16P, not a cutoff) | VERIFIED CURRENT PRODUCT | `personality.ts`, `personality.server.ts`; plans refuse cutoff `plans.ts:85-88` | ASSESS (secondary) |
| Work-style statement count "25" | PARTIAL | code publishes 125 (`personality.server.ts:9-14`) vs docs 25 | — (avoid a number) |
| Prospects, pools, referrals, consented campaigns | SANDBOX WORKING | Req E; consent gate `growth.server.ts:121` | SOURCING |
| Job distribution: sandbox board | SANDBOX WORKING | `growth.server.ts:164-240` | SOURCING |
| External job board push | BLOCKED BY EXTERNAL CREDENTIALS | `JOB_BOARD_URL`/`JOB_BOARD_TOKEN` | INTEGRATIONS |
| LinkedIn | NOT DONE | always `CONFIG_REQUIRED` (`growth.server.ts:170-171`) | — |
| Offers: revisions, approval per revision, candidate accept/decline | VERIFIED CURRENT PRODUCT | T-OFFER-004/006 VERIFIED [T]; 001-003/005 unverified | OFFER |
| E-signature | NOT DONE | `PROVIDER_CAPABILITIES.md:16` | — |
| Onboarding tasks from role/location template, reminders, cancel keeps offer | SANDBOX WORKING | `plans.ts:104-121`, `growth.server.ts:537-603` | OFFER |
| HR handoff download | SANDBOX WORKING | `growth.server.ts:626-628` | OFFER |
| HRIS push (generic endpoint) | BLOCKED BY EXTERNAL CREDENTIALS | `HRIS_EXPORT_URL`/`HRIS_EXPORT_TOKEN` | INTEGRATIONS |
| Named HRIS (Workday, BambooHR, SuccessFactors…) | NOT DONE | no adapter in code | — |
| Hiring plans: versioned custom stages, cutoff with ties, explain, actor+reason | SANDBOX WORKING | Req H; `growth.server.ts:393-520` | AUTOMATION |
| Rules with dry run, receipts, depth limit | VERIFIED CURRENT PRODUCT | T-WF-001/003/010/011/014-016 VERIFIED [T]; T-WF-006 unverified | AUTOMATION |
| Automatic rejection by rule | NOT DONE (by design) | no reject action (`ops.ts:12`) | — |
| SMS / text sending | NOT DONE | captured only (`ops.server.ts:257-287`) | — |
| Analytics extract to https destination | SANDBOX WORKING | `ops.server.ts:288-400`; destination in Connectors | INTEGRATIONS |
| Audit log | VERIFIED CURRENT PRODUCT | `audit()` calls; Settings → Audit | TRUST |
| Reports: distinct funnel, FINAL-only score distribution, local day | VERIFIED CURRENT PRODUCT | T-REPORT-001..003 VERIFIED [T] | PIPELINE |
| Outbox leasing / optional worker | INFERRED / INTERNAL ONLY | `OPERATIONS.md`; T-WF-008/009 PARTIAL | TECH |
| Object storage S3/R2 | BLOCKED BY EXTERNAL CREDENTIALS | `object-store.ts` SigV4; `INTEGRATIONS.md:32-41` | INTEGRATIONS |
| Spanish UI | PARTIAL | exact-string catalog, unknown text stays English (`catalog.ts:1`) | — (don't claim fully Spanish) |
| Accessibility (skip link, focus, reduced motion) | PARTIAL | T-UI-001 unverified, no axe suite | — |
| Load / performance numbers | NOT DONE | `TEST_REPORT.md` "No performance numbers are claimed" | — |
| GDPR / SOC 2 / EEOC compliance | DO NOT PUBLISH | `SECURITY.md:21` | — |
| Acceptance coverage "63 of 130" | DO NOT PUBLISH | directive §128; `COMPLETION_MATRIX.md:13` | — |
| Pricing, customers, logos, testimonials, metrics | OWNER PROVIDED | none exist in the repo | — until supplied |
