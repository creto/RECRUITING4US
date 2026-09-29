# RECRUIT4US — Complete Hiring Platform Expansion Brief

> Copy this document into the coding agent's instructions. This is a specification for extending the existing application, not authorization to replace it. The description below is the product owner's current feature inventory; inspect the repository and verify each claim before changing code.

## Mission and completion standard

Extend RECRUIT4US into a genuinely usable, integrated applicant tracking, recruiting CRM, assessment, and technical interview platform. Preserve the existing jobs, applications, candidate portal, assessments, scorecards, offers, audit trail, and tenant model. Add the missing capabilities specified below, connect them to real workflows, and verify behavior end to end. A page, endpoint, stub, disabled control, simulated delivery receipt, hard-coded example, or database row that cannot reach its intended recipient does **not** satisfy a requirement.

This is a capability specification inspired by publicly described Greenhouse and HackerRank functions, not an instruction to copy their proprietary source, branding, question bank, or exact UI. Do not claim identical parity with either vendor: their products evolve, features vary by plan, and this document cannot enumerate every integration or proprietary algorithm.

## Known starting point; preserve and inspect

- One company per hiring workspace; Northstar Labs demo, Harbor Analytics tenant isolation; guest sign-in is a real account.
- Job draft/publish/pause/close, public careers page, embeddable application, configurable basic branding, answers and CV upload (PDF, text, CSV, PNG, JPEG), knockout questions.
- CV text search with Boolean operators and extracted fields; heuristic expertise score; top-half invitations and manual pass/reject; fixed sequence of coding, mental math, personality, and final coding papers.
- Test bank, pool selection stable for an attempt, autosave, server-clock deadlines, audited time extension; manual coding rubric, estimated complexity ranking, sandbox availability.
- Interview scheduling with exclusive slots and ICS export; structured, blind-until-submit scorecards; offers with revision approval and in-portal response.
- Templates and in-product candidate messages/replies; notes, tags, CSV import/export, duplicate merge, reports, audit, retention deletion, candidate JSON export, basic automations/connectors.
- Existing integrations require secrets; there is currently no live outbound SMTP/provider delivery, SMS carrier, external coding judge, Word parser, or configured calendar/webhook provider.

First produce a concise repository map: packages, DB schema and migrations, queues, routes, auth/RBAC, tenant boundary enforcement, storage, code editor, runner/sandbox, tests, deployment, and live configuration. Identify what is already implemented and extend it. Never duplicate a working feature just to meet a line target. Maintain existing routes and data; use backward-compatible migrations, feature flags, and a documented rollback plan where needed.

## Scope and line budget

These are estimates for **new or materially modified handwritten product code**, including frontend, backend, workers and migrations; exclude tests, fixtures, generated clients, vendored code, third-party SDKs, lockfiles, documentation, and copied question data. Count added and removed lines separately in the final report; do not inflate counts with boilerplate. Budgets guide planning, not acceptance. Complexity and verified functionality determine completion.

| Workstream | Estimated product LOC | Dependencies |
| --- | ---: | --- |
| A. Delivered email, inbound replies, notifications | 5,000–10,000 | provider/domain configuration |
| B. Secure code judge and assessment execution | 15,000–35,000 | isolated runtime or execution provider |
| C. Live technical interview workspace | 12,000–28,000 | realtime layer, judge, optional media provider |
| D. Assessment integrity and review | 8,000–22,000 | consent, storage, optional verification/plagiarism services |
| E. Sourcing CRM, referrals, distribution | 10,000–23,000 | outbound messaging, authorized job boards |
| F. Calendar sync and self-scheduling | 4,000–10,000 | calendar OAuth/vendor |
| G. Onboarding handoff | 4,000–9,000 | offers, notification delivery |
| H. Flexible hiring plans and workflow controls | 6,000–13,000 | stages, permissions, assessments |
| I. Word ingestion and parser resilience | 1,000–3,000 | file scanning, extraction service |
| J. Cross-cutting hardening, observability and privacy | 5,000–17,000 | all workstreams |
| **Total** | **70,000–160,000** | range, not a required quota |

If a reputable external execution provider handles untrusted code, workstream B may be closer to **5,000–12,000 LOC** and the overall range lower by roughly **10,000–23,000 LOC**; fees, provider limitations and failure handling remain. Broad, continually updated vendor parity can exceed **150,000–300,000 additional LOC**, especially across integrations, enterprise security and question content. Do not equate code volume with completeness.

## A. Actual candidate communications — 5,000–10,000 LOC

1. Add a provider abstraction for transactional email: sandbox/test provider and at least one production provider. Manage domain verification, sender identity, bounce address and secrets in tenant-aware settings. Support production-ready provider API or SMTP/TLS where appropriate; never put credentials in browser code or logs.
2. Model immutable message intent and delivery attempt separately: tenant, candidate, application, job, template revision, rendered subject/body, recipients, CC/BCC, attachment references, idempotency key, consent/suppression state, attempt count, provider ID, events and timestamps. Keep the in-product copy as an additional channel.
3. Queue all sends; use idempotent workers, bounded exponential retry, rate limits and dead-letter recovery. Record accepted, delivered, deferred, bounced, complained and failed where the provider exposes those states. An accepted API response is **not** proof of delivery. Handle provider webhooks with signature verification, replay protection and tenant mapping.
4. Send assessment invitations with unique expiring links, interview invitations/updates/cancellations, offer notifications, rejection and follow-up messages. Provide a recruiter preview, test send, scheduled send, pause, resend and delivery timeline; prevent duplicate notices after retries or stage changes. Apply candidate timezone when rendering dates.
5. Inbound reply route: use verified inbound provider hooks or a monitored mailbox, parse MIME safely, strip quoted text conservatively, map replies using opaque threading token and verified sender, quarantine unmatched/ambiguous replies, and surface them in the appropriate application. Candidate portal replies should remain functional. Attachments need type/size scanning and permissions.
6. Store CC/BCC as actual delivery recipients subject to permissions; explain in UI whether a message was delivered, queued or merely stored. Respect opt-out where appropriate, suppression lists, retention rules and transactional exceptions.

**Accept when:** a real test mailbox receives and replies to an invitation, a reply appears on the right candidate/application, bounce and retry states are visible, and another tenant cannot see message bodies or delivery events. Test duplicate webhooks and worker retries.

## B. Secure coding assessment engine — 15,000–35,000 LOC

1. Create versioned coding questions: prompt, starter code per language, allowed languages, limits, sample tests, private tests, weighted cases, expected result, validator strategy, explanation visible after configured release, difficulty, skill tags, authorship and publication state. Freeze the question version per attempt; edits cannot rewrite past scores.
2. Provide a real IDE-like candidate editor: language selection, files where relevant, keyboard accessibility, run sample tests, input/output/error panels, autosave, reconnection and explicit final submission. Show time and resource limits. Server persists source revisions with bounded retention and does not expose hidden cases or answer keys.
3. Build a judge queue and isolated worker or integrate a reviewed execution service. Untrusted code has no host secrets or direct DB access, controlled network policy, read-only base image, bounded CPU, wall time, RAM, processes, output, disk and total concurrency. Kill hung jobs and clean up workspaces. Version runtime images and compiler flags. Never interpolate submitted source into shell commands.
4. Execute compile and test phases; distinguish compile error, wrong answer, runtime error, timeout, memory limit, infra error and canceled execution. Infra failures are retryable and **never** silently scored as candidate zero. Store case-level results, resource measurements, runtime version and judge version. Rejudge or invalidate only with audited authority and retain old result history.
5. Calculate scores deterministically from frozen weights and test results. Separate automatic execution score from human rubric. Define partial credit, ties, best-of versus latest submission, resubmission limits, late policy and candidate-visible versus private results. Do not present estimated asymptotic class as a proven fact; label it heuristic, explain signals and allow reviewer override.
6. Support an initial set of maintained languages appropriate to current users; document supported versions. Add custom input runs, staff review/playback of submissions, per-language diagnostics, score export and links to the candidate's application. Use manual fallback when the judge is unavailable without falsely marking automatic pass.

**Accept when:** code that passes some hidden cases gets the expected weighted score; compile failure, infinite loop, excessive output, process fork, network attempt, and worker crash produce distinct safe outcomes; cross-tenant attempts remain inaccessible. Demonstrate a full apply → invite → code → judge → human review sequence.

## C. Live collaborative technical interviews — 12,000–28,000 LOC

1. Generate interview sessions tied to a scheduled application, interviewer roster, question set, candidate link, expiration and tenant. Enforce roles and waiting-room admission; support disconnect/rejoin without losing work.
2. Shared editor with cursor and selection presence, synchronized files, version history, chat and run controls. Resolve concurrent edits with a suitable collaboration protocol, server authority and bounded logs; make reconnect and conflict behavior explicit. Offer question reveal and private interviewer notes.
3. Reuse the secure judge for live code execution. Include a multi-file repository exercise with prepared codebase, terminal/build/test within the same sandbox boundary, and a focused single-file algorithm exercise. Provide a simple collaborative drawing/whiteboard space for system design if that interview type is enabled.
4. Integrate media by a suitable vendor or documented external meeting link; expose actual state instead of pretending a video call exists. If recordings/transcripts are offered, require configured consent, retention controls, access restrictions and deletion. The core shared editor must work without media.
5. At end, produce a review package: prompt version, source snapshots or playback, test runs, interviewer notes, timestamps and rubric. Allow human sign-off; never submit scorecards on an interviewer's behalf. Prevent candidate access to private evaluations.

**Accept when:** candidate and two interviewers edit the same session in separate browsers, observe coherent edits and runs, reconnect, and submit independent scorecards; users from Harbor Analytics cannot join a Northstar session.

## D. Assessment integrity and investigation — 8,000–22,000 LOC

1. Keep existing focus/clipboard logs, but present them only as signals. Capture event time, type, relevant attempt/question, collection settings and confidence. Avoid automatic rejection from focus changes or a camera-on flag.
2. Configurable, disclosed integrity policy per test: consent screen, permitted resources, webcam snapshots where enabled, optional identity check, multiple/no-face signals, copy/paste and tab events, suspicious code similarity, and a candidate accessibility or exception path. Where service credentials are absent, clearly show feature unavailable.
3. Secure snapshot collection: explicit browser permission, capture frequency cap, storage encryption, short signed access, strict reviewer role, redaction and automatic deletion. No invisible recording. Candidate can see the applicable notice before starting.
4. Similarity analysis on submitted code with language-aware normalization, threshold configuration and pairwise reviewer evidence; optional plagiarism provider integration if justified. Preserve false-positive review, provenance and explanation. Separate independently developed common solutions from substantial shared material.
5. Reviewer case queue: signals, timeline, evidence access, comments, disposition, override, audit history and appeal/review path. Integrity findings must not silently alter test scores or reject applications.

**Accept when:** candidate consent and refusal follow documented paths; a reviewer can inspect an evidence case and dismiss a false positive; expired images are deleted; unauthorized roles and other tenants cannot retrieve evidence. No claim that camera events prevent a second device.

## E. Sourcing, CRM, referrals and job distribution — 10,000–23,000 LOC

1. Distinguish prospects from applicants. Add talent pools, prospect profiles, source attribution, notes/tasks, ownership, custom fields, deduplication, search filters, consent/legal basis and stage-specific status. Convert prospect to applicant without losing provenance or consent history.
2. Outreach sequences with templates, personalization, schedule, reply stop rules, bounce stop rules, rate limits and suppression. Use the real message service. Recruiters can pause campaigns and inspect delivery/reply metrics. Do not scrape external profiles or send messages through unapproved channels.
3. Employee referral intake with employee identity, role, candidate consent/notification, duplicate handling, recruiter review, referral status and optional incentive tracking; never reveal confidential applicant notes to referrers.
4. Job distribution framework: canonical posting, per-board mapping, publish/update/unpublish state, authenticated vendor connectors, failure reconciliation, source tracking and public apply URL. Implement actual connections for providers with available credentials and permission; otherwise show configuration required. Do not call a list of manual URLs an integrated distribution network.
5. Search saved segments and nurture campaigns; controls for stale prospects, duplicate candidates and deletion requests. Show source and campaign attribution through application and hire reports.

**Accept when:** a referred prospect becomes an applicant with preserved attribution, an outreach reply halts a sequence, and a published job updates and unpublishes in a configured destination. Tenants cannot share a prospect pool.

## F. Calendar integration and self-scheduling — 4,000–10,000 LOC

1. Provide OAuth or supported vendor connection for at least one real calendar service, with scoped credentials, refresh, revocation, diagnostics and per-user authorization; keep ICS fallback. Do not read arbitrary calendars outside granted scope.
2. Availability across interviewer calendars, timezone and DST handling, working hours, buffers, event privacy, tentative/confirmed states and collision protection. Candidates receive a branded self-scheduling link with expiration, reschedule/cancel rules and accessible timezone selection.
3. Create/update/delete external events idempotently, handle webhook or polling reconciliation, declined interviewer or changed time, and surface sync failures for manual repair. All candidate notices use actual delivery state from A.

**Accept when:** two simultaneous bookings cannot claim the same slot, DST boundary times are correct, and rescheduling updates both RECRUIT4US and the connected calendar after a transient provider failure.

## G. Post-offer onboarding — 4,000–9,000 LOC

1. On accepted offer, create a pending-hire record with explicit approval/handoff; keep offer history, compensation permissions and original applicant record. Define location/role-based onboarding templates, tasks, owners, due dates, dependencies and reminders.
2. Candidate/new-hire portal for safe profile completion, forms/documents, acknowledgment and task status. Staff views for progress, overdue items, exceptions and reassignment. Use secure upload, retention and permission controls.
3. HRIS/export connector boundary with field mapping, consent and idempotent push; show pending configuration instead of claiming sync. Do not assume offer acceptance alone means employed or automatically change a hired status.

**Accept when:** accepted offer creates assigned tasks; reminders are delivered; a canceled hire is handled without deleting the historical offer; compensation remains invisible to unauthorized roles.

## H. Configurable hiring plans and workflow rules — 6,000–13,000 LOC

1. Replace the rigid universal sequence with job-specific, versioned hiring plans: application review, recruiter screen, coding assessment, other assessment, technical interview, panel, offer and custom stages. Preserve existing default sequence as a migratable template. Define required reviewers, criteria, questions, scorecard focus, SLAs, entry/exit conditions, approvals and exception reasons.
2. Change the current top-half rule to a configurable ranking policy per stage; include manual advance, hold and decline. Clearly display computed score components, cutoff population, ties, missing CV text and rank changes. Never withdraw an already issued paper without an explicit audited cancellation. Do not treat personality type as a hiring cutoff.
3. Offer approvals by revision with approver order, pay visibility, delegation, audit and reapproval after material change. Add stage-transition automation with idempotency, preview/dry run, rate limits, failure log and manual replay. Prevent cycles and conflicting transitions.
4. Accessibility and fairness review: candidates without parseable CV text get a manual-review path; offer accommodations and alternative test routes; capture why an automated knockout applied and who can reverse it. Human confirmation for material hiring decisions.
5. Reporting: conversion by stage/source/cohort, time in stage, scorecard completion, assessment completion, offer acceptance, delivery failure, configurable filters and exports; document denominators and permission-aware aggregates.

**Accept when:** two jobs run different plans, an invited candidate keeps their invitation after a re-rank, a recruiter can explain and override an automated cutoff, and every transition has an actor/rule and audit record.

## I. DOC/DOCX ingestion and resilience — 1,000–3,000 LOC

1. Accept DOCX and, if safe extraction support exists, legacy DOC. Validate MIME by content rather than extension; size limits, malware scan, decompression limits and isolated extraction. Store original file privately. Never execute macros or embedded content.
2. Extract text with source and confidence status; flag unreadable, empty, scanned or corrupted files. Provide candidate-facing confirmation and recruiter manual review. Support reindex after parser changes without duplicating applicants.
3. Keep Boolean search accurate across extracted text and structured fields; ensure permissions and retention apply to originals, extracted text and search indexes.

**Accept when:** ordinary DOCX resumes are searchable; a malformed document fails safely and remains reviewable; deleting a retained candidate file also removes derived indexed text on schedule.

## J. Cross-cutting production hardening — 5,000–17,000 LOC

- Enforce tenant scope at every read, write, search index, object key, queue job, webhook, export, collaboration channel and cached result; test Northstar/Harbor isolation. Add scoped staff RBAC, audit and least-privilege service accounts. Verify guest account permissions and candidate portal identity linkage.
- Protect public forms and links with rate limits, abuse detection, attachment scanning, CSRF/session protections where applicable, signed expiring tokens and replay protection. Protect uploaded files and offer attachments with short-lived access.
- Observability: trace a job/application/attempt/message across queues; record latency, send and judge failure rates, dead letters, backlog, sync lag, cleanup failures and user-visible degraded state. Alerting and runbooks for delivery/judge outages.
- Backup/restore and migration checks; feature flags; rollback; data retention and deletion for CVs, images, code, interview artifacts, replies, exported data and audit exceptions. Make deletion effective across object storage, indexes and asynchronous workers.
- Privacy/security review of proctoring and screening. Document data use, human review and accommodations. Before deployment in any jurisdiction, obtain the organization's applicable legal review; do not advertise compliance based only on a settings screen.
- Accessibility across applications, assessments, scheduling and candidate portal; keyboard navigation, screen reader labels, contrast, timer accommodation and interruption recovery.
- Do not require all third-party credentials for the local demo. Supply a safe sandbox mode with clear unavailable states and reproducible seed data; production setup must be explicit.

**Accept when:** cross-tenant adversarial tests, token replay tests, queue retry tests and deletion checks pass; operators can identify and recover from provider outage without fabricating delivery or score results.

## Data and API contract requirements

Propose schema migrations for at least: message intent/delivery events/inbound thread/suppression; coding question and immutable version/test cases/submissions/judge runs; interview session/participants/edits/runs/artifacts; integrity policy/events/evidence/cases; prospects/pools/referrals/campaigns/job distributions; calendar connection/events/booking; hiring-plan versions/stages/transition history; pending hires/tasks. Use tenant IDs and stable application IDs throughout, foreign keys and unique idempotency constraints, indexes for real query patterns, deletion semantics and retention timestamps. Document encryption-sensitive fields and what is excluded from search or analytics. Preserve existing records with migration/backfill strategies.

Define request/response validation and permission rules for each API. Separate candidate, interviewer, recruiter, hiring manager, compensation approver, tenant admin and integration service principal. Version provider-facing webhooks; authenticate them and deduplicate events. Never trust client-reported scores, elapsed time, delivery state or provider identity. External integrations need connection status, secret rotation, diagnostics, backoff, disconnect and repair path.

## Required UX surfaces

Keep RECRUIT4US visual language coherent across: recruiter pipeline with explainable ranking and manual action; job hiring-plan editor; candidate profile and timeline; CRM/pools and campaigns; delivered-mail composer/inbox and delivery log; assessment authoring with hidden-case preview; candidate editor and results; integrity review queue; live interview workspace and reviewer packet; calendar self-booking; offer approvals; pending-hire onboarding; analytics; integration and tenant settings. Every state needs loading, empty, error, unauthorized and provider-unconfigured handling. Distinguish **saved**, **queued**, **sent**, **delivered** and **failed** in copy. Put helpful candidate instructions into application and assessment flows, not implementation jargon.

## Implementation order and gates

1. **Inventory and baseline:** map repo/schema/tests and run current checks; write discrepancy list against this starting description. Preserve working behavior.
2. **Foundations:** migrations, event/outbox pattern, shared permission and tenant checks, observability, feature flags and provider interfaces.
3. **Communication:** real email and reply delivery before any feature relies on invitations. Prove delivery in a configured test environment.
4. **Execution:** question versioning, candidate editor, sandbox/judge, scoring and manual review. Prove isolation and failure handling.
5. **Hiring plans and interviews:** configurable stage rules, live shared sessions, calendar sync, scorecards and offer handoff.
6. **CRM, integrity, onboarding, ingestion:** build each vertical slice with backend, UI, queue work, permissions, audit, data lifecycle and meaningful tests.
7. **Release readiness:** migration rehearsal, security review, load tests on judge/realtime/mail bottlenecks, cross-tenant tests, accessibility checks, backup/restore exercise and operator runbooks. Roll out progressively.

Build functioning vertical slices. Integrate new features into existing routes and records rather than creating isolated demos. Do not delete and rebuild modules solely to fit a preferred design. Make reasonable implementation choices from the repo's stack. Record decisions and tradeoffs. If a provider cannot be configured, finish the adapter, contract tests, sandbox provider and setup instructions, then state precisely what remains unverified; never mark real delivery or external sync complete.

## Verification matrix and definition of done

- Run meaningful automated tests for stage policy edge cases and ties, scoring, hidden-case protection, deadlines, retries, webhook replay, offer revisions, consent, retention, concurrent slot booking, realtime reconnection and tenant isolation.
- Demonstrate three end-to-end journeys: **applicant → delivered invite → judged assessment → live interview → approved offer**; **referred prospect → outreach reply → application**; **accepted offer → onboarding tasks and configured HRIS handoff**. Include failure journeys for bounced mail, judge outage, calendar conflict and withdrawn consent.
- Test distinct roles in two tenants and an unauthenticated candidate. Verify private data, compensation, hidden tests and integrity evidence cannot leak through UI, API, export, logs, URLs or realtime channels.
- For each workstream report: existing functionality reused, files/schema changed, product LOC added and removed, tests added separately, commands and results, demo evidence, external credentials needed, risks and unfinished items.
- Mark a workstream complete only when its acceptance cases work in the target environment. A configured external provider may be an explicit deployment prerequisite; a sandbox-only adapter is partial completion. Do not declare full Greenhouse/HackerRank parity based on a LOC target.

## Final instruction to implementing agent

Continue until the implementable scope is complete and verified. Work in reviewable commits or milestones, preserve data and working flows, and surface blockers with concrete reproduction and the smallest missing external prerequisite. Report honest line counts and actual behavior. Ask only for information or credentials that cannot be inferred from repository/configuration, and continue independent work while waiting. Do not claim a feature works because its UI exists.

## Research reference points (checked September 28, 2026)

- Greenhouse platform and current plans: https://www.greenhouse.com/platform and https://www.greenhouse.com/pricing
- Greenhouse sourcing: https://www.greenhouse.com/talent-sourcing
- Greenhouse onboarding: https://www.greenhouse.com/onboarding-customer
- HackerRank Screen: https://www.hackerrank.com/products/screen
- HackerRank Interview: https://www.hackerrank.com/products/interview
- HackerRank FAQ: https://www.hackerrank.com/frequently-asked-questions

