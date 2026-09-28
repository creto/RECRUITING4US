import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getMyApplication, requestDeletion, startAttempt, withdrawMine } from "@/server/talent.functions";
import { Alert, AppLink, Button, Field, Gate, inputClass, Loading, money, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/candidate/applications/$applicationId")({ component: Mine });

function Mine() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const state = useAuthed(() => getMyApplication({ data: { applicationId } }), [applicationId]);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  if (state.isPending || state.loading) return <Loading />;
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/candidate" className="text-sm text-muted">Your applications</Link>
        {state.error ? <Alert>{state.error}</Alert> : null}
        {state.data ? (
          <>
            <PageTitle title={state.data.application.job_title} lede={`${state.data.application.company_name} · ${state.data.application.label}`} />
            <section className="space-y-3">
              <h2 className="text-2xl">Assessments</h2>
              <p className="text-sm text-muted">{state.data.runner.reason}</p>
              {state.data.assignments.map((item: any) => (
                <article key={String(item.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
                  <h3 className="text-xl">{String(item.name)}</h3>
                  <p className="whitespace-pre-wrap text-muted">{String(item.instructions)}</p>
                  <p>Start by {when(String(item.start_by), state.data?.application.timezone)} · {Math.round(Number(item.duration_seconds) / 60)} minutes base</p>
                  <p className="text-muted">Opening this page does not start the timer.</p>
                  {item.active_attempt ? (
                    <AppLink className="mt-2 inline-flex min-h-11 items-center text-accent" href={`/candidate/attempts/${item.active_attempt}`}>Continue attempt</AppLink>
                  ) : (
                    <Button className="mt-2" type="button" onClick={() => startAttempt({ data: { assignmentId: String(item.id) } }).then((result) => { void navigate({ href: `/candidate/attempts/${result.attemptId}` }); }).catch((err) => setError(err.message))}>Start assessment</Button>
                  )}
                </article>
              ))}
            </section>
            <section className="mt-8 space-y-3">
              <h2 className="text-2xl">Interviews</h2>
              {state.data.interviews.map((item: any) => (
                <article key={String(item.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
                  <p>{String(item.title)}</p>
                  <p>{when(String(item.starts_at), String(item.timezone))}</p>
                  <p className="text-muted">{String(item.location)} {String(item.meeting_url)}</p>
                </article>
              ))}
            </section>
            <section className="mt-8 space-y-3">
              <h2 className="text-2xl">Offers</h2>
              {state.data.offers.map((offer: any) => (
                <article key={String(offer.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
                  <p>{String(offer.title)} · {String(offer.status)}</p>
                  <p>{money(Number(offer.salary_minor), String(offer.currency))}</p>
                  <AppLink className="text-accent" href={`/candidate/offers/${offer.id}`}>Review offer</AppLink>
                </article>
              ))}
            </section>
            <form className="mt-8 space-y-2" onSubmit={(event) => { event.preventDefault(); withdrawMine({ data: { applicationId, reason } }).then(() => refreshPage()).catch((err) => setError(err.message)); }}>
              <Field label="Withdraw">
                <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
              </Field>
              <Button type="submit" variant="secondary">Withdraw application</Button>
            </form>
            <Button className="mt-3" type="button" variant="ghost" onClick={() => requestDeletion({ data: { applicationId } }).then(() => setError("Deletion request sent to the employer.")).catch((err) => setError(err.message))}>Request deletion of my profile at this employer</Button>
            {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
          </>
        ) : null}
      </main>
    </Gate>
  );
}
