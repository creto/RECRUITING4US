import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getMyApplication, replyToMail, requestDeletion, startAttempt, withdrawMine } from "@/server/talent.functions";
import { Alert, AppLink, Button, Field, Gate, inputClass, Loading, money, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";
import { examPaper } from "@/components/talent/exam-shell";

export const Route = createFileRoute("/candidate/applications/$applicationId")({ component: Mine });

function Mine() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const state = useAuthed(() => getMyApplication({ data: { applicationId } }), [applicationId]);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reply, setReply] = useState("");
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
                <article key={String(item.id)} className={`${examPaper} overflow-hidden rounded-[28px] border border-[#d7e1da]`}>
                  <div className="h-1.5 bg-[#cefa90]" />
                  <div className="p-5 text-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#4c6b16]">Assessment</p>
                    <h3 className="mt-1 text-2xl text-[#17211c]">{String(item.name)}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-[#44574e]">{String(item.instructions)}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-[#17211c]">
                      <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">{Math.round(Number(item.duration_seconds) / 60)} min</span>
                      <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">Start by {when(String(item.start_by), state.data?.application.timezone)}</span>
                      {item.proctored === true || item.proctored === "t" ? <span className="rounded-full border border-[#d7e1da] bg-[#f7fbe9] px-2.5 py-1 text-[#4c6b16]">Camera on</span> : null}
                    </div>
                    <p className="mt-3 text-xs text-[#44574e]">Opening this card does not start the timer. Next stays locked until the question on screen is answered.</p>
                    {item.active_attempt ? (
                      <AppLink className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#cefa90] px-5 text-sm font-medium text-[#14221b]" href={`/candidate/attempts/${item.active_attempt}`}>Continue</AppLink>
                    ) : (
                      <Button className="mt-4 rounded-full bg-[#cefa90] text-[#14221b]" type="button" onClick={() => startAttempt({ data: { assignmentId: String(item.id) } }).then((result) => { void navigate({ href: `/candidate/attempts/${result.attemptId}` }); }).catch((err) => setError(err.message))}>Start assessment</Button>
                    )}
                  </div>
                </article>
              ))}
            </section>
            <section className="mt-8 space-y-3">
              <h2 className="text-2xl">Messages</h2>
              <p className="text-sm text-muted">Written in RECRUIT4US. They were not delivered by an outside mail server. A reply is stored for the recruiter the same way.</p>
              {(state.data.messages ?? []).length === 0 ? <p className="text-sm">No messages yet.</p> : null}
              {(state.data.messages ?? []).map((message: { id: string; subject: string; body: string; from_name: string; author: string; at: string }) => (
                <article key={message.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
                  <p className="font-medium">{message.subject}</p>
                  <p className="text-muted">{message.author === "CANDIDATE" ? "You" : message.from_name || "Recruiter"} · {when(message.at)}</p>
                  <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
                </article>
              ))}
              <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); replyToMail({ data: { applicationId, body: reply } }).then(() => { setReply(""); refreshPage(); }).catch((err) => setError(err.message)); }}>
                <Field label="Reply">
                  <textarea className={`${inputClass} min-h-20 py-2`} value={reply} onChange={(event) => setReply(event.target.value)} />
                </Field>
                <Button type="submit" variant="secondary">Store reply</Button>
              </form>
            </section>
            <section className="mt-8 space-y-3">
              <h2 className="text-2xl">Interviews</h2>
              {state.data.interviews.map((item: any) => (
                <article key={String(item.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
                  <p>{String(item.title)}</p>
                  <p>{when(String(item.starts_at), String(item.timezone))}</p>
                  <p className="text-muted">{String(item.location)} {String(item.meeting_url)}</p>
                </article>
              ))}
            </section>
            <section className="mt-8 space-y-3">
              <h2 className="text-2xl">Offers</h2>
              {state.data.offers.map((offer: any) => (
                <article key={String(offer.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
                  <p>{String(offer.title)} · {String(offer.status)}</p>
                  <p>{money(Number(offer.salary_minor), String(offer.currency))}</p>
                  <AppLink className="text-link" href={`/candidate/offers/${offer.id}`}>Review offer</AppLink>
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
