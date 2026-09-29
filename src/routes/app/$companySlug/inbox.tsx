import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listInbox, queuePlatformMail, suppressAddress, unsuppressAddress } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/inbox")({ component: Inbox });

function Inbox() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listInbox({ data: { slug: companySlug } }), [companySlug]);
  const [applicationId, setApplicationId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [subject, setSubject] = useState("Hello {{candidate_name}}");
  const [body, setBody] = useState("Hello {{candidate_name}},\n\nThis is about {{job_title}} at {{company_name}}.\n\n{{recruiter_name}}");
  const [error, setError] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  const box = state.data;
  return (
    <div>
      <PageTitle title="Delivery" lede={box?.note} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <p className="mb-4 text-sm text-muted">Provider: {box?.provider}. Inbound secret: {box?.secretConfigured ? "set" : "not set, so outside replies are refused"}.</p>
      <form className="mb-6 grid gap-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
        event.preventDefault();
        const name = candidateName.trim();
        const id = applicationId.trim();
        if (name.length < 2 && id.length < 8) {
          setError("Give a candidate name or an application id.");
          return;
        }
        setError(null);
        queuePlatformMail({ data: { slug: companySlug, applicationId: id, candidateName: name, kind: "FOLLOW_UP", subject, body, idempotencyKey: crypto.randomUUID() } })
          .then(() => refreshPage())
          .catch((err: Error) => setError(err.message));
      }}>
        <Field label="Candidate name"><input className={inputClass} value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Exact name" /></Field>
        <Field label="Application id"><input className={inputClass} value={applicationId} onChange={(event) => setApplicationId(event.target.value)} placeholder="Or paste an application id" /></Field>
        <p className="text-sm text-muted">A name sends only when one application matches. If several match, the error lists their ids. An application id is used as written and ignores the name.</p>
        <Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
        <Field label="Message"><textarea className={`${inputClass} min-h-28 py-2`} value={body} onChange={(event) => setBody(event.target.value)} /></Field>
        <Button type="submit">Queue message</Button>
      </form>
      <form className="mb-6 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        suppressAddress({ data: { slug: companySlug, email: String(data.get("email") ?? ""), reason: "Recruiter suppression" } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <input name="email" className={inputClass} placeholder="Suppress an address" />
        <Button type="submit" variant="secondary">Suppress</Button>
      </form>
      <h2 className="text-2xl">Suppressed addresses</h2>
      {(box?.suppressions ?? []).length === 0 ? <p className="mb-6 mt-2 text-sm text-muted">No addresses are suppressed.</p> : null}
      <ul className="mb-6 mt-2 space-y-2">
        {(box?.suppressions ?? []).map((row: { email?: string; reason?: string }) => (
          <li key={String(row.email)} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-line bg-white p-3 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
            <div>
              <p className="font-medium">{String(row.email)}</p>
              <p className="text-muted">{String(row.reason || "")}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => {
              setError(null);
              unsuppressAddress({ data: { slug: companySlug, email: String(row.email ?? "") } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
            }}>Unsuppress</Button>
          </li>
        ))}
      </ul>
      {(box?.intents ?? []).length === 0 ? <Empty title="No queued mail" body="Queue a message from an application. Addresses at bounce.example bounce. defer.example retries once. fail.example fails." /> : null}
      <ul className="space-y-2">
        {(box?.intents ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
            <p className="font-medium">{String(row.subject)}</p>
            <p>{String(row.to_email)} · {String(row.status)} · {String(row.provider)} · attempts {String(row.attempt_count)}</p>
            {row.application_id ? <p className="font-mono text-xs text-muted">{String(row.application_id)}</p> : null}
            <p className="text-muted">{String(row.last_error || "")}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-2xl">Replies</h2>
      <ul className="mt-2 space-y-2">
        {(box?.inbound ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">
            <p>{String(row.from_email)} · {row.matched ? "matched" : "quarantined"}</p>
            <p>{String(row.body)}</p>
            {row.quarantine_reason ? <p className="text-muted">{String(row.quarantine_reason)}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
