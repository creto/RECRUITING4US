import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { deleteTemplate, listInbox, listMailbox, listTemplates, saveTemplate, unsuppressEmail } from "@/server/talent.functions";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/mail")({ component: Mail });

function looksSuppressed(row: { status?: unknown; last_error?: unknown; state_label?: unknown }) {
  const status = String(row.status ?? "");
  const err = `${row.last_error ?? ""} ${row.state_label ?? ""}`.toLowerCase();
  return status === "SUPPRESSED" || status === "BOUNCED" || status === "COMPLAINED" || err.includes("suppress");
}

function Mail() {
  const { companySlug } = Route.useParams();
  const templates = useAuthed(() => listTemplates({ data: { slug: companySlug } }), [companySlug]);
  const box = useAuthed(() => listMailbox({ data: { slug: companySlug } }), [companySlug]);
  const delivery = useAuthed(() => listInbox({ data: { slug: companySlug } }), [companySlug]);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if ((templates.loading && !templates.data) || templates.isPending) return <Loading />;
  return (
    <div>
      <PageTitle title="Mail" lede="Templates and the mailbox for this company. Delivery events live on the Delivery tab." />
      {templates.error ? <Alert>{templates.error}</Alert> : null}
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      <p className="mb-4 text-sm text-muted">{templates.data?.note}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl">Templates</h2>
          <p className="mt-2 text-sm text-muted">Tokens: {"{{candidate_name}} {{job_title}} {{company_name}} {{recruiter_name}}"}</p>
          <ul className="mt-3 space-y-2">
            {(templates.data?.templates ?? []).map((template) => (
              <li key={template.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
                <p className="font-medium">{template.name}</p>
                <p className="text-muted">{template.subject}</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setEditing(template.id); setName(template.name); setSubject(template.subject); setBody(template.body); }}>Edit</Button>
                  <Button type="button" variant="danger" onClick={() => deleteTemplate({ data: { slug: companySlug, id: template.id } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
          <form className="mt-4 space-y-2" onSubmit={(event) => {
            event.preventDefault();
            saveTemplate({ data: { slug: companySlug, id: editing, name, subject, body } })
              .then(() => { setEditing(undefined); setName(""); setSubject(""); setBody(""); refreshPage(); })
              .catch((err) => setError(err instanceof Error ? err.message : "Could not save."));
          }}>
            <Field label={editing ? "Edit template" : "New template"}>
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Subject">
              <input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} required />
            </Field>
            <Field label="Message">
              <textarea className={`${inputClass} min-h-28 py-2`} value={body} onChange={(event) => setBody(event.target.value)} required />
            </Field>
            <Button type="submit">{editing ? "Save template" : "Add template"}</Button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl">Inside this product</h2>
          <p className="mt-1 text-sm text-muted">These rows are the in-product copy. They are not provider delivery.</p>
          {box.loading && !box.data ? <Loading /> : null}
          {box.error ? <Alert>{box.error}</Alert> : null}
          {(box.data?.messages ?? []).length === 0 ? <Empty title="No candidate mail yet" body="Open an application and use the Email tab." /> : null}
          <ul className="mt-3 space-y-2">
            {(box.data?.messages ?? []).map((message) => (
              <li key={message.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
                <p className="font-medium">{message.subject}</p>
                <p className="text-muted">
                  {message.author === "CANDIDATE" ? "From candidate" : "From staff"}
                  {" · "}
                  {message.candidate_name ?? "Candidate"}
                  {message.job_title ? ` · ${message.job_title}` : ""}
                  {" · "}
                  {message.status}
                  {" · "}
                  {when(message.at)}
                </p>
                <p className="text-muted">To {message.to_email}{message.cc ? ` · copy stored ${message.cc}` : ""}</p>
                <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
                {message.application_id ? <AppLink className="mt-2 inline-flex text-link" href={`/app/${companySlug}/applications/${message.application_id}`}>Open application</AppLink> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl">Delivery queue</h2>
        <p className="mt-2 text-sm text-muted">{delivery.data?.setup}</p>
        {delivery.data?.sender ? <p className="text-sm">From {delivery.data.sender}. {delivery.data.externalBlocked ? "External delivery is blocked." : "SMTP is configured. Watch the state, not the send button."}</p> : <p className="text-sm">No verified sender is configured. External delivery is blocked.</p>}
        <ul className="mt-3 space-y-2">
          {(delivery.data?.intents ?? []).length === 0 ? <li className="text-sm text-muted">Nothing is queued.</li> : null}
          {(delivery.data?.intents ?? []).map((row: any) => (
            <li key={String(row.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
              <p className="font-medium">{String(row.subject)}</p>
              <p>{String(row.status)} · {String(row.state_label)}</p>
              <p className="text-muted">To {String(row.to_email)} · {String(row.kind)} · attempts {String(row.attempt_count)} · {String(row.provider)}</p>
              {row.last_error ? <p className="text-muted">{String(row.last_error)}</p> : null}
              {looksSuppressed(row) ? (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy === String(row.to_email)}
                    onClick={() => {
                      const email = String(row.to_email);
                      setBusy(email);
                      setError(null);
                      unsuppressEmail({ data: { slug: companySlug, email } })
                        .then((result) => {
                          setError(result.note ?? "Address unsuppressed.");
                          refreshPage();
                        })
                        .catch((err: Error) => setError(err.message))
                        .finally(() => setBusy(null));
                    }}
                  >
                    {busy === String(row.to_email) ? "Working…" : "Unsuppress"}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xl">Replies</h3>
        <ul className="mt-2 space-y-2">
          {(delivery.data?.inbound ?? []).map((row: any) => (
            <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">
              <p>{row.matched ? "Matched" : "Quarantined"} · {String(row.from_email)}</p>
              <p className="whitespace-pre-wrap">{String(row.body)}</p>
              {row.quarantine_reason ? <p className="text-muted">{String(row.quarantine_reason)}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
