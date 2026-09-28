import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { enrollCampaign, listCrm, pauseCampaign, reconcileDistribution, saveCampaign, savePool, saveProspect, saveReferral, setDistribution } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/crm")({ component: Crm });

function Crm() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listCrm({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  const data = state.data;
  return (
    <div>
      <PageTitle title="Sourcing" lede={data?.note} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      {notice ? <p className="mb-3 text-sm">{notice}</p> : null}
      <h2 className="mb-3 text-xl">Prospects</h2>
      <form className="mb-4 grid gap-2 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)] md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        saveProspect({ data: { slug: companySlug, name: String(form.get("name")), email: String(form.get("email")), source: "MANUAL", consent: String(form.get("consent")) as "YES" | "NO" | "UNKNOWN", notes: String(form.get("notes") ?? "") } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <Field label="Name"><input name="name" className={inputClass} /></Field>
        <Field label="Email"><input name="email" className={inputClass} /></Field>
        <Field label="Consent"><select name="consent" className={inputClass}><option value="UNKNOWN">Unknown</option><option value="YES">Yes</option><option value="NO">No</option></select></Field>
        <Field label="Notes"><input name="notes" className={inputClass} /></Field>
        <Button type="submit">Save prospect</Button>
      </form>
      {(data?.prospects ?? []).length === 0 ? <Empty title="No prospects" body="A prospect is not an applicant until you convert them, and only after they have agreed." /> : null}
      <ul className="space-y-2">
        {(data?.prospects ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-[24px] border border-line bg-white p-3 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">{String(row.name)} · {String(row.email)} · {String(row.consent)} · {String(row.status)}</li>
        ))}
      </ul>
      <h2 className="mb-3 mt-8 text-xl">Referrals</h2>
      <form className="mb-4 grid gap-2 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)] md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        saveReferral({ data: { slug: companySlug, employeeName: String(form.get("employeeName")), employeeEmail: String(form.get("employeeEmail")), candidateName: String(form.get("candidateName")), candidateEmail: String(form.get("candidateEmail")), roleTitle: String(form.get("roleTitle")) } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <Field label="Employee"><input name="employeeName" className={inputClass} /></Field>
        <Field label="Employee email"><input name="employeeEmail" className={inputClass} /></Field>
        <Field label="Candidate"><input name="candidateName" className={inputClass} /></Field>
        <Field label="Candidate email"><input name="candidateEmail" className={inputClass} /></Field>
        <Field label="Role"><input name="roleTitle" className={inputClass} /></Field>
        <Button type="submit" variant="secondary">Save referral</Button>
      </form>
      <ul className="mt-3 space-y-2">
        {(data?.referrals ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">{String(row.employee_name)} referred {String(row.role_title)} · {String(row.status)}{row.application_id ? ` · application ${String(row.application_id)}` : ""}{row.hired_at ? " · hired" : ""}</li>
        ))}
      </ul>
      <h2 className="mb-3 mt-8 text-xl">Pools</h2>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        savePool({ data: { slug: companySlug, name: String(form.get("pool")), prospectEmail: String(form.get("email")) } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <input name="pool" className={inputClass} placeholder="Pool name" />
        <input name="email" className={inputClass} placeholder="Prospect email" />
        <Button type="submit" variant="secondary">Add to pool</Button>
      </form>
      <h2 className="mb-3 mt-8 text-xl">Campaigns</h2>
      <form className="mt-4 grid gap-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        saveCampaign({ data: { slug: companySlug, name: String(form.get("name")), subject: String(form.get("subject")), body: String(form.get("body")) } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <input name="name" className={inputClass} placeholder="Campaign name" />
        <input name="subject" className={inputClass} placeholder="Subject" />
        <textarea name="body" className={`${inputClass} min-h-20 py-2`} placeholder="Message. A reply or a bounce stops the sequence." />
        <Button type="submit" variant="secondary">Save campaign</Button>
      </form>
      <ul className="mt-3 space-y-2">
        {(data?.campaigns ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">
            <p>{String(row.name)} · {String(row.status)}</p>
            <form className="mt-2 flex gap-2" onSubmit={(event) => {
              event.preventDefault();
              const email = String(new FormData(event.currentTarget).get("email") ?? "");
              enrollCampaign({ data: { slug: companySlug, campaignId: String(row.id), email } }).then((result) => setNotice(result.note ?? (result.sent ? "Queued." : "Enrolled."))).catch((err: Error) => setError(err.message));
            }}>
              <input name="email" className={inputClass} placeholder="Enroll email" />
              <Button type="submit">Enroll</Button>
              <Button type="button" variant="danger" onClick={() => pauseCampaign({ data: { slug: companySlug, campaignId: String(row.id) } }).then(() => refreshPage())}>Pause</Button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mb-3 mt-8 text-xl">Job boards</h2>
      <form id="board-form" className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setDistribution({ data: { slug: companySlug, jobId: String(form.get("jobId")), board: String(form.get("board")), action: "publish" } }).then((result) => setNotice(result.detail)).catch((err: Error) => setError(err.message));
      }}>
        <input name="jobId" className={inputClass} placeholder="Job id" />
        <input name="board" className={inputClass} placeholder="sandbox-board" defaultValue="sandbox-board" />
        <Button type="submit" variant="secondary">Publish record</Button>
        <Button type="button" variant="secondary" onClick={() => {
          const form = document.getElementById("board-form") as HTMLFormElement | null;
          if (!form) return;
          const data = new FormData(form);
          reconcileDistribution({ data: { slug: companySlug, jobId: String(data.get("jobId")), board: String(data.get("board")) } }).then((result) => setNotice(`${result.status}: ${result.detail}`)).catch((err: Error) => setError(err.message));
        }}>Reconcile</Button>
      </form>
      <ul className="mt-3 space-y-1 text-sm">
        {(data?.boards ?? []).map((row: any) => <li key={String(row.id)}>{String(row.board)} · {String(row.status)} · {String(row.detail)}</li>)}
      </ul>
    </div>
  );
}
