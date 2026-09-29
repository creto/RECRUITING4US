import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { approveOffer, createOffer, listOffers, sendOffer } from "@/server/talent.functions";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, money, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/offers")({ component: Offers });

function Offers() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listOffers({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const rows = state.data ?? [];
  return (
    <div>
      <PageTitle title="Offers" lede="Create one here with an application id or an exact candidate name. Sending still requires an approval of the exact current revision." />
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      {note ? <p className="mb-3 text-sm text-ok">{note}</p> : null}
      <form className="mb-8 grid gap-3 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)] md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const applicationId = String(data.get("applicationId") ?? "").trim();
        const candidateName = String(data.get("candidateName") ?? "").trim();
        if (candidateName.length < 2 && applicationId.length < 8) {
          setError("Give a candidate name or an application id.");
          return;
        }
        setError(null);
        setNote(null);
        createOffer({
          data: {
            slug: companySlug,
            applicationId,
            candidateName,
            title: String(data.get("title") ?? ""),
            salaryMinor: Math.round(Number(data.get("salary")) * 100),
            currency: String(data.get("currency") ?? "USD"),
            startDate: String(data.get("start") ?? ""),
            message: String(data.get("message") ?? ""),
          },
        }).then((result) => {
          setNote(`Drafted for approval. Offer ${result.offerId}.`);
          event.currentTarget.reset();
          refreshPage();
        }).catch((err: Error) => setError(err.message));
      }}>
        <h2 className="text-2xl md:col-span-2">Create an offer</h2>
        <p className="text-sm text-muted md:col-span-2">A name is used only when one application matches. An application id is used as written and ignores the name.</p>
        <Field label="Candidate name"><input name="candidateName" className={inputClass} placeholder="Exact name" /></Field>
        <Field label="Application id"><input name="applicationId" className={inputClass} placeholder="Or paste an application id" /></Field>
        <Field label="Title"><input name="title" className={inputClass} defaultValue="Offer" required /></Field>
        <Field label="Annual salary"><input name="salary" className={inputClass} inputMode="decimal" required /></Field>
        <Field label="Currency">
          <select name="currency" className={inputClass} defaultValue="USD">
            {["USD", "EUR", "GBP", "MXN", "CAD"].map((code) => <option key={code}>{code}</option>)}
          </select>
        </Field>
        <Field label="Start date"><input name="start" className={inputClass} type="date" required /></Field>
        <Field label="Message"><textarea name="message" className={`${inputClass} min-h-20 py-2 md:col-span-2`} /></Field>
        <div><Button type="submit">Create offer for approval</Button></div>
      </form>
      {rows.length === 0 ? <Empty title="No offers" body="Create one above, or from an application." /> : null}
      <ul className="space-y-2">
        {rows.map((offer) => (
          <li key={offer.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
            <span className="text-xl">{offer.candidate_name}</span>
            <span className="mt-1 block text-muted">{offer.job_title} · {offer.title} · {offer.status} · rev {offer.current_revision}</span>
            <span className="mt-1 block">{money(offer.salary_minor, offer.currency)}</span>
            <div className="mt-3 flex flex-wrap gap-2">
              <AppLink className="inline-flex min-h-11 items-center text-link" href={`/app/${companySlug}/applications/${offer.application_id}`}>Open application</AppLink>
              <Button type="button" variant="secondary" onClick={() => {
                setError(null);
                approveOffer({ data: { slug: companySlug, offerId: offer.id, revision: offer.current_revision } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
              }}>Approve</Button>
              <Button type="button" onClick={() => {
                setError(null);
                sendOffer({ data: { slug: companySlug, offerId: offer.id } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
              }}>Send</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
