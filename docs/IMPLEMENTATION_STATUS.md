# Implementation status

## Usable now

- Sign in, including a guest account that is a real user, or open Northstar Labs. Harbor Analytics is seeded so that person cannot open it.
- Jobs, public careers, applications, pipeline moves, notes, tags, CSV export, and CSV dry-run import.
- Assessments can be drafted with a pool size, published, and archived. A start draws a stable subset and does not reshuffle on refresh.
- Objective scoring, autosave, a server deadline, a receipt, and an audited extension while the attempt is open.
- On an application: merge preview, an external score with its scale, five extra minutes, and reopening a withdrawal. Hired stays hired.
- The candidate portal can download that person's applications as JSON.
- Settings → Privacy can delete this company's files that are past retention.
- Reviews rank submitted code by cases passed, then estimated time class, then space, then measured time. The class is a heuristic. A timeout is not stored as zero. The human rubric is still required.
- A CV screen looks for the job’s must-have words in an uploaded PDF or text file. Every word must be present before an assessment is sent. A missing CV, an unreadable file, or a missing skill does not send one. Automatic sending can be turned off per assessment. This is not a model score, and it does not read photos.
- After a CV is stored, the job ranks readable resumes by a counted expertise score: must-have skills, preferred skills, years mentioned, and a short list of phrases such as shipped or led. It is not a model. The top half, including everyone tied at the cutoff, is sent a coding screen of 3 medium and 2 hard problems. Those problems are not auto-judged. When a score exists, the top half get the math paper and the personality questionnaire. Until then, Pass sends those two. The top half of the math scores get 3 hard problems, which are also not auto-judged. Reject and Pass work at every stage. A later rank does not withdraw a paper already sent. The invitation is stored in the product. It is not delivered by an outside mail server.
- A CV is indexed into titles, skills, education, locations, years, and work-history lines found in the text. The original PDF, text, or DOCX file stays attached. Legacy Word `.doc` files are kept and not extracted. Recruiters search with AND, OR, NOT, quotes, and parentheses. Words typed without an operator must all appear. Location, education, and a custom phrase omit a person when that text is not in the index or the application answers. Knockout questions, if the employer publishes them, are a minimum number of years and a work-authorization answer. A failed knockout stores the application and closes it. None of this is an automated rejection model.
- During an attempt the browser receives the prompt and the saved answer, not the answer key. The deadline is the database clock. A candidate cannot submit a score of their own, and editing the on-screen timer does not add time. A staff extension requires a reason and is audited. This is not a claim that the question text is encrypted: the candidate has to read it. A calculator, a second device, or a photograph of the screen is still possible.
- A published job can be embedded with an iframe. The form is white by default. Each company can set the background, text, and button colors in Settings. The form takes a name, email, essays, and a CV. The CV is screened. The other answers are one row in a CSV the employer downloads. The receipt is shown on the page and stored. It is not emailed.
- Interview scorecards use attributes the recruiter writes on the job. Each interview is assigned a focus subset. The interviewer rates those attributes and an overall recommendation on the same four-step scale: Definite no, No, Yes, Strong yes. A short note is required. A submitted scorecard cannot be edited. Other interviewers’ scorecards stay hidden until you submit yours; a recruiter can read submitted ones. The interviews page ranks applicants by the average of submitted overall recommendations. Ties share a rank. Attribute ratings are shown and are not added into the average. This is not a prediction and it does not move the pipeline.
- Mail can be queued with a delivery state: queued, accepted, delivered, deferred, bounced, failed, or suppressed. With no outside mail server, delivery means the message is in the candidate’s mailbox inside this workspace. Acceptance is not called delivery. An inbound webhook is stored only when `MAIL_INBOUND_SECRET` is set and the signature matches. A portal reply is stored on the application. Copy addresses are saved with the message.
- DOCX resumes can be indexed. Legacy Word files are kept and marked unreadable. The original file stays attached. Macros are not run.
- Coding questions have frozen versions and hidden cases. JavaScript runs in a separate process. A timeout or a judge failure is not stored as zero. The candidate does not receive the expected answers.
- A live interview room shares source by revision. A stale save is rejected instead of overwritten. Private notes stay with interviewers. A meeting link is optional and is not a video call hosted here.
- Integrity events and similarity scores are signals. They do not change a test score or reject an application. A person dismisses or confirms a case.
- Prospects, pools, referrals, and campaigns are separate from applicants. A campaign sends only with consent, through the same mailbox, and a reply or bounce stops it. Outside job boards stay unconfigured.
- Self-scheduling holds a slot only if it is still open. Google Calendar is unavailable until a client id is configured.
- A job can use a hiring plan and a cutoff that includes ties. The explanation does not withdraw a paper already sent. Personality type is not a cutoff.
- An accepted offer can open onboarding tasks. Canceling the hire keeps the offer. The HR handoff is a download. It is not pushed to an HR system.
- The work style questionnaire is a third published assessment: 25 original agree-to-disagree statements on five scales (mind, information, decisions, structure, identity). The saved answers produce a type such as ESTJ-A. A tie stays a tie. It is not the 16Personalities test, not the Myers-Briggs Type Indicator, and not a hiring decision. It is not sent automatically with a CV.
- Automations can store an email, store a text, or pipe one fact. Texts are not sent: no carrier is connected. An analytics extract stays in the workspace until an https destination is saved. The post has no API key and does not include names. Pending scores are not sent as zero.
- Rules with a dry run, captured mail, audit, and anonymize. Withdrawn applications can be reopened by staff. Hired applications cannot.
- Outbox rows are leased so a second drain skips a row that is still held.

## Not done, and not pretended

- Redis, a separate worker that executes rules, object storage, real SMTP, or a remote code judge.
- A webhook is accepted only when `WEBHOOK_SECRET` is set. It is not set in this preview, and the event is not stored.
- A provider callback is accepted only when `PROVIDER_CALLBACK_SECRET` is set. It is not set in this preview, and nothing is stored.
- Calendar refresh does not call a vendor until both a token and an https vendor URL exist.
- The full browser, security, and load suites. Verified acceptance coverage is 63 of 130. See `docs/COMPLETION_MATRIX.md`.

## Resume

Domain rules: `src/domain/rules.ts` and `src/domain/rules.test.ts`. Schema checks: `src/domain/schema.invariants.test.ts`. Server use cases: `src/server/talent/`.
