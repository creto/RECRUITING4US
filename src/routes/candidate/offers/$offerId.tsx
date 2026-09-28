import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getMyOffer, respondToOffer } from "@/server/talent.functions";
import { Alert, Button, Field, Gate, inputClass, Loading, PageTitle, money, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/candidate/offers/$offerId")({ component: OfferPage });

function OfferPage() {
  const { offerId } = Route.useParams();
  const state = useAuthed(() => getMyOffer({ data: { offerId } }), [offerId]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (state.isPending || state.loading) return <Loading />;
  const offer = state.data?.offer;
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/candidate" className="text-sm text-muted">Your applications</Link>
        {state.error ? <Alert>{state.error}</Alert> : null}
        {offer ? (
          <>
            <PageTitle title={offer.title} lede={`${offer.company_name} · ${offer.job_title} · revision ${offer.current_revision}`} />
            <section className="space-y-2 rounded-md border border-line bg-surface p-4 text-sm">
              <p>{money(offer.salary_minor, offer.currency)} per year</p>
              <p>Start date {offer.start_date ?? "not set"}</p>
              <p>Status {offer.status}</p>
              <p className="whitespace-pre-wrap">{offer.message}</p>
              <p className="text-muted">Accepting records your response to this exact revision. It is not a certified electronic signature.</p>
            </section>
            {state.data?.response ? (
              <p className="mt-4 text-sm">Recorded response: {state.data.response.decision}. {state.data.response.comment}</p>
            ) : offer.status === "SENT" ? (
              <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
                <Field label="Comment, optional">
                  <textarea className={`${inputClass} min-h-24 py-2`} value={comment} onChange={(event) => setComment(event.target.value)} />
                </Field>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => respond("ACCEPTED")}>Accept</Button>
                  <Button type="button" variant="secondary" onClick={() => respond("DECLINED")}>Decline</Button>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted">This revision is no longer open.</p>
            )}
            {done ? <p className="mt-3 text-sm">{done}</p> : null}
            {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
          </>
        ) : null}
      </main>
    </Gate>
  );

  function respond(decision: "ACCEPTED" | "DECLINED") {
    if (!offer) return;
    setError(null);
    respondToOffer({ data: { offerId, revision: offer.current_revision, decision, comment } })
      .then(() => setDone(decision === "ACCEPTED" ? "Accepted. The employer can see this on the application." : "Declined."))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not record the response."));
  }
}
