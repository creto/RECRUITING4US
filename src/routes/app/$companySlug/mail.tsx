import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { deleteTemplate, listInbox, listMailbox, listTemplates, queuePlatformMail, saveTemplate, suppressAddress, unsuppressAddress } from "@/server/talent.functions";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, useCompanyWorkspace, when } from "@/components/talent/kit";
import { SafeMailBody, TemplateChoices, type MailTemplatePick } from "@/components/talent/mail-compose";
import { htmlToPlain, looksLikeHtml } from "@/domain/mail-html";

export const Route = createFileRoute("/app/$companySlug/mail")({ component: Mail });

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
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [sendName, setSendName] = useState("");
  const [sendId, setSendId] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendFiles, setSendFiles] = useState<{ filename: string; mime: string; base64: string }[]>([]);
  const [fileKey, setFileKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const workspace = useCompanyWorkspace();
  if ((templates.loading && !templates.data) || templates.isPending) return <Loading />;
  const messages = filterMail(box.data?.messages ?? [], person, status, "");
  const intents = filterMail(delivery.data?.intents ?? [], person, status, kind);
  const replies = filterMail(delivery.data?.inbound ?? [], person, "", "");
  const statuses = uniqueValues([...(box.data?.messages ?? []), ...(delivery.data?.intents ?? [])], "status");
  const kinds = uniqueValues(delivery.data?.intents ?? [], "kind");
  function loadTemplate(template: MailTemplatePick) {
    setError(null);
    const who = sendName.trim();
    const id = sendId.trim();
    const recipient = sendTo.trim();
    if (who.length < 2 && id.length < 8 && !recipient.includes("@")) {
      setNotice(`"${template.name}" is ready. Add a To address, a name, or an application id, then press it again.`);
      return;
    }
    setPending(true);
    const attached = sendFiles.length;
    queuePlatformMail({ data: { slug: companySlug, applicationId: id, candidateName: who, to: recipient, kind: "FOLLOW_UP", subject: template.subject, body: template.body, idempotencyKey: crypto.randomUUID(), attachments: sendFiles.length ? sendFiles : undefined } })
      .then(() => { setNotice(`Queued "${template.name}" in the company card${attached ? ` with ${attached} file${attached === 1 ? "" : "s"}` : ""}. Stored, accepted, delivered, bounced, or failed shows in the delivery queue.`); refreshPage(); })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not queue."))
      .finally(() => setPending(false));
  }
  function startEdit(template: MailTemplatePick) {
    const wording = looksLikeHtml(template.body) ? htmlToPlain(template.body) : template.body;
    setEditing(template.id);
    setName(template.name);
    setSubject(template.subject);
    setBody(wording);
  }
  return (
    <div>
      <PageTitle title="Mail" lede="Every message from this page is one of your templates, inside the company card. The inbox shows that card, with Powered by RECRUIT4US at the bottom." />
      {templates.error ? <Alert>{templates.error}</Alert> : null}
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      <p className="mb-4 text-sm text-muted">{templates.data?.note}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl">Send a template</h2>
          <p className="mt-2 text-sm text-muted">There is no separate message box. Press a template to send that wording. Tokens: {"{{candidate_name}} {{job_title}} {{company_name}} {{recruiter_name}}"}</p>
          <div className="mt-3 space-y-2">
            <Field label="To">
              <input className={inputClass} type="text" inputMode="email" value={sendTo} onChange={(event) => setSendTo(event.target.value)} placeholder="oscar@gmail.com or any outside inbox" />
            </Field>
            <Field label="Candidate name">
              <input className={inputClass} value={sendName} onChange={(event) => setSendName(event.target.value)} placeholder="Exact name" />
            </Field>
            <Field label="Application id">
              <input className={inputClass} value={sendId} onChange={(event) => setSendId(event.target.value)} placeholder="Or paste an application id" />
            </Field>
            <p className="text-sm text-muted">To can be any address. A name sends only when one application matches. An application id is used as written.</p>
            <Field label="Files">
              <input
                key={fileKey}
                className={inputClass}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,application/pdf,image/png,image/jpeg,text/plain,text/csv"
                onChange={(event) => {
                  void readMailFiles(event.target.files).then(setSendFiles).catch((err: Error) => setError(err.message));
                }}
              />
            </Field>
            {sendFiles.length ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>{sendFiles.map((file) => file.filename).join(", ")}</span>
                <Button type="button" variant="ghost" onClick={() => { setSendFiles([]); setFileKey((value) => value + 1); }}>Remove files</Button>
              </div>
            ) : null}
            <p className="text-sm text-muted">Up to 3 files, 700 KB each. PDF, PNG, JPEG, text, CSV, or Word. They go with the next template you send.</p>
            <TemplateChoices
              templates={templates.data?.templates ?? []}
              pendingId={pending ? "sending" : null}
              hint="Press a template to queue it in the company card."
              onChoose={loadTemplate}
            />
            {notice ? <p className="text-sm">{notice}</p> : null}
          </div>
          <h2 className="mt-8 text-2xl">Templates</h2>
          <p className="mt-2 text-sm text-muted">Edit the wording inside the card. The Powered by line is part of every send and is not a field.</p>
          <ul className="mt-3 space-y-2">
            {(templates.data?.templates ?? []).map((template) => (
              <li key={template.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
                <p className="font-medium">{template.name}</p>
                <p className="text-muted">{template.subject}</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" disabled={pending} onClick={() => loadTemplate(template)}>Send</Button>
                  <Button type="button" variant="secondary" onClick={() => startEdit(template)}>Edit</Button>
                  <Button type="button" variant="danger" onClick={() => deleteTemplate({ data: { slug: companySlug, id: template.id } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
          <form className="mt-4 space-y-3" onSubmit={(event) => {
            event.preventDefault();
            saveTemplate({ data: { slug: companySlug, id: editing, name, subject, body } })
              .then(() => { setEditing(undefined); setName(""); setSubject(""); setBody(""); refreshPage(); })
              .catch((err) => setError(err instanceof Error ? err.message : "Could not save."));
          }}>
            <Field label={editing ? "Template name" : "New template name"}>
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <article className="overflow-hidden rounded-[28px] border border-[#d7e1da] bg-white shadow-[0_18px_40px_rgba(20,34,27,0.08)]">
              <div className="bg-accent px-5 py-4 text-accent-ink">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em]">Inbox</p>
                <p className="mt-1 text-2xl leading-tight">{workspace.data?.company.name ?? "Company"}</p>
              </div>
              <div className="space-y-3 px-5 py-4">
                <Field label="Subject">
                  <input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} required />
                </Field>
                <Field label="Message">
                  <textarea className={`${inputClass} min-h-40 py-3 leading-relaxed`} value={body} onChange={(event) => setBody(event.target.value)} required />
                </Field>
                <p className="text-xs text-muted">A web address on its own line becomes a button in the inbox.</p>
              </div>
              <div className="flex items-center gap-3 border-t border-[#d7e1da] bg-[#f7faf8] px-5 py-4">
                <img src="/mark.png" alt="" width={72} height={40} className="h-8 w-auto" />
                <p className="text-xs text-muted">Powered by <span className="font-medium text-ink">RECRUIT4US</span></p>
              </div>
            </article>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editing ? "Save template" : "Add template"}</Button>
              {editing ? <Button type="button" variant="ghost" onClick={() => { setEditing(undefined); setName(""); setSubject(""); setBody(""); }}>Cancel</Button> : null}
            </div>
          </form>
        </section>
        <section>
          <h2 className="text-2xl">Inside this product</h2>
          <p className="mt-1 text-sm text-muted">These rows are the in-product copy. They are not provider delivery. The latest 80 are listed. Narrow them instead of reading the whole queue.</p>
          <MailNarrow person={person} status={status} kind={kind} statuses={statuses} kinds={kinds} onPerson={setPerson} onStatus={setStatus} onKind={setKind} />
          {box.loading && !box.data ? <Loading /> : null}
          {box.error ? <Alert>{box.error}</Alert> : null}
          {(box.data?.messages ?? []).length === 0 ? <Empty title="No candidate mail yet" body="Open an application and use the Email tab." /> : null}
          {box.data?.messages?.length && messages.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing matches that filter.</p> : null}
          <ul className="mt-3 space-y-2">
            {messages.map((message) => (
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
                <SafeMailBody body={message.body} />
                {message.application_id ? <AppLink className="mt-2 inline-flex text-link" href={`/app/${companySlug}/applications/${message.application_id}`}>Open application</AppLink> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl">Delivery queue</h2>
        <p className="mt-2 text-sm text-muted">{delivery.data?.note}</p>
        <p className="mt-2 text-sm text-muted">{delivery.data?.setup}</p>
        <p className="text-sm">Provider: {delivery.data?.provider ?? "…"}. Inbound secret: {delivery.data?.secretConfigured ? "set" : "not set, so outside replies are refused"}.</p>
        {delivery.data?.sender ? <p className="text-sm">From {delivery.data.sender}. {delivery.data.externalBlocked ? "External delivery is blocked." : "SMTP is configured. Watch the state, not the send button."}</p> : <p className="text-sm">No verified sender is configured. External delivery is blocked.</p>}
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          suppressAddress({ data: { slug: companySlug, email: String(data.get("email") ?? ""), reason: "Recruiter suppression" } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
        }}>
          <input name="email" className={inputClass} placeholder="Suppress an address" />
          <Button type="submit" variant="secondary">Suppress</Button>
        </form>
        <h3 className="mt-4 text-xl">Suppressed addresses</h3>
        {(delivery.data?.suppressions ?? []).length === 0 ? <p className="mt-2 text-sm text-muted">No addresses are suppressed.</p> : null}
        <ul className="mt-2 space-y-2">
          {(delivery.data?.suppressions ?? []).map((row: { email?: string; reason?: string }) => (
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
        <ul className="mt-4 space-y-2">
          {(delivery.data?.intents ?? []).length === 0 ? <li className="text-sm text-muted">Nothing is queued. Queue a message above. Addresses at bounce.example bounce. defer.example retries once. fail.example fails.</li> : null}
          {intents.length === 0 && (delivery.data?.intents ?? []).length > 0 ? <li className="text-sm text-muted">Nothing in the queue matches that filter.</li> : null}
          {intents.map((row: any) => (
            <li key={String(row.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
              <p className="font-medium">{String(row.subject)}</p>
              <p>{String(row.status)} · {String(row.state_label)}</p>
              <p className="text-muted">To {String(row.to_email)}{row.candidate_name ? ` · ${String(row.candidate_name)}` : ""}{row.job_title ? ` · ${String(row.job_title)}` : ""} · {String(row.kind)} · attempts {String(row.attempt_count)} · {String(row.provider)}{row.attached ? ` · files ${String(row.attached)}` : ""}</p>
              {row.application_id ? <p className="font-mono text-xs text-muted">{String(row.application_id)}</p> : null}
              {row.last_error ? <p className="text-muted">{String(row.last_error)}</p> : null}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xl">Replies</h3>
        <ul className="mt-2 space-y-2">
          {(delivery.data?.inbound ?? []).length > 0 && replies.length === 0 ? <li className="text-sm text-muted">No reply matches that person.</li> : null}
          {replies.map((row: any) => (
            <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">
              <p>{row.matched ? "Matched" : "Quarantined"} · {String(row.from_email)}</p>
              <SafeMailBody body={String(row.body)} className="text-sm" />
              {row.quarantine_reason ? <p className="text-muted">{String(row.quarantine_reason)}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function filterMail<T extends Record<string, unknown>>(rows: T[], person: string, status: string, kind: string): T[] {
  const needle = person.trim().toLowerCase();
  return rows.filter((row) => {
    if (status && String(row.status ?? "") !== status) return false;
    if (kind && String(row.kind ?? "") !== kind) return false;
    if (!needle) return true;
    const hay = [row.candidate_name, row.to_email, row.from_email, row.subject, row.job_title, row.application_id]
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

function uniqueValues(rows: Record<string, unknown>[], key: string): string[] {
  return [...new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean))].sort();
}

async function readMailFiles(list: FileList | null): Promise<{ filename: string; mime: string; base64: string }[]> {
  const picked = Array.from(list ?? []);
  if (picked.length > 3) throw new Error("Attach at most 3 files.");
  const files = [];
  for (const file of picked) {
    if (file.size > 700_000) throw new Error(`${file.name} is over 700 KB.`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    const step = 0x8000;
    for (let index = 0; index < bytes.length; index += step) {
      binary += String.fromCharCode(...bytes.subarray(index, index + step));
    }
    files.push({ filename: file.name, mime: file.type || "application/octet-stream", base64: btoa(binary) });
  }
  return files;
}

function MailNarrow({
  person,
  status,
  kind,
  statuses,
  kinds,
  onPerson,
  onStatus,
  onKind,
}: {
  person: string;
  status: string;
  kind: string;
  statuses: string[];
  kinds: string[];
  onPerson: (value: string) => void;
  onStatus: (value: string) => void;
  onKind: (value: string) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-3">
      <Field label="Person, email, or job">
        <input className={inputClass} value={person} placeholder="Ada, or an email" onChange={(event) => onPerson(event.target.value)} />
      </Field>
      <Field label="Status">
        <select className={inputClass} value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label="Kind">
        <select className={inputClass} value={kind} onChange={(event) => onKind(event.target.value)}>
          <option value="">All kinds</option>
          {kinds.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
    </div>
  );
}
