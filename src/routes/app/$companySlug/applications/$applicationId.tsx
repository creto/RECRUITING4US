import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addNote,
  addTag,
  approveOffer,
  assignAssessment,
  createOffer,
  extendAttempt,
  getApplication,
  importExternalScore,
  listAssessments,
  mergeCandidates,
  rescreenCv,
  scheduleInterview,
  sendOffer,
  setLifecycle,
  indexDocx,
  inviteToCode,
  listCodeResults,
  listCodingQuestions,
  openHire,
  openLive,
  queuePlatformMail,
  rejudgeSubmission,
} from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, money, refreshPage, useAuthed, when } from "@/components/talent/kit";
import { RichMailEditor } from "@/components/talent/mail-compose";
import { plainToEditorHtml } from "@/domain/mail-html";

export const Route = createFileRoute("/app/$companySlug/applications/$applicationId")({ component: ApplicationPage });

function ApplicationPage() {
  const { companySlug, applicationId } = Route.useParams();
  const state = useAuthed(() => getApplication({ data: { slug: companySlug, applicationId } }), [companySlug, applicationId]);
  const tests = useAuthed(() => listAssessments({ data: { slug: companySlug } }), [companySlug]);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const app = state.data?.application;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  if (!state.data || !app) return null;
  const tabs = ["Overview", "Assessments", "Interviews", "Offers", "Mail", "Workbench", "Activity"];
  return (
    <div>
      <PageTitle title={app.name || "Candidate"} lede={`${app.job_title} · ${app.stage_name} · version ${app.version}`} />
      <div className="mb-4 flex gap-2 overflow-x-auto" role="tablist">
        {tabs.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} className={`min-h-11 rounded-md px-3 text-sm ${tab === item ? "bg-accent text-accent-ink" : "border border-line bg-surface"}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      {tab === "Overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
            <p>{app.email || "Email hidden for this role"}</p>
            <p className="text-muted">Source {app.source} · submitted {when(app.submitted_at)}</p>
            <p>Lifecycle: {app.lifecycle}</p>
            <CvScreen
              screen={state.data.screen}
              files={state.data.files}
              canAssign={Boolean(state.data.canAssign)}
              onRun={() => run(() => rescreenCv({ data: { slug: companySlug, applicationId } }))}
            />
            {state.data.profile ? (
              <div className="mt-3 border-t border-line pt-3">
                <h2 className="text-xl">Indexed CV</h2>
                <p>Titles: {(state.data.profile.titles ?? []).join(", ") || "none found"}</p>
                <p>Skills: {(state.data.profile.skills ?? []).join(", ") || "none found"}</p>
                <p>Years: {state.data.profile.years ?? "not found"}</p>
                <p className="text-muted">{state.data.profile.note}</p>
              </div>
            ) : null}
            {(state.data.ranks ?? []).length ? (
              <ul className="mt-3 space-y-1 border-t border-line pt-3">
                {state.data.ranks.map((row: { gate: string; score: number | null; rank: number; advanced: boolean }) => (
                  <li key={row.gate}>{row.gate}: {row.score == null ? "no score" : row.score} · rank {row.rank} · {row.advanced ? "inside cutoff" : "not advanced by cutoff"}</li>
                ))}
              </ul>
            ) : null}
            {state.data.canMove ? (
              <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void run(() => setLifecycle({ data: { slug: companySlug, applicationId, lifecycle: "REJECTED", expectedVersion: app.version, reason } })); }}>
                <Field label="Decision reason">
                  <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="danger">Reject</Button>
                  <Button type="button" variant="secondary" onClick={() => run(() => setLifecycle({ data: { slug: companySlug, applicationId, lifecycle: "WITHDRAWN", expectedVersion: app.version, reason: reason || "Recorded by staff" } }))}>Record withdrawal</Button>
                  {app.lifecycle === "REJECTED" || app.lifecycle === "WITHDRAWN" ? <Button type="button" variant="secondary" onClick={() => run(() => setLifecycle({ data: { slug: companySlug, applicationId, lifecycle: "ACTIVE", expectedVersion: app.version, reason: reason || "Reopened" } }))}>Reopen</Button> : null}
                </div>
              </form>
            ) : null}
          </section>
          <section className="space-y-2">
            <form className="space-y-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => { event.preventDefault(); void run(() => addNote({ data: { slug: companySlug, applicationId, body: note } })); }}>
              <Field label="Internal note">
                <textarea className={`${inputClass} min-h-24 py-2`} value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
              <Button type="submit" variant="secondary">Save note</Button>
            </form>
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(() => addTag({ data: { slug: companySlug, applicationId, tag: String(data.get("tag") ?? "") } })); }}>
              <input name="tag" className={inputClass} aria-label="Tag" placeholder="Add a tag" />
              <Button type="submit" variant="secondary">Tag</Button>
            </form>
            <form className="space-y-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(() => mergeCandidates({
                data: {
                  slug: companySlug,
                  keepId: String(app.candidate_id),
                  dropEmail: String(data.get("email")),
                  commit: String(data.get("commit")) === "yes",
                },
              }));
            }}>
              <Field label="Merge a duplicate email in this company">
                <input name="email" type="email" className={inputClass} required />
              </Field>
              <input type="hidden" name="commit" value="no" />
              <div className="flex gap-2">
                <Button type="submit" variant="secondary">Preview merge</Button>
                <Button type="submit" onClick={(event) => {
                  const hidden = event.currentTarget.form?.elements.namedItem("commit");
                  if (hidden instanceof HTMLInputElement) hidden.value = "yes";
                }}>Merge</Button>
              </div>
            </form>
            <ul className="space-y-2 text-sm">
              {state.data.notes.map((item: any) => (
                <li key={String(item.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3">{String(item.body)}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
      {tab === "Assessments" ? (
        <div className="space-y-3">
          {state.data.assignments.length === 0 ? <p className="text-sm text-muted">No assessments assigned.</p> : null}
          {state.data.assignments.map((item: any) => (
            <article key={String(item.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
              <h2 className="text-xl">{String(item.assessment_name)}</h2>
              <p className="text-muted">{String(item.status)} · start by {when(String(item.start_by))} · attempts {String(item.attempts)}</p>
              <p className="mt-2">{scoreLine(item)}</p>
              {item.attempt_id ? (
                <form className="mt-3 grid gap-2 md:grid-cols-2" onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void run(() => importExternalScore({
                    data: {
                      slug: companySlug,
                      attemptId: String(item.attempt_id),
                      provider: String(data.get("provider") || "Manual"),
                      raw: String(data.get("raw")),
                      scaleMin: String(data.get("min")),
                      scaleMax: String(data.get("max")),
                    },
                  }));
                }}>
                  <Field label="External score"><input name="raw" className={inputClass} required /></Field>
                  <Field label="Provider"><input name="provider" className={inputClass} defaultValue="Vendor" /></Field>
                  <Field label="Scale min"><input name="min" className={inputClass} defaultValue="0" required /></Field>
                  <Field label="Scale max"><input name="max" className={inputClass} defaultValue="100" required /></Field>
                  <Button type="submit" variant="secondary">Record external result</Button>
                  <Button type="button" variant="secondary" onClick={() => run(() => extendAttempt({ data: { slug: companySlug, attemptId: String(item.attempt_id), extraSeconds: 300, reason: reason || "Accommodation" } }))}>Add 5 minutes</Button>
                </form>
              ) : null}
            </article>
          ))}
          <form className="space-y-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(() => assignAssessment({
              data: {
                slug: companySlug,
                applicationId,
                assessmentId: String(data.get("assessmentId")),
                startBy: new Date(Date.now() + 14 * 86400000).toISOString(),
                multiplierBasisPoints: Number(data.get("multiplier")) || 10000,
                extraSeconds: 0,
              },
            }));
          }}>
            <Field label="Assign a published assessment">
              <select name="assessmentId" className={inputClass} required>
                <option value="">Choose</option>
                {(tests.data ?? []).map((test: any) => <option key={String(test.id)} value={String(test.id)}>{String(test.name)}</option>)}
              </select>
            </Field>
            <Field label="Time multiplier (basis points, 15000 = 1.5×)">
              <input name="multiplier" className={inputClass} defaultValue="10000" />
            </Field>
            <p className="text-sm text-muted">Assigning here overrides a do-not-send result. It does not change the CV screen.</p>
            <Button type="submit">Assign</Button>
          </form>
        </div>
      ) : null}
      {tab === "Interviews" ? (
        <div className="space-y-3">
          {state.data.interviews.map((item: any) => (
            <article key={String(item.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
              <h2 className="text-xl">{String(item.title)}</h2>
              <p>{when(String(item.starts_at), String(item.timezone))} · {String(item.status)}</p>
              <p className="text-muted">{String(item.location)} {String(item.meeting_url)}</p>
            </article>
          ))}
          <ScheduleForm slug={companySlug} applicationId={applicationId} attributes={state.data.scorecardAttributes ?? []} onDone={() => refreshPage()} onError={setError} />
        </div>
      ) : null}
      {tab === "Offers" ? (
        <div className="space-y-3">
          {state.data.offers.map((offer: any) => (
            <article key={offer.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
              <h2 className="text-xl">{offer.title}</h2>
              <p>{offer.status} · revision {offer.current_revision}</p>
              <p>{state.data?.canSeePay ? money(offer.salary_minor, offer.currency) : "Compensation hidden for your role"}</p>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => run(() => approveOffer({ data: { slug: companySlug, offerId: offer.id, revision: offer.current_revision } }))}>Approve this revision</Button>
                <Button type="button" onClick={() => run(() => sendOffer({ data: { slug: companySlug, offerId: offer.id } }))}>Send</Button>
              </div>
            </article>
          ))}
          <OfferForm slug={companySlug} applicationId={applicationId} onDone={() => refreshPage()} onError={setError} />
        </div>
      ) : null}
      {tab === "Mail" ? (
        <MailTab slug={companySlug} applicationId={applicationId} canEmail={Boolean(state.data.canEmail)} onError={setError} />
      ) : null}
      {tab === "Workbench" ? (
        <Workbench slug={companySlug} applicationId={applicationId} onError={setError} />
      ) : null}
      {tab === "Activity" ? (
        <ul className="space-y-2 text-sm">
          {state.data.events.map((event: any) => (
            <li key={String(event.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3">
              {String(event.reason || event.to_lifecycle || "Update")} · {when(String(event.at))}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CvScreen({
  screen,
  files,
  canAssign,
  onRun,
}: {
  screen: {
    fit: string;
    action: string;
    matchedRequired: string[];
    missingRequired: string[];
    matchedPreferred: string[];
    reasons: string[];
  } | null;
  files: { id: string; display_name: string; scan_state: string }[];
  canAssign: boolean;
  onRun: () => void;
}) {
  const label = !screen
    ? "Not screened yet."
    : screen.fit === "GOOD" && screen.action === "SEND"
      ? "Good fit. Assessment sent."
      : screen.fit === "GOOD"
        ? "Good fit. Assessment was not sent."
        : screen.fit === "NOT_A_FIT"
          ? "Not a fit. Assessment was not sent."
          : "Needs a person. Assessment was not sent.";
  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      <h2 className="text-xl">CV screen</h2>
      <p className="text-muted">Looks for this job’s must-have words in the CV. It is not a model score, and it does not read photos, schools, or age.</p>
      <p>{label}</p>
      {files.length ? files.map((file) => (
        <p key={file.id} className="text-muted">{file.display_name} · file check {file.scan_state}</p>
      )) : <p className="text-muted">No CV uploaded.</p>}
      {screen ? (
        <>
          <p>Found: {screen.matchedRequired.length ? screen.matchedRequired.join(", ") : "none"}</p>
          <p>Missing: {screen.missingRequired.length ? screen.missingRequired.join(", ") : "none"}</p>
          {screen.matchedPreferred.length ? <p>Preferred found: {screen.matchedPreferred.join(", ")}</p> : null}
          <ul className="list-disc pl-4">
            {screen.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </>
      ) : null}
      {canAssign ? <Button type="button" variant="secondary" onClick={onRun}>Screen the CV</Button> : null}
    </div>
  );
}

function ScheduleForm({ slug, applicationId, attributes, onDone, onError }: { slug: string; applicationId: string; attributes: { id: string; label: string }[]; onDone: () => void; onError: (value: string) => void }) {
  return (
    <form className="grid gap-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const focusIds = data.getAll("focusIds").map(String);
      scheduleInterview({
        data: {
          slug,
          applicationId,
          title: String(data.get("title")),
          localStart: String(data.get("start")),
          localEnd: String(data.get("end")),
          timezone: String(data.get("timezone")),
          location: String(data.get("location") ?? ""),
          meetingUrl: String(data.get("url") ?? ""),
          focusIds,
        },
      }).then(onDone).catch((err) => onError(err instanceof Error ? err.message : "Could not schedule."));
    }}>
      <Field label="Title"><input name="title" className={inputClass} defaultValue="Interview" required /></Field>
      <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue="America/New_York" required /></Field>
      <Field label="Local start"><input name="start" className={inputClass} placeholder="2026-10-06T10:00" required /></Field>
      <Field label="Local end"><input name="end" className={inputClass} placeholder="2026-10-06T11:00" required /></Field>
      <Field label="Location"><input name="location" className={inputClass} /></Field>
      <Field label="Meeting URL"><input name="url" className={inputClass} /></Field>
      <div className="md:col-span-2 text-sm">
        <p className="mb-1">Scorecard focus</p>
        {attributes.map((item) => (
          <label key={item.id} className="mr-3 inline-flex items-center gap-1">
            <input type="checkbox" name="focusIds" value={item.id} defaultChecked />
            {item.label}
          </label>
        ))}
      </div>
      <Button type="submit">Schedule</Button>
    </form>
  );
}

function OfferForm({ slug, applicationId, onDone, onError }: { slug: string; applicationId: string; onDone: () => void; onError: (value: string) => void }) {
  return (
    <form className="grid gap-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      createOffer({
        data: {
          slug,
          applicationId,
          title: String(data.get("title")),
          salaryMinor: Math.round(Number(data.get("salary")) * 100),
          currency: "USD",
          startDate: String(data.get("start")),
          message: String(data.get("message") ?? ""),
        },
      }).then(onDone).catch((err) => onError(err.message));
    }}>
      <Field label="Title"><input name="title" className={inputClass} defaultValue="Offer" required /></Field>
      <Field label="Annual salary (USD)"><input name="salary" className={inputClass} inputMode="decimal" required /></Field>
      <Field label="Start date"><input name="start" className={inputClass} type="date" required /></Field>
      <Field label="Message"><textarea name="message" className={`${inputClass} min-h-20 py-2`} /></Field>
      <Button type="submit">Create offer for approval</Button>
    </form>
  );
}

function scoreLine(item: {
  score_status?: string | null;
  score_origin?: string | null;
  basis_points?: number | string | null;
  score_release?: string | null;
}) {
  const status = item.score_status ? String(item.score_status) : "";
  if (!status) return "No evaluation yet. Choice and numeric questions score on submit. Written and code work stays pending until a person grades it.";
  if (status === "PENDING") return "Grading is pending. That is not a zero.";
  if (status === "FAILED") return "Scoring failed. No score was invented.";
  const points = item.basis_points == null || item.basis_points === "" ? null : Number(item.basis_points);
  const shown = points != null && Number.isFinite(points)
    ? `${(points / 100).toFixed(2)}% (${points} basis points)`
    : "a final result with no stored percentage";
  const origin = item.score_origin === "MANUAL"
    ? "Human rubric"
    : item.score_origin === "EXTERNAL"
      ? "External scale, kept on the provider’s range"
      : "Automatic exact match or numeric tolerance";
  const release = String(item.score_release) === "NONE" ? " Not released to the candidate." : "";
  return `${origin}: ${shown}.${release}`;
}

function MailTab({ slug, applicationId, canEmail, onError }: { slug: string; applicationId: string; canEmail: boolean; onError: (value: string) => void }) {
  const [subject, setSubject] = useState("Update on {{job_title}}");
  const [body, setBody] = useState(() => plainToEditorHtml("Hello {{candidate_name}},\n\nThis note is queued for delivery. Stored in this workspace is not the same as delivered.\n\n{{recruiter_name}}"));
  if (!canEmail) return <p className="text-sm">Your role cannot send mail.</p>;
  return (
    <form className="grid gap-2" onSubmit={(event) => {
      event.preventDefault();
      queuePlatformMail({ data: { slug, applicationId, kind: "FOLLOW_UP", subject, body, idempotencyKey: crypto.randomUUID() } })
        .then(() => onError("Queued. Open Delivery to see stored, accepted, delivered, bounced, or failed. The in-product copy is a separate channel."))
        .catch((err: Error) => onError(err.message));
    }}>
      <Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
      <Field label="Message"><RichMailEditor value={body} onChange={setBody} /></Field>
      <Button type="submit">Queue outside message</Button>
    </form>
  );
}

function Workbench({ slug, applicationId, onError }: { slug: string; applicationId: string; onError: (value: string) => void }) {
  const results = useAuthed(() => listCodeResults({ data: { slug, applicationId } }), [slug, applicationId]);
  const questions = useAuthed(() => listCodingQuestions({ data: { slug } }), [slug]);
  const [room, setRoom] = useState<string | null>(null);
  return (
    <div className="space-y-3 text-sm">
      <p>Hidden answers stay on the server. Rejudge keeps the older result. A judge failure is not a zero.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => openLive({ data: { slug, applicationId, title: "Technical interview", prompt: "Write solve() and talk through it." } }).then((row) => setRoom(row.token)).catch((err: Error) => onError(err.message))}>Open live room</Button>
        <Button type="button" variant="secondary" onClick={() => openHire({ data: { slug, applicationId, note: "Opened from the application", location: "", roleTitle: "" } }).then(() => onError("Onboarding opened, or it was already there.")).catch((err: Error) => onError(err.message))}>Open onboarding</Button>
      </div>
      {room ? <p>Live room token {room}. The meeting link, if you add one later, is an outside call.</p> : null}
      <form className="flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const questionId = String(new FormData(event.currentTarget).get("questionId") ?? "");
        inviteToCode({ data: { slug, applicationId, questionId } }).then(() => onError("Coding invite queued. Delivery is separate from the in-product copy.")).catch((err: Error) => onError(err.message));
      }}>
        <select name="questionId" className={inputClass}>
          {(questions.data?.questions ?? []).map((question: { id: string; title: string }) => <option key={question.id} value={question.id}>{question.title}</option>)}
        </select>
        <Button type="submit" variant="secondary">Send coding exercise</Button>
      </form>
      <label className="block">DOCX resume
        <input className="mt-1 block" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const text = String(reader.result ?? "");
            const base64 = text.includes(",") ? text.split(",")[1] ?? "" : "";
            indexDocx({ data: { slug, applicationId, filename: file.name, base64 } }).then((row) => onError(`${row.status}: ${row.reason}`)).catch((err: Error) => onError(err.message));
          };
          reader.readAsDataURL(file);
        }} />
      </label>
      <ul className="space-y-2">
        {(results.data?.results ?? []).map((row: { id: string; title?: string; kind?: string; status?: string; score?: number | null; max_score?: number | null; detail?: string }) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3">
            {String(row.title)} · {String(row.kind)} · {String(row.status)} · {row.score == null ? "no score" : `${row.score} / ${row.max_score}`}
            <p className="text-muted">{String(row.detail ?? "")}</p>
            <Button type="button" variant="secondary" onClick={() => rejudgeSubmission({ data: { slug, submissionId: String(row.id) } }).then((next) => onError(next.detail)).catch((err: Error) => onError(err.message))}>Rejudge</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
