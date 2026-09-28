# RECRUIT4US

Hiring workspace for one company at a time: careers pages, a pipeline, assessments, interviews, and offers.

Sign in, then either create a company or open **Northstar Labs**. That demo includes a second employer, Harbor Analytics, which you cannot open. Your own candidate portal lists a numerical exercise and a fictional offer. The exercise is not a validated test. Mail stays inside Settings → Inbox. Reviews rank submitted code by cases passed, then estimated time class, then space, then measured time. A sample run by itself is not that score, and no remote judge is connected.

Scores are evidence. A workflow can open a review. It does not silently reject someone.

On an application you can preview a merge, record an external score, add five minutes to an open attempt, or reopen a withdrawal. Assessments can draw a fixed pool and can be archived. The candidate portal can download that person's applications. Settings → Privacy removes this company's files that are past the retention window.

Architecture notes and honest gaps are in `docs/`. Verified acceptance coverage is 63 of 130. Postgres row security is on for employer tables. Webhooks stay refused until `WEBHOOK_SECRET` is set, and nothing is stored in that case. Mail stays captured. Guest entry remains.
