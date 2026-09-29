import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listInbox, queuePlatformMail, suppressAddress, unsuppressAddress } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, MailCard, PageTitle, refreshPage, useAuthed, useCompanyWorkspace } from "@/components/talent/kit";
import { RichMailEditor, SafeMailBody } from "@/components/talent/mail-compose";
import { plainToEditorHtml } from "@/domain/mail-html";

export const Route = createFileRoute("/app/$companySlug/inbox")({ component: Inbox });

function Inbox() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listInbox({ data: { slug: companySlug } }), [companySlug]);
  const [applicationId, setApplicationId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [subject, setSubject] = useState("Hello {{candidate_name}}");
  const [body, setBody] = useState(() => plainToEditorHtml("Hello {{candidate_name}},\n\nThis is about {{job_title}} at {{company_name}}.\n\n{{recruiter_name}}"));
  const [error, setError] = useState<string | null>(null);
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const workspace = useCompanyWorkspace();
  if (state.loading || state.isPending) return <Loading />;
  const box = state.data;
  const intents = (box?.intents ?? []).filter((row: Record<string, unknown>) => mailVisible(row, person, status, kind));
  const replies = (box?.inbound ?? []).filter((row: Record<string, unknown>) => mailVisible(row, person, "", ""));
  const statuses = listed(box?.intents, "status");
  const kinds = listed(box?.intents, "kind");
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
        <Field label="Message"><RichMailEditor value={body} onChange={setBody} /></Field>
        <MailCard name={workspace.data?.company.name ?? "Company"} body={body} />
        <p className="text-sm text-muted">The applicant gets this card. Settings supplies the logo and footer when the message leaves the queue.</p>
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
      {(box?.intents ?? []).length === 0 ? <Empty title="No queued mail" body="Queue a message from an application. Addresses at bounce.example bounce. defer.example retries once. fail.example fails." /> : (
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <Field label="Person, email, or job">
            <input className={inputClass} value={person} placeholder="Ada, or an email" onChange={(event) => setPerson(event.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Kind">
            <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="">All kinds</option>
              {kinds.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
        </div>
      )}
      {intents.length === 0 && (box?.intents ?? []).length > 0 ? <p className="mb-3 text-sm text-muted">Nothing in the queue matches that filter.</p> : null}
      <ul className="space-y-2">
        {intents.map((row: any) => (
          <li key={String(row.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
            <p className="font-medium">{String(row.subject)}</p>
            <p>{String(row.to_email)}{row.candidate_name ? ` · ${String(row.candidate_name)}` : ""}{row.job_title ? ` · ${String(row.job_title)}` : ""} · {String(row.status)} · {String(row.kind)} · {String(row.provider)} · attempts {String(row.attempt_count)}</p>
            {row.application_id ? <p className="font-mono text-xs text-muted">{String(row.application_id)}</p> : null}
            <p className="text-muted">{String(row.last_error || "")}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-2xl">Replies</h2>
      <ul className="mt-2 space-y-2">
        {replies.map((row: any) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">
            <p>{String(row.from_email)} · {row.matched ? "matched" : "quarantined"}</p>
            <SafeMailBody body={String(row.body)} className="text-sm" />
            {row.quarantine_reason ? <p className="text-muted">{String(row.quarantine_reason)}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function listed(rows: Record<string, unknown>[] | undefined, key: string): string[] {
  const values = new Set<string>();
  for (const row of rows ?? []) {
    const value = String(row[key] ?? "");
    if (value) values.add(value);
  }
  return [...values];
}

function mailVisible(row: Record<string, unknown>, person: string, status: string, kind: string): boolean {
  if (status && String(row.status ?? "") !== status) return false;
  if (kind && String(row.kind ?? "") !== kind) return false;
  const needle = person.trim().toLowerCase();
  if (!needle) return true;
  const hay = [row.candidate_name, row.to_email, row.from_email, row.subject, row.job_title, row.application_id]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}
