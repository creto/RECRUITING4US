# Product sources consulted

Discovery pass 2026-09-30, app repo `/workspace/creto-recruiting4us-loc`, branch `website-vnext`, HEAD `f0996fc` ("Hide application UUID unlock from portal and assess forms."), 66 commits. Read-only. Tests were not re-run (sandbox Node 20.19.2; suite requires Node 22 per `package.json:21`).

## Repository documentation

| Source | What it established |
|---|---|
| `README.md` | One-company hiring workspace; Northstar/Harbor demo; mail stays in Settings → Inbox; code ranking order; "Scores are evidence… does not silently reject"; 63/130 coverage; RLS on; webhooks refused without secret. |
| `docs/IMPLEMENTATION_STATUS.md` | Canonical "usable now" list (lines 5-31) and "Not done, and not pretended" (35-39): no Redis, no rule worker, no object storage (at time of writing), no real SMTP, no remote judge, webhook/callback secrets unset, partial test suites. Source of the "25 statements" claim (28), which the code now contradicts (125). |
| `docs/REQUIREMENTS_MATRIX.md` | Status vocabulary (production / sandbox / partial / blocked); requirement rows A-J with env vars and remaining gaps; LinkedIn not connected (14); "Google itself is unverified" (15); "not Greenhouse or HackerRank parity" (21). |
| `docs/ARCHITECTURE.md` | Modular monolith; trust boundaries (company slug is a request, not proof; candidate routes by `user_id` or verified email; public careers read published only; keys only in grading); DB-clock deadlines. |
| `docs/INTEGRATIONS.md` | Env var names per integration; SMTP 250 = accepted; HMAC mail webhook format; Google Meet prerequisites; object storage S3/R2 vars; HRIS idempotency; formal JS judge isolation flags vs Judge0 sample runs for 12 languages. States "Bounces are suppressed" (14) — contradicted by code. |
| `docs/PROVIDER_CAPABILITIES.md` | Per-integration state table; "Object storage: Not connected" (9) — now stale vs `INTEGRATIONS.md`/code, which support a configured bucket; "Code execution: … No remote judge is configured" (7); Google/X sign-in via platform (14); e-signature/billing/SAML/background checks out of scope (16). |
| `docs/DATA_MODEL.md` | Composite FKs per company; one active application/attempt; pools; extensions; human-reviewed `sql`/`spreadsheet`/`recording` types not executed; integer money/basis points; anonymize does not erase backups. |
| `docs/COMPLETION_MATRIX.md` | 130 acceptance IDs: 63 VERIFIED / 59 IMPLEMENTED_UNVERIFIED / 8 PARTIAL; per-ID evidence used for the verification matrix. |
| `docs/SECURITY.md` | Implemented controls (membership, role permissions, peer feedback hidden, idempotency, CSV escaping, upload policy, SSRF guard, RLS, portal OTP) and stated limitations (no shared rate limits, no GDPR/EEOC/SOC 2 claim). |
| `docs/TEST_REPORT.md` | 2026-09-28 run on Node 22 + PGLite: domain/schema/runner tests passed; typecheck and build clean; Playwright/axe/SMTP/remote judge/load not run; RLS not tested on hosted Neon; sentinel absent from client bundle. |
| `docs/DEPLOY.md` | Required vs optional env; features stay off until set; health endpoints; outbox worker; guest sign-in stays. |
| `docs/OPERATIONS.md`, `docs/RUNBOOK.md` | Outbox lease/retry numbers; backup/restore caveats (anonymized people return on restore; bucket copy needed). |
| `docs/DECISIONS/0001-runtime.md` | Why TanStack Start/PGLite/Neon replaced the Next.js/Redis/MinIO spec; original product name "TalentFlow". |
| `docs/LOC_REPORT.md` | ~9.8k handwritten lines at 2026-09-28 (stale; codebase grew since). Internal only. |
| `.env.example` | Full list of optional env vars and their "empty = off" behaviour; Judge0 default `https://ce.judge0.com`; `SAMPLE_RUN_LOCAL`; Resend unsuppress key. |
| `prompts/RECRUIT4US-WEBSITE-vNEXT-MASTER-DIRECTIVE.md` §12-14, 27-68, 93, 105-115, 126-129 | Claim-status vocabulary, per-feature claim precision rules, forbidden AI/integration claims, Northstar safety checklist, 63/130 not for publication. |

## Application code (key files)

| Source | What it established |
|---|---|
| `src/components/talent/kit.tsx:335-375` | Recruiter navigation groups and labels. |
| `src/server/talent.functions.ts` | 188 server functions; zod validators (e.g. lifecycle enum 224, rule limits 980-995, integrity policy ranges 1382). |
| `src/server/talent/workspace.server.ts` | Default 8 stage names (42-51, used 612-617); apply + idempotency (2004-2340); knockout sets `REJECTED` (2300-2308); CSV import dry-run/commit (1679-1720); `/track` lookup (1841-1879). |
| `src/domain/rules.ts` | Lifecycle edges (124-133); candidate-facing stage labels (136-156); retention minimum 30 days (835-838); export payload (840-843); scoring/deadline helpers. |
| `src/domain/scorecard.ts` | Exact rating labels `Definite no / No / Yes / Strong yes` (1-6); default attributes (12-16); ranking note (18-19); note ≥ 8 chars (88). |
| `src/server/talent/schedule.server.ts` | Interviews, ICS, feedback, scoreboard, slots, offers, reports, rules CRUD. |
| `src/server/talent/calendar.server.ts` | Vendor push, OAuth code exchange, Google Meet creation only with a token (247-300); sandbox fallback text. |
| `src/domain/coding-languages.ts:28-41` | The 12 editor languages. |
| `src/server/talent/judge0.server.ts:21-50` | Judge0 language ids for all 12; default public CE endpoint; optional auth token. |
| `src/server/talent/runner.server.ts` | Formal JS judge (`judgeIsolated` 260-318); sample-run routing (329-358); unshare jail. |
| `src/domain/judge.ts` | Time/space classes and points; hidden cases only for `dedupe` (194-199); score formula (228-258); ranking order (270-305). |
| `src/server/talent/platform.server.ts` | Mail drain/queue/webhook (104-718, manual suppression 706-710); code-bank track with hidden cases (720-1010); live room (1012-1346); integrity (1348-1446); DOCX index (1447). |
| `src/server/talent/question-corpus.ts` | 18-question formal-judge catalog with sample/hidden cases. |
| `src/domain/coding-bank*.ts`, `coding-bank.test.ts:8` | 2,500-problem assessment bank (many templated variants). |
| `src/server/talent/ladder.server.ts` | Ladder stages (12-21); pipeline papers "not auto-judged" (40-50); `advanceJob` auto-sends to top half (225-232). |
| `src/domain/expertise.ts`, `src/domain/half.ts` | Counted expertise signals and top-half cutoff. |
| `src/domain/screen.ts` | CV must-have screen, strictness aliases/related words, no photo/OCR reading. |
| `src/domain/cv-index.ts` | Resume profile fields, Boolean search grammar, knockout rules. |
| `src/domain/personality.ts`, `src/server/talent/personality.server.ts` | 125 items (25 per scale), 5-point Likert, five scales, non-MBTI disclaimers, 40-min paper, no auto-send. |
| `src/server/talent/mental.server.ts`, `read-code.server.ts` | Mental math (20 items/15 min) and code-reading MCQ (500 bank, pool 20, 45 min). |
| `src/domain/platform/delivery.ts` | 11 delivery states and their labels; sandbox bounce/defer/fail domains. |
| `src/server/talent/smtp.server.ts` | SMTP env handling, 587/465, Resend unsuppress. |
| `src/domain/portal-otp.ts`, `src/server/talent/portal.server.ts` | OTP parameters; application portal scope. |
| `src/routes/candidate/index.tsx:26-35`, `src/server/talent/assess.server.ts:2132-2151` | "Download my data" JSON and its minimal contents. |
| `src/routes/app/$companySlug/settings.tsx` | Tabs Company/Members/Inbox/Integrations/Privacy/Audit; retention button; anonymize; embed colors; mail logo. |
| `migrations/0006_rls_policies.sql` | `app_row_visible` policy function and blanket RLS loop. |
| `src/lib/db.ts:111-123` | Conditional `set local role app_user`. |
| `src/domain/platform/integrity.ts` | Similarity shingles, threshold, `signalChangesScore() === false`, dismiss/confirm. |
| `src/components/talent/proctor.tsx`, `src/domain/proctor.ts`, `migrations/0012_proctor_bank.sql`, `0034_assignment_proctored.sql` | Optional camera/focus/face-count browser proctor; frames not stored. |
| `src/server/talent/attempt-live.server.ts`, `migrations/0031_attempt_live.sql` | Staff can watch an in-progress exam live. |
| `src/domain/live-watch.ts`, `migrations/0028_live_signals.sql` | Live-room signals including clipboard text. |
| `src/server/talent/growth.server.ts` | Sourcing, consent gate (121), distribution + LinkedIn refusal (164-240), plans (393-520), onboarding + HRIS (522-660). |
| `src/domain/platform/plans.ts` | Plan templates, personality refusal, onboarding task template. |
| `src/server/talent/ops.server.ts`, `src/domain/ops.ts` | Connectors health, texts captured, analytics extract; rule triggers/actions. |
| `src/server/talent/workflows.server.ts` | Rule action execution (no reject action), `simulate`. |
| `src/domain/object-store.ts`, `src/server/talent/object-store.server.ts` | SigV4 S3/R2 client; env-driven. |
| `src/lib/i18n/*` | Partial Spanish UI catalog. |
| `src/server/talent/seed.server.ts`, `src/server/talent/screen.server.ts:14-67` | Northstar/Harbor demo data (see `northstar-demo-safety.md`). |
| `src/routes/**` | Route inventory (public: `/`, `/careers/*`, `/embed/*`, `/track`, `/portal/*`, `/assess/$token`, `/code/$token`, `/live/$token`, `/book/$token`, `/notice`, `/status`; staff: `/app/$companySlug/*`; candidate: `/candidate/*`). |
