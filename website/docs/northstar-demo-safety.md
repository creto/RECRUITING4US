# Northstar Labs / Harbor Analytics demo — screenshot safety

Checklist from directive §93: synthetic data, no personal data, Harbor isolation respected, no secrets/tokens, no private demo credentials.

## Verdict

**The seeded demo content is synthetic, with one important exception: the demo is seeded into the signed-in user's own account, and that user's real name and email are written into Northstar as a candidate, as the mail recipient and as the interview participant/offer author.** Screenshots are safe only when taken from a dedicated capture account with a neutral name and a `.example`-style or role email (e.g. "Equipo Demo").

## How the demo is created

- Button "Open Northstar Labs" on `/app` (`src/routes/app/index.tsx:73-77`) calls `seedDemo` → `src/server/talent/seed.server.ts:86-617`.
- Idempotent per user: company slug `northstar-<first 10 alphanumerics of the user id>` (`seed.server.ts:86-92`); Harbor slug `harbor-<same>` (108).
- The user becomes OWNER of Northstar (101-104). Harbor Analytics is owned by a synthetic user id `seed-harbor-<seed>` (106-113) so the viewer **cannot** open it — the tenant-isolation demonstration. Harbor's job deliberately shares the Northstar platform-engineer title "so tenant leaks are visible" (216-221).
- Extra CV-screen demo applicants are added lazily for demo companies (`src/server/talent/screen.server.ts:21-67`).
- Built-in papers (coding screen, final problems, mental math, work-style, code reading) are generated for any company from original banks (`ladder.server.ts:34-50`).

## What is synthetic (safe)

| Data | Evidence |
|---|---|
| Company names Northstar Labs, Harbor Analytics (flagged `demo = true`) | `seed.server.ts:97-109` |
| 32 candidate names (e.g. "Amina Hassan", "Jonah Adler", "Priya Raman"…) — invented, common-name style | `seed.server.ts:17-24` |
| Candidate emails `first.last@northstar.example` / `@harbor.example` (RFC 2606 reserved `.example` domain) | `seed.server.ts:227, 234` |
| CV-screen applicants "Amina Okonkwo" (`amina.okonkwo.screen@northstar.example`) and "Jonah Hale" with one-paragraph fictional CVs | `screen.server.ts:14-15, 64-66` |
| Jobs: Senior Software Engineer — Platform (published, salary visible 160000-210000 whole dollars), Data Analyst, Customer Support Specialist, Account Executive (published), Product Designer (paused), Recruiting Coordinator (draft); every description says "fictional" | `seed.server.ts:7-15, 187-221` |
| 40 application slots (≤ deduplicated pairs) with lifecycles incl. one HIRED, one WITHDRAWN, one REJECTED ("Role scope changed"); history dated 2026-06-15 "Seeded history" | `seed.server.ts:242-268` |
| Assessments "Senior Platform Engineering Exercise" (90 min, 4 sections) and "Numerical reasoning mini-test" (20 min) — "Not a validated instrument" | `seed.server.ts:385-404` |
| Questions: 4 engineering-judgment MCQs, 4 numeric, `deduplicateEvents` coding task, design and debugging prompts — all original | `seed.server.ts:30-86, 318-340` |
| Interview "Engineering interview", location "Northstar — conference room 4", meeting URL `https://meet.example/northstar-demo` (non-routable) | `seed.server.ts:506-520` |
| Offers: USD 185,000 (pending approval) and the viewer's own fictional Data Analyst offer USD 128,000, both labelled "Fictional demo terms… Not an employment contract" | `seed.server.ts:521-534, 588-606` |
| Rules "Ask for review when an assessment is completed" (on) and "Do not auto-reject on a low score" (off) | `seed.server.ts:536-552` |
| Tag "Referral" | `seed.server.ts:560` |

## Fields to avoid or crop in screenshots

| Field | Why | Where it appears |
|---|---|---|
| **Signed-in user's name and email** | Real personal data. Seed inserts it as a Northstar candidate (`seed.server.ts:563-567`), as recipient of the "Northstar Labs workspace is ready" mail (553-557), as interview participant (517-520) and as offer `created_by` | Candidates list, application detail, Mail/Inbox, Interviews, candidate portal header, account menu |
| **Browser URL bar / company slug** | `northstar-<10 chars of user id>` leaks part of the account id | Every `/app/...` URL |
| **Answer-key sentinel** `HIDDEN_SENTINEL_northstar_key_9f3a` | Server-only test marker; must never be pictured | `question_versions.key_payload` (`seed.server.ts:303, 314`); only visible via DB tools — never in UI |
| **Invitation / access tokens** | Bearer-style links | `/assess/$token`, `/code/$token`, `/live/$token`, `/book/$token`, `/invite/$token`, `/portal/$applicationId?access=…` URLs; "copy link" fields in assessments, interviews, scheduling |
| **Application UUIDs / legacy UUID unlock** | Server-side email+UUID unlock and `?access=` links still exist for legacy APIs (`docs/SECURITY.md:15`) | `/portal/$applicationId` URLs, application detail URLs, receipts |
| **Portal one-time codes** | 6-digit OTP in the workspace mailbox (stored mail) | Settings → Inbox / Mail when the portal is demoed |
| **Integration configuration** | Connectors page shows which env vars are configured and may show a saved analytics destination URL | `/app/$companySlug/connectors`, Settings → Integrations |
| **Proctor / live-signal panels** | Camera preview and clipboard text are privacy-sensitive and DO NOT PUBLISH topics | Proctored exam screen, `/live/$token` signals, Integrity events |
| **Audit log with real actor email** | Shows the capture account | Settings → Audit |
| **Harbor Analytics content** | Only show the *refusal* (cannot open Harbor), not Harbor data from DB tools | `/app/harbor-…` attempt |

## Safe-to-screenshot views (from a neutral capture account)

1. Public careers page `/careers/northstar-…` (crop URL) — job list and the Senior Software Engineer — Platform detail with salary range.
2. Embedded form `/embed/…` with default white theme and with custom brand colors.
3. Pipeline board for the platform job (synthetic names only; hide the capture account's own card or rename it).
4. Candidate detail of a `.example` candidate: resume index fields, Boolean search result, CV-screen reasons (use Amina Okonkwo / Jonah Hale screen samples).
5. Assessment builder and pool settings; candidate attempt view showing the server-clock timer and save status (no answer key is present client-side).
6. Code review ranking table (label the complexity column as estimate).
7. Interview scorecard form with the four-step scale and the locked submitted state; scoreboard with its explanatory note.
8. Scheduling page / self-schedule `/book/…` slot picker (crop token).
9. Offer (fictional terms) with approval by revision; onboarding task list after acceptance.
10. Mail page delivery-state column (states are real product labels; sandbox addresses ending `.example`).
11. Settings → Privacy (retention button, deletion requests) and the Harbor Analytics "cannot open" message for the isolation story.
12. Work-style result card — only with explicit "no es un filtro" caption; avoid showing the item count.

## Pre-capture checklist

- [ ] Use a dedicated account named e.g. "Equipo Demo" with a non-personal email; never a staff member's real account.
- [ ] Hide the browser chrome/URL bar or crop it.
- [ ] Never open DB tools or network inspectors in frame.
- [ ] Do not capture proctored exams, live signals, Connectors, Audit, or Inbox containing OTP codes.
- [ ] Keep "fictional" / "not a validated instrument" labels legible where they appear, or state it in the caption.
- [ ] No Harbor Analytics data, only the access refusal.
- [ ] Re-check against `marketing-claims.md` forbidden list: captions must not imply IA, auto-rejection, video hosting or LinkedIn.
