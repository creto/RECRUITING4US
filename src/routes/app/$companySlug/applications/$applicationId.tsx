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
  scheduleInterview,
  sendOffer,
  setLifecycle,
} from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, money, refreshPage, useAuthed, when } from "@/components/talent/kit";

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
  const tabs = ["Overview", "Assessments", "Interviews", "Offers", "Activity"];
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
          <section className="space-y-2 rounded-md border border-line bg-surface p-4 text-sm">
            <p>{app.email || "Email hidden for this role"}</p>
            <p className="text-muted">Source {app.source} · submitted {when(app.submitted_at)}</p>
            <p>Lifecycle: {app.lifecycle}</p>
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
            <form className="space-y-2 rounded-md border border-line bg-surface p-4" onSubmit={(event) => { event.preventDefault(); void run(() => addNote({ data: { slug: companySlug, applicationId, body: note } })); }}>
              <Field label="Internal note">
                <textarea className={`${inputClass} min-h-24 py-2`} value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
              <Button type="submit" variant="secondary">Save note</Button>
            </form>
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(() => addTag({ data: { slug: companySlug, applicationId, tag: String(data.get("tag") ?? "") } })); }}>
              <input name="tag" className={inputClass} aria-label="Tag" placeholder="Add a tag" />
              <Button type="submit" variant="secondary">Tag</Button>
            </form>
            <form className="space-y-2 rounded-md border border-line bg-surface p-4" onSubmit={(event) => {
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
                <li key={String(item.id)} className="rounded-md border border-line bg-surface p-3">{String(item.body)}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
      {tab === "Assessments" ? (
        <div className="space-y-3">
          {state.data.assignments.length === 0 ? <p className="text-sm text-muted">No assessments assigned.</p> : null}
          {state.data.assignments.map((item: any) => (
            <article key={String(item.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
              <h2 className="text-xl">{String(item.assessment_name)}</h2>
              <p className="text-muted">{String(item.status)} · start by {when(String(item.start_by))} · attempts {String(item.attempts)}</p>
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
          <form className="space-y-2 rounded-md border border-line bg-surface p-4" onSubmit={(event) => {
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
            <Button type="submit">Assign</Button>
          </form>
        </div>
      ) : null}
      {tab === "Interviews" ? (
        <div className="space-y-3">
          {state.data.interviews.map((item: any) => (
            <article key={String(item.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
              <h2 className="text-xl">{String(item.title)}</h2>
              <p>{when(String(item.starts_at), String(item.timezone))} · {String(item.status)}</p>
              <p className="text-muted">{String(item.location)} {String(item.meeting_url)}</p>
            </article>
          ))}
          <ScheduleForm slug={companySlug} applicationId={applicationId} onDone={() => refreshPage()} onError={setError} />
        </div>
      ) : null}
      {tab === "Offers" ? (
        <div className="space-y-3">
          {state.data.offers.map((offer: any) => (
            <article key={offer.id} className="rounded-md border border-line bg-surface p-4 text-sm">
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
      {tab === "Activity" ? (
        <ul className="space-y-2 text-sm">
          {state.data.events.map((event: any) => (
            <li key={String(event.id)} className="rounded-md border border-line bg-surface p-3">
              {String(event.reason || event.to_lifecycle || "Update")} · {when(String(event.at))}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ScheduleForm({ slug, applicationId, onDone, onError }: { slug: string; applicationId: string; onDone: () => void; onError: (value: string) => void }) {
  return (
    <form className="grid gap-2 rounded-md border border-line bg-surface p-4 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
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
        },
      }).then(onDone).catch((err) => onError(err.message));
    }}>
      <Field label="Title"><input name="title" className={inputClass} defaultValue="Interview" required /></Field>
      <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue="America/New_York" required /></Field>
      <Field label="Local start"><input name="start" className={inputClass} placeholder="2026-10-06T10:00" required /></Field>
      <Field label="Local end"><input name="end" className={inputClass} placeholder="2026-10-06T11:00" required /></Field>
      <Field label="Location"><input name="location" className={inputClass} /></Field>
      <Field label="Meeting URL"><input name="url" className={inputClass} /></Field>
      <Button type="submit">Schedule</Button>
    </form>
  );
}

function OfferForm({ slug, applicationId, onDone, onError }: { slug: string; applicationId: string; onDone: () => void; onError: (value: string) => void }) {
  return (
    <form className="grid gap-2 rounded-md border border-line bg-surface p-4" onSubmit={(event) => {
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
