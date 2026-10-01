# RECRUIT4US — Product inventory (marketing-truth baseline)

Discovery date: 2026-09-30. Branch `website-vnext`, HEAD `f0996fc`. Read-only pass over the app repository; no code, migrations or git state were changed.

Scope: every product area the public website may talk about, with what it does, where the code lives, the route(s), and the limitations that constrain public wording. Paths are relative to the app repo root (`/workspace/creto-recruiting4us-loc`). `file:N` = line number, `file:N-M` = range.

> Test execution note: the domain test suite was **not re-run** in this pass. The sandbox has Node 20.19.2 and the suite needs Node 22 (`--experimental-strip-types`, `package.json:21`). "Verified" statements below rely on reading the code plus `docs/COMPLETION_MATRIX.md` and `docs/TEST_REPORT.md` (dated 2026-09-28).

---

## 0. Product shape at a glance

| Fact | Value | Source |
|---|---|---|
| Positioning (repo's own words) | "Hiring workspace for one company at a time: careers pages, a pipeline, assessments, interviews, and offers." | `README.md:3` |
| Architecture | Modular monolith: TanStack Start server functions → Better Auth → PostgreSQL (PGLite in preview, Neon when `DATABASE_URL` set) | `docs/ARCHITECTURE.md:1-16`, `docs/DECISIONS/0001-runtime.md` |
| Server functions exposed | 188 `createServerFn` exports | `src/server/talent.functions.ts` |
| Recruiter navigation | Hiring (Dashboard, Jobs, Candidates) · Evaluate (Assessments, Reviews, Scheduling, Sandboxes) · Decide (Hiring = offers + plans + onboarding) · Reach (Mail, Sourcing) · Operate (Automations, Integrity, Connectors, Settings) | `src/components/talent/kit.tsx:335-375` |
| UI languages | English with an EN/ES toggle; Spanish is an exact-string catalog, "Unknown text stays in English" (partial) | `src/lib/i18n/catalog.ts:1`, `src/lib/i18n/provider.tsx:14-35` |
| Acceptance coverage (internal only) | 63 of 130 VERIFIED, 59 implemented-unverified, 8 partial | `docs/COMPLETION_MATRIX.md:5-13` |
| Compliance stance | "not claimed to be GDPR, EEOC, or SOC 2 compliant" | `docs/SECURITY.md:21` |
| Parity stance | "This is not Greenhouse or HackerRank parity." | `docs/REQUIREMENTS_MATRIX.md:21` |

---

## 1. Sign-in, companies, members, roles

- **What it does**: Better Auth sessions (email/password; Google / X through the preview host's federation), a "Continue without an account" guest that creates a real user, company creation, member invitations, role-based permissions (`allow()` / `roleHas()`), last-owner protection.
- **Code**: `src/routes/login.tsx`, `src/routes/api/auth/$.ts`, `src/routes/invite/$token.tsx`, `src/server/talent/db.server.ts` (`requireActor`, `allow`), `src/domain/rules.ts` (role matrix).
- **Routes**: `/login`, `/app`, `/invite/$token`, `/app/$companySlug/settings` (Members tab).
- **Limitations**: Google/X sign-in depends on host-injected `GROK_AUTH_*` values (`docs/DEPLOY.md:11`); a self-hosted deploy must set them. No SAML/SSO (`docs/PROVIDER_CAPABILITIES.md:16`). Guest entry is a preview convenience, flagged PARTIAL (`docs/COMPLETION_MATRIX.md` T-SEC-008). Rate limits are per-instance (`docs/SECURITY.md:20`).

## 2. Jobs and public careers pages

- **What it does**: draft → published → paused/closed/archived job lifecycle; published revisions are what the public sees; salary range optionally visible; departments, locations, work arrangement; company page styling (headline, colors).
- **Code**: `src/server/talent/workspace.server.ts` (`createJob` 595-622, `listPublicJobs` 1881+), `migrations/0002_talentflow.sql:61` (job status check), `migrations/0016_company_page.sql`, `migrations/0034_job_window.sql`.
- **Routes**: `/app/$companySlug/jobs`, `/app/$companySlug/jobs/$jobId`, public `/careers/$companySlug`, `/careers/$companySlug/$jobSlug`.
- **Limitations**: public reads are application-filtered to published jobs; under RLS a public slug context can see that company's rows, so "published only" is an app-level rule (`migrations/0006_rls_policies.sql:36-43`, `docs/ARCHITECTURE.md:13`). T-ATS-001/002 are IMPLEMENTED_UNVERIFIED.

## 3. Embedded job form (iframe)

- **What it does**: a published job can be embedded; form collects name, email, essays and a CV; white by default, per-company background/text/button colors with contrast check; receipt shown on the page.
- **Code**: `src/routes/embed/$companySlug/$jobSlug.tsx`, `src/domain/embed-theme.ts`, `migrations/0011_embed_theme.sql`, Settings color pickers `src/routes/app/$companySlug/settings.tsx:173-201`.
- **Routes**: `/embed/$companySlug/$jobSlug`.
- **Limitations**: receipt "is shown on the page and stored. It is not emailed." (`docs/IMPLEMENTATION_STATUS.md:17`).

## 4. Applications, candidates, idempotent apply, receipts, tracking

- **What it does**: public and signed-in apply with an idempotency key + payload hash (same key, different body = conflict); one active application per company/job/candidate; application receipt; staff can merge candidates (preview then commit, same company only), record an external score, add 5 minutes to an open attempt, reopen a withdrawal. Hired cannot be reopened.
- **Code**: `workspace.server.ts:2004-2340` (apply), `src/domain/rules.ts:124-133` (lifecycle edges: ACTIVE→REJECTED/WITHDRAWN/HIRED; REJECTED/WITHDRAWN→ACTIVE; HIRED→ACTIVE refused), `src/domain/sheet.ts` (receipt), `src/routes/track.tsx`, `workspace.server.ts:1841-1879` (`trackApplications`).
- **Routes**: `/app/$companySlug/candidates`, `/app/$companySlug/applications/$applicationId`, public `/track`.
- **Limitations / risk**: `/track` accepts **an email alone** and returns company, job title and stage (including "Not moving forward") across all companies via a `security definer` SQL function with `row_security = off` (`migrations/0027_track_applications.sql:15-31`). Treat as internal; do **not** market `/track` as a privacy feature.

## 5. Pipeline, stages, bulk moves, lifecycle

- **What it does**: per-job stages with categories APPLIED / SCREEN / ASSESSMENT / INTERVIEW / OFFER / DECISION; moves with optimistic version; stage history + outbox row written in one transaction; bulk move (≤50 per request) with remainder; stages archived rather than deleted; candidate-facing stage labels hide internal reasons.
- **Default stage names for a new job** (`workspace.server.ts:42-51`, inserted at 612-617): `Applied`, `Expertise rank`, `Coding screen`, `Math and personality`, `Final problems`, `Interview`, `Offer`, `Decision`. The same list is the "ladder" (`src/server/talent/ladder.server.ts:12-21`).
- **Candidate-facing labels** (`src/domain/rules.ts:136-156`): Application received · In review · Assessment · Interview · Offer · Decision · Not moving forward · Withdrawn · Hired.
- **Code**: `workspace.server.ts` (`moveApplication`, `bulkMove`, `setLifecycle`), `src/domain/rules.ts` (`bulkProgress`), `migrations/0015_pipeline_ranks.sql`.
- **Routes**: `/app/$companySlug/jobs/$jobId/pipeline`.
- **Limitations**: bulk is in-request, not a worker (`COMPLETION_MATRIX` T-ATS-016). Spanish UI translates only some labels (e.g. `Applied` → "Postuló", `src/lib/i18n/catalog.ts:222`).

## 6. Notes, tags, saved views

- **What it does**: notes and tags on candidates/applications; saved view filters validated.
- **Code**: `talent.functions.ts` (`addNote`, `addTag`), `src/domain/rules.ts` (`validateSavedViewFilters`, VERIFIED T-ATS-015).
- **Routes**: application detail page.
- **Limitations**: none notable beyond role permissions.

## 7. CSV export and CSV import

- **What it does**: CSV export with spreadsheet-formula escaping (VERIFIED T-ATS-014); application answers sheet download; CSV import of candidates (`name,email,source`) with **dry-run report** and an explicit commit.
- **Code**: `workspace.server.ts:1679-1720` (`importCsv`, `commit` flag at 1702), `src/domain/rules.ts` (`escapeCsvCell`, `toCsv`), `src/domain/sheet.ts` (`applicationSheetCsv`).
- **Routes**: `/app/$companySlug/candidates` (sample text `src/routes/app/$companySlug/candidates.tsx:21`).
- **Limitations**: dry-run non-insertion is IMPLEMENTED_UNVERIFIED (T-ATS-013).

## 8. CV / resume intake and file safety

- **What it does**: PDF text extraction, plain text, DOCX inflate + index; legacy `.doc` kept but not extracted; mislabeled/non-zip files refused; macros never run; upload goes to `QUARANTINE`, then a local demo scanner marks `CLEAN`/`INFECTED`; downloads only for `CLEAN` via a 5-minute grant.
- **Code**: `src/domain/screen.ts:179-200` (`extractResumeText`: images → "cannot read"; scanned PDF → unreadable), `src/domain/platform/docx.ts` (`sniffResume`, `extractOffice`), `src/server/talent/resume-text.ts`, `src/domain/rules.ts` (`filePolicy`, `grantAllows`).
- **Limitations**: no OCR ("A scanned image is not read", `screen.ts:189`); "not a commercial antivirus" (`docs/PROVIDER_CAPABILITIES.md:6`).

## 9. CV screening (must-have words)

- **What it does**: checks the job's must-have terms in the CV text; all must be present to auto-send the job's assessment; missing CV / unreadable file / missing skill → no send; preferred skills are listed but "do not decide"; a strictness setting allows close forms (`js`↔`javascript`, `postgres`↔`postgresql`) below 75 and a broader related-word family (incl. some Spanish words: `programar`, `liderazgo`) below 40; auto-send can be turned off per assessment.
- **Outcomes**: `GOOD` / `NOT_A_FIT` / `NEEDS_A_PERSON` with action `SEND` / `DO_NOT_SEND` (`src/domain/screen.ts:3-4`).
- **Code**: `src/domain/screen.ts:56-176`, `src/server/talent/screen.server.ts:120+` (`runCvScreen`), `migrations/0008_cv_screens.sql`, `migrations/0012_proctor_bank.sql:5` (`auto_send`).
- **Limitations**: "This is not a model score, and it does not read photos" (`docs/IMPLEMENTATION_STATUS.md:13`). Reason text: "It does not score schools, photos, age, or names" (`screen.ts:139`). A NOT_A_FIT result does **not** change lifecycle; it only withholds the send.

## 10. Expertise rank ("top half") ladder

- **What it does**: after a CV is stored, ranks readable resumes by a counted score (must-have, preferred, years mentioned, phrases like "shipped", "led", "mentored", "on-call", "open source") and **automatically sends** the next paper to the top half (ties at the cutoff included): Coding screen → Math + work-style → Final problems. Reject and Pass work at every stage; a later rank does not withdraw a paper already sent.
- **Code**: `src/domain/expertise.ts:15-24` (signals and points), `src/domain/half.ts` (`rankTopHalf`), `src/server/talent/ladder.server.ts:225-232` (`advanceJob`), 40-50 (papers).
- **Limitations**: "It is not a model" (`docs/IMPLEMENTATION_STATUS.md:14`). Unreadable CVs are left out of the ranking (`expertise.ts:33-38`). This is automated *progression* (sending tests), not automated rejection — but it is still automation the site must describe precisely.

## 11. Resume index + Boolean recruiter search

- **What it does**: indexes titles, skills, education, locations, years, work-history lines from the text; search supports AND / OR / NOT (any case), quotes, parentheses; unquoted words without an operator must all appear; location / education / custom-phrase filters omit people whose index or answers lack the text.
- **Code**: `src/domain/cv-index.ts:1-22` (profile), 23-105 (`parseResumeProfile`), 108-168 (`compileBoolean`), 170-181 (`compileSearch`), `migrations/0017_cv_index.sql`.
- **Limitations**: keyword/regex extraction only; fixed skill vocabulary of 16 words for the profile (`cv-index.ts:17-20`); no semantic/embedding search; no OCR.

## 12. Knockout questions

- **What it does**: employer-published minimum years of experience and a work-authorization Yes/No; a failed knockout stores the application and **sets lifecycle `REJECTED`** with the reason.
- **Code**: `src/domain/cv-index.ts:215-247` (`knockoutResult`), 249+ (`applicationForm`), `workspace.server.ts:2300-2308` (sets `REJECTED`, writes stage event).
- **Limitations**: this is an automatic closure on an explicit employer rule, not a model. Staff can reopen (REJECTED→ACTIVE allowed, `rules.ts:129`). Public wording must say "cierra la postulación según criterios que define el empleador", never "IA rechaza".

## 13. Assessments: authoring, pools, publish/archive, attempts

- **What it does**: draft assessments with sections, weights (must total 10000 bp), objective keys and human rubrics; publish checks; pool draws (`pool_pick`) with a seeded stable subset stored on the attempt; archive keeps versions; start is an explicit button (timer does not start from the email link); autosave with revision + mutation id; server deadline from database `now()` (exclusive boundary); submission snapshot + receipt; audited extensions only while `IN_PROGRESS`; accommodation multiplier (1.5× + 120 s).
- **Question types**: single/multi choice, numeric with tolerance, text (rubric), code; human-reviewed `sql`, `spreadsheet`, `recording` types exist but are not executed (`docs/DATA_MODEL.md:15`); `likert` for the work-style questionnaire.
- **Code**: `src/server/talent/assess.server.ts` (2620 lines), `src/domain/rules.ts` (`calculateAttemptDeadline`, `acceptsResponseAt`, `planExtension`, `calculateWeightedScore`), `src/routes/candidate/attempts/$attemptId.tsx`, `src/routes/assess/$token.tsx`.
- **Routes**: `/app/$companySlug/assessments`, `/app/$companySlug/reviews`, candidate `/candidate/attempts/$attemptId`, invite `/assess/$token`.
- **Built-in papers seeded per company**: Pipeline · Coding screen (75 min, 3 medium + 2 hard from the bank, "not auto-judged. A person scores them", `ladder.server.ts:44-47`); Pipeline · Final problems (60 min, 3 hard, 48-50); Assessment 4 · Mental math (15 min, 20 items, `mental.server.ts:9-13`); Assessment 3 · Personality (work-style, §24); Assessment · Code reading (500-item MCQ bank, pool of 20, 45 min, auto-graded, `read-code.server.ts:9-15`).
- **Limitations**: "A calculator, a second device, or a photograph of the screen is still possible" (`docs/IMPLEMENTATION_STATUS.md:16`). Concurrency races on save/submit are PARTIAL (T-ATT-015/016). Seed exercises are "not a validated hiring instrument" (`seed.server.ts:15`).

## 14. Objective scoring and external scores

- **What it does**: exact-set choice, numeric tolerance, weighted sections (e.g. 8750 fixture), pass threshold (1599/2000 fails 80%), pending manual sections stay pending (never zero), operational failure = `FAILED` with null score; external score import maps e.g. 8/10 → 8000 bp, unparseable → FAILED.
- **Code**: `src/domain/rules.ts`, `src/domain/completion.ts`; all T-SCORE-001…010 VERIFIED (`docs/COMPLETION_MATRIX.md:103-112`).
- **Limitations**: no vendor assessment integration; import is manual (`docs/PROVIDER_CAPABILITIES.md:11`).

## 15. Coding: two distinct tracks (do not conflate)

**15a. Code bank / "Sandboxes" track (formal judge, JavaScript only)**
- **What it does**: import an 18-question catalog (`src/server/talent/question-corpus.ts:23+`) into company coding questions with **frozen versions** and **SAMPLE vs HIDDEN weighted cases**; invite one application (`/code/$token`, 7-day link bound to the candidate email); sample runs use only sample cases; final submission runs all cases; hidden expected answers never leave the server; statuses JUDGED / TIMED_OUT / COMPILE / OUTPUT / INFRA; a timeout or infra failure "is not stored as zero"; staff can rejudge (history kept); optional integrity consent gate.
- **Code**: `src/server/talent/platform.server.ts:720-800` (`loadCases`, `execute`, `storeRun`), 812-845 (catalog import, `languages = 'javascript'`), 846-915 (`inviteToCode`), 916-941 (`getCodeExercise`, note "Python is not executed"), 943-963 (`runCode`), 987-1010 (`rejudgeSubmission`); runner `src/server/talent/runner.server.ts:260-318` (`judgeIsolated`); isolation flags in `docs/INTEGRATIONS.md:51`.
- **Isolation**: `unshare --user --map-root-user --net --mount --pid`, Node `--permission`, 64 MB heap, tmpfs over host dirs, 1.5 s timeout, output cap. Missing `unshare` → REFUSED, no score.
- **Limitation**: JavaScript only; "Not a hypervisor. No remote execution provider." (`docs/REQUIREMENTS_MATRIX.md:10`). On hosts without `unshare` (the `.env.example` notes Vercel uses Judge0 for samples) the formal judge refuses — inferred production risk, not verified.

**15b. Assessment code items (12-language editor, Judge0 sample runs)**
- **What it does**: a 2,500-problem original coding bank (`src/domain/coding-bank.test.ts:8` asserts 2500; 50 hand-written + `coding-bank-extra.ts` + `coding-bank-wave2.ts`, many templated variants such as "Reverse text 43"); candidates pick one of **12 languages**: TypeScript, JavaScript, Python, Java, C++, Go, Rust, C#, Ruby, PHP, Kotlin, Swift (`src/domain/coding-languages.ts:28-41`); **sample runs** go to Judge0 CE (default `https://ce.judge0.com`, `judge0.server.ts:48-50`) or the local Node jail for JS/TS when `SAMPLE_RUN_LOCAL=1` (`runner.server.ts:329-358`). "A sample run is never a score."
- **Review ranking**: submitted code is ranked by (1) correctness band / cases passed, (2) estimated time class, (3) space class, (4) measured time; ties share a rank; timeouts/failures unranked (`src/domain/judge.ts:270-305`). Score formula: up to 7000 for cases passed, 2000 time class, 1000 measured time; class/speed credit only when every case passes (`judge.ts:228-258`). Complexity class is a regex heuristic ("Heuristic, not a proof", `platform.server.ts:793`).
- **Important limitation**: hidden judge cases exist only for the seeded `deduplicateEvents` problem — "Other code is ranked on the estimate only" (`judge.ts:194-199`). The pipeline coding papers are explicitly "not auto-judged. A person scores them" (`ladder.server.ts:47`). Human rubric remains required (`docs/IMPLEMENTATION_STATUS.md:12`).

## 16. Live interview room

- **What it does**: token room opened from an application; interviewer admits the candidate; shared source by revision with stale-save rejection / op transform; multiple files; hidden question until an interviewer reveals it; chat with **private interviewer notes** filtered from the candidate; "Run solve.js" through the JS judge; review package (source + revision); cursor positions (not painted carets); optional external meeting URL.
- **Code**: `src/domain/platform/collab.ts`, `platform.server.ts:1012-1346` (`openLive`, `readLive`, `syncLive` 1164, `admitLive`, `livePackage`, `runLiveSample`), `src/routes/live/$token.tsx` (poll loop at 44-56).
- **Routes**: `/live/$token`.
- **Limitations**: sync is polling (`setInterval`), not a realtime socket; "No hosted video" (`docs/REQUIREMENTS_MATRIX.md:11`); no automated multi-browser test. Live signals (screen count, left app, copy/paste **with clipboard text up to 240 chars**) are shown to interviewers (`src/domain/live-watch.ts:1-15`, `migrations/0028_live_signals.sql`) — privacy-sensitive, do not market.

## 17. Interview scheduling, slots, self-schedule, ICS, Google

- **What it does**: schedule interviews with participants and timezone; ICS download with stable UID and increasing SEQUENCE; cancel sets ICS method; recruiter-created open slots; self-schedule links (`/book/$token`) where one claim closes the slot for everyone (exclusive update, VERIFIED T-INT-002/008); reschedule releases the old slot; DST gap/overlap rejected (VERIFIED T-INT-003); "Add to Google Calendar" deep link; generic calendar vendor push and Google Calendar `events.insert` with Meet when configured; `SYNC_FAILED` retry.
- **Code**: `src/server/talent/schedule.server.ts:70-330, 526-586`, `src/domain/platform/booking.ts`, `src/server/talent/calendar.server.ts:69-305` (`createGoogleMeetInterview` 247-300), `src/domain/interview-invite.ts` (deep link), `src/routes/book/$token.tsx`.
- **Routes**: `/app/$companySlug/interviews` (nav label "Scheduling"), `/app/$companySlug/calendar`, `/book/$token`.
- **Limitations**: without credentials, provider = `sandbox`, status `LOCAL`, no Meet link (`calendar.server.ts:262-270`); "Google itself is unverified" (`docs/REQUIREMENTS_MATRIX.md:15`).

## 18. Interview scorecards and scoreboard

- **What it does**: recruiter writes up to 12 attributes per job (defaults: "Evidence for the role", "Collaboration", "Communication"); each interview gets a focus subset; interviewer rates each focus attribute and an overall recommendation on the **same four-step scale** — UI labels exactly `Definite no`, `No`, `Yes`, `Strong yes` (points 0-3); a note of at least 8 characters is required ("Write a short note with the recommendation."); submitted scorecards cannot be edited; peers' scorecards hidden until you submit (managers can read submitted ones); scoreboard ranks by average overall recommendation, ties share a rank, attribute ratings not averaged in.
- **Code**: `src/domain/scorecard.ts:1-6` (RATINGS), 12-16 (defaults), 18-19 (SCOREBOARD_NOTE), 78-90 (`submissionError`), 97+ (`rankScoreboard`); `schedule.server.ts:332-525` (`submitFeedback`, `feedbackFor`, `listScoreboard`); `migrations/0018_scorecards.sql`.
- **Limitations**: "This is not a prediction, and it does not move anyone on the pipeline." (`scorecard.ts:19`). Spanish UI does not translate "Definite no"/"Strong yes" (only "No"), per `catalog.ts`.

## 19. Mail: templates, queue, delivery states, inbox, attachments

- **What it does**: recruiter mail from an application with templates and merge fields, cc/bcc, file attachments, company from-name and logo; a delivery queue (`message_intents`) with states **QUEUED, SENDING, STORED, ACCEPTED, DELIVERED, DEFERRED, BOUNCED, COMPLAINED, FAILED, SUPPRESSED, CANCELLED** (`src/domain/platform/delivery.ts:1-13`); in-product copies in `mail_messages` stay `CAPTURED`; sandbox test domains `@bounce.example`, `@defer.example`, `@fail.example` (`delivery.ts:97-102`); SMTP adapter (a 250 = ACCEPTED, "Acceptance is not delivery"); signed inbound/delivery webhook; manual suppress / unsuppress (Resend API optional); candidate replies from the portal stored on the application; outbox leasing + optional `npm run outbox:worker`.
- **Code**: `src/server/talent/mail.server.ts`, `platform.server.ts:104-718` (`drainMail`, `queueMail`, `receiveMailEvent`), `src/server/talent/smtp.server.ts`, `src/routes/api/mail/events.ts`, `src/routes/api/ops/drain-mail.ts` (Bearer `DRAIN_TOKEN`), `migrations/0019_mail_suite.sql`, `0026_mail_brand.sql`, `0035_mail_attachments.sql`.
- **Routes**: `/app/$companySlug/mail`, `/app/$companySlug/inbox`, Settings → Inbox.
- **Limitations**: no SMTP configured in this workspace, so real inboxes are not reached (`docs/PROVIDER_CAPABILITIES.md:5`). **Doc/code mismatch**: `docs/INTEGRATIONS.md:14` says "Bounces are suppressed", but the code keeps suppression a manual recruiter action (`platform.server.ts:706-710`).

## 20. Candidate portal (signed-in) and application portal (email code)

- **What it does**:
  - `/candidate` (signed-in): the person's applications across employers, assessment invitations, attempts, offers (accept/decline), onboarding tasks, messages; **"Download my data"** → `recruit4us-export.json` (`src/routes/candidate/index.tsx:26-35`).
  - `/portal` (no account): company-scoped email one-time code — 6 digits, 12-minute TTL, 5 verify attempts, 5 requests per 15 min, hashed at rest (`src/domain/portal-otp.ts:4-18`); shows progress, assessments, interviews, offers and messages for that employer (`src/domain/application-portal.ts:13`); reply to mail.
- **Code**: `src/server/talent/portal.server.ts:144-547`, `assess.server.ts:2132-2151` (`exportMine`), `src/domain/rules.ts:840-843` (`candidateExportPayload`).
- **Limitations**: the JSON download contains only job title, company name, lifecycle, submitted-at per application (`assess.server.ts:2144-2149`) — not answers, files, scores or messages; it is available on `/candidate`, not on the OTP `/portal`. Legacy email+UUID unlock and `?access=` links remain server-side (`docs/SECURITY.md:15`).

## 21. Privacy, retention, deletion requests, anonymize

- **What it does**: Settings → Privacy "Remove files past retention" (manual button; retention days min 30, default 365, `src/domain/rules.ts:835-838`, `settings.tsx:51,123`); candidate deletion requests; Anonymize removes contact data and files in that company only (`settings.tsx:125-129`); integrity events auto-deleted after the integrity policy's retention days (`platform.server.ts:1413-1417`).
- **Limitations**: not scheduled automatically; "does not promise erasure from backups" (`docs/DATA_MODEL.md:23`); a restored dump brings anonymized people back (`docs/RUNBOOK.md` Backup).

## 22. Tenant isolation / row-level security

- **What it does**: every table with `company_id` gets `ENABLE` + `FORCE ROW LEVEL SECURITY` and a `tenant_isolation` policy via `app_row_visible(company_id)` (`migrations/0006_rls_policies.sql:176-200`); transaction-local `app.company_id` / `app.user_id` / `app.public_slug`; the app assumes the non-bypass `app_user` role inside transactions when the connection could bypass RLS (`src/lib/db.ts:111-123`); composite foreign keys `(company_id, id)` prevent cross-company links; server derives company from membership, not from the request.
- **Evidence**: T-AUTH-006/007/008 VERIFIED against embedded Postgres as `app_user` (`docs/COMPLETION_MATRIX.md:24-26`).
- **Limitations**: "not against a hosted Neon role" (`docs/TEST_REPORT.md` Not run); several cross-tenant API tests are IMPLEMENTED_UNVERIFIED (T-AUTH-004/005/009-015); shared database, not database-per-customer. Security-definer helper functions (e.g. `/track`) intentionally bypass RLS.

## 23. Integrity and similarity signals (+ optional browser proctor)

- **What it does**: per-assessment integrity policy (consent text, accommodation text, similarity threshold 50-100, retention 1-365 days); coding run requires consent confirmation when consent text exists ("Refusing does not reject you by itself"); code-to-code similarity (5-token shingles Jaccard, `src/domain/platform/integrity.ts:3-30`) opens a case at/above threshold; a person marks **Dismissed** (false positive) or **Confirmed**; `signalChangesScore()` returns `false` (`integrity.ts:32-35`); score never changes.
- **Optional browser proctor on proctored assessment versions** (not in the directive, not in IMPLEMENTATION_STATUS): the exam is locked until the camera is on; logs CAMERA_GRANTED/DENIED/ENDED, TAB_HIDDEN, WINDOW_BLUR, FULLSCREEN_LEFT, COPY, PASTE, HEARTBEAT and — where the browser exposes the experimental `FaceDetector` API — NO_FACE / EXTRA_FACE; "Frames are not stored. This is not a certified exam browser." (`src/components/talent/proctor.tsx:73-190`, `src/domain/proctor.ts`, `migrations/0012_proctor_bank.sql:1-3`, `0034_assignment_proctored.sql`, `src/routes/app/$companySlug/assessments.tsx:167-170`).
- **Recruiter live watch of in-progress exams**: staff can mirror an attempt's buffer and chat (`src/server/talent/attempt-live.server.ts`, `migrations/0031_attempt_live.sql:1`).
- **Limitations**: "No webcam storage. No plagiarism vendor. Focus events are not proof." (`docs/REQUIREMENTS_MATRIX.md:12`). Product copy is internally inconsistent: Integrity page says "A camera is not required" (`platform.server.ts:1428`) while proctored versions require one. Directive §55 forbids marketing webcam proctoring — keep DO NOT PUBLISH.

## 24. Work-style questionnaire

- **What it does**: "Assessment 3 · Personality", auto-published per company; 5-point agree↔disagree Likert (Agree, Slightly agree, In the middle, Slightly disagree, Disagree; `src/domain/personality.ts:1-7`); five scales mind (E/I), information (S/N), decisions (T/F), structure (J/P), identity (A/T) (`personality.ts:9-15`); produces a code such as `ESTJ-A`; a tied scale stays tied (no type); original wording; `auto_send = false`; 40-minute limit; `score_release = AGGREGATE`.
- **Statement count — CONTRADICTION**: docs say **25** (`docs/IMPLEMENTATION_STATUS.md:28`). The code now publishes **125** statements (25 per scale): `PERSONALITY_ITEMS` has 125 entries (first 25 marked core, then "Extended item bank"), instructions say "One hundred twenty-five statements", content hash `work-style-125` (`personality.ts:26-51`, `src/server/talent/personality.server.ts:9-14, 82`). Ladder still references `work-style-25` as the paper key (`ladder.server.ts:230`).
- **Limitations**: "not the 16Personalities test and not the Myers-Briggs Type Indicator … not a hiring decision and not a clinical result" (`personality.ts:223-224`). Plans refuse a personality cutoff (`src/domain/platform/plans.ts:85-88`).

## 25. Sourcing: prospects, pools, referrals, campaigns

- **What it does**: prospects (with consent YES/NO/UNKNOWN, notes), pools, employee referrals tracked through `APPLIED` to `HIRED` when onboarding opens, convert prospect → application; campaigns enroll a prospect **only with consent = YES** and queue one message through the same mail queue; a reply or bounce stops the enrollment; campaigns can be paused.
- **Code**: `src/server/talent/growth.server.ts:12-160`, consent check at 121, `src/domain/platform/crm.ts`.
- **Routes**: `/app/$companySlug/crm` (nav "Sourcing").
- **Limitations**: consent is recorded by staff (no candidate double opt-in); a campaign is a single queued message per enrollment, not a multi-step cadence; "Referrer UI does not show private notes" (`docs/REQUIREMENTS_MATRIX.md:13`).

## 26. Job distribution (boards)

- **What it does**: publish/unpublish/reconcile per board; `sandbox-board` and `careers-page` publish inside the workspace and say so; any other board name POSTs to `JOB_BOARD_URL` with `JOB_BOARD_TOKEN` and an idempotency key; `linkedin` always returns `CONFIG_REQUIRED` "LinkedIn is not connected".
- **Code**: `growth.server.ts:164-240`.
- **Limitations**: no named board integrations; LinkedIn not connected.

## 27. Offers

- **What it does**: offer revisions (title, salary in minor units, currency, start date, message); approval tied to the exact revision; send requires approval of the current revision; candidate accepts/declines the current revision once (unique response, VERIFIED T-OFFER-004); compensation hidden for roles without `offer.read_comp` (VERIFIED T-OFFER-006).
- **Code**: `schedule.server.ts:588-821`, `src/routes/app/$companySlug/offers.tsx` (nav "Hiring"), `src/routes/candidate/offers/$offerId.tsx`.
- **Limitations**: "Offer acceptance records a response to an exact revision only"; no e-signature, billing, background checks (`docs/PROVIDER_CAPABILITIES.md:16`). "Offer acceptance does not mark someone hired" (`docs/INTEGRATIONS.md:47`).

## 28. Onboarding and HR handoff

- **What it does**: after an **accepted** offer, staff open a pending hire; tasks are generated from a code-defined template by role title and location (base 5 tasks; +"Confirm repository access" for engineer/developer; +equipment shipping for remote; +desk prep for an office location) with owners and candidate visibility (`src/domain/platform/plans.ts:104-121`); candidate sees their visible tasks; daily reminder queue; cancel hire keeps the offer; HR handoff JSON is a **download** unless `HRIS_EXPORT_URL` + `HRIS_EXPORT_TOKEN` are set (then idempotent push per application; salary nulled without comp permission).
- **Code**: `growth.server.ts:522-660` (`listHires`, `openHire`, `cancelHire`, `hrisPayload`), `remindHires` 242.
- **Limitations**: templates are not user-editable in the UI; no named HRIS connector (Workday/BambooHR etc.); "No live HR system" (`docs/REQUIREMENTS_MATRIX.md:16`).

## 29. Hiring plans and cutoffs

- **What it does**: versioned plans per job from templates `standard` (Application review → Coding assessment → Math and work style → Final problems → Technical interview → Offer), `screen-first`, or `custom` stages with kind, reviewers, entry/exit rule, assessment key, scorecard focus; cutoff percent including ties; automatic cutoff can be turned off; "Explain" lists why each person advanced; stage transitions store actor + reason; decline sets `REJECTED` (human action); personality cutoff refused.
- **Code**: `growth.server.ts:393-520`, `src/domain/platform/plans.ts:3-20, 85-100`.
- **Limitations**: "Plans do not yet replace every ladder send" (`docs/REQUIREMENTS_MATRIX.md:17`).

## 30. Automations and rules

- **What it does**: rules = trigger (APPLICATION_SUBMITTED, STAGE_CHANGED, ASSESSMENT_ASSIGNED, ASSESSMENT_COMPLETED, REVIEW_COMPLETED, OFFER_SENT, OFFER_RESPONDED, LIFECYCLE_CHANGED) + up to 12 conditions + up to 6 actions from `create_review`, `add_tag`, `move_stage`, `send_email`, `send_text`, `pipe_analytics` (`src/domain/ops.ts:1-12`); dry-run `simulate` explains without enqueuing (`workflows.server.ts:259`); action receipts make replays no-ops; chain depth stops at 4; skipped for inactive applications.
- **Text messages**: stored as `CAPTURED`; "no carrier is connected" (`docs/IMPLEMENTATION_STATUS.md:29`, `src/server/talent/ops.server.ts:257-287`).
- **Analytics extract**: datasets `pipeline`, `scores`, `assessments`; stays in the workspace until an https destination is saved in Connectors; POST without API key and without names; status CAPTURED/DELIVERED/REFUSED/FAILED (`ops.server.ts:288-400`).
- **Limitations**: no reject action exists (no auto-reject); `move_stage` can move an active application automatically; rule email action writes a `CAPTURED` in-product message (`workflows.server.ts:205-221`); no separate rule-executing worker (`docs/IMPLEMENTATION_STATUS.md:35`). Seed includes a disabled rule titled "Do not auto-reject on a low score" (`seed.server.ts` rule-off).

## 31. Audit, reports, connectors health, status

- **Audit**: `audit()` rows for job creation, invites, rejudge, integrity disposition, extensions, analytics pipes etc.; Settings → Audit tab (`settings.tsx:38`). Summaries truncated; no answer keys (`docs/DATA_MODEL.md:23`).
- **Reports**: funnel counts distinct applications, score distribution FINAL only, local-day windows (VERIFIED T-REPORT-001..003; `schedule.server.ts:822+`).
- **Connectors**: shows which integrations are *configured* (not which succeeded) plus queue counts (`ops.server.ts:160-222`, `docs/DEPLOY.md` "After the first boot").
- **Health**: `/api/health`, `/api/health/live`, `/api/health/ready`; `/status` page.

## 32. Reliability internals (technical docs only)

- PostgreSQL outbox with `FOR UPDATE SKIP LOCKED` leases, 2-minute re-lease, fail after 5 attempts; optional `npm run outbox:worker` on shared Postgres; `/api/ops/drain-mail` with `DRAIN_TOKEN` (`docs/OPERATIONS.md`, `docs/DEPLOY.md:44-50`). Not Redis/BullMQ.
- Webhooks (`WEBHOOK_SECRET`) and provider callbacks (`PROVIDER_CALLBACK_SECRET`) refused and not stored when unset (`docs/PROVIDER_CAPABILITIES.md:12-13`).
- Answer keys only in `question_versions.key_payload`; the client bundle is checked for the seed sentinel (`docs/TEST_REPORT.md` last line).
