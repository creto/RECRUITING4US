import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listInbox, queuePlatformMail, suppressAddress, unsuppressEmail } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/inbox")({ component: Inbox });

function looksSuppressed(row: { status?: unknown; last_error?: unknown; state_label?: unknown }) {
  const status = String(row.status ?? "");
  const err = `${row.last_error ?? ""} ${row.state_label ?? ""}`.toLowerCase();
  return status === "SUPPRESSED" || status === "BOUNCED" || status === "COMPLAINED" || err.includes("suppress");
}

function Inbox() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listInbox({ data: { slug: companySlug } }), [companySlug]);
  const [applicationId, setApplicationId] = useState("");
  const [subject, setSubject] = useState("Hello {{candidate_name}}");
  const [body, setBody] = useState("Hello {{candidate_name}},\n\nThis is about {{job_title}} at {{company_name}}.\n\n{{recruiter_name}}");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  const box = state.data;
  const runUnsuppress = (email: string) => {
    setBusy(email);
    setError(null);
    unsuppressEmail({ data: { slug: companySlug, email } })
      .then((result) => {
        setError(result.note ?? "Address unsuppressed. You can retry send.");
        refreshPage();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(null));
  };
  return (
    <div>
      <PageTitle title="Delivery" lede={box?.note} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <p className="mb-4 text-sm text-muted">Provider: {box?.provider}. Inbound secret: {box?.secretConfigured ? "set" : "not set, so outside replies are refused"}. Resend unsuppress: {box?.resendReady ? "ready" : "set RESEND_API_KEY on Vercel"}.</p>
      <form className="mb-6 grid gap-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
        event.preventDefault();
        queuePlatformMail({ data: { slug: companySlug, applicationId, kind: "FOLLOW_UP", subject, body, idempotencyKey: crypto.randomUUID() } })
          .then(() => refreshPage())
          .catch((err: Error) => setError(err.message));
      }}>
        <Field label="Application id"><input className={inputClass} value={applicationId} onChange={(event) => setApplicationId(event.target.value)} /></Field>
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
      <form className="mb-6 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        runUnsuppress(String(data.get("email") ?? ""));
      }}>
        <input name="email" className={inputClass} placeholder="Unsuppress an address" />
        <Button type="submit" variant="secondary" disabled={Boolean(busy)}>Unsuppress</Button>
      </form>
      {(box?.suppressions ?? []).length > 0 ? (
        <div className="mb-6">
          <h2 className="text-xl">Suppressed addresses</h2>
          <ul className="mt-2 space-y-2">
            {(box?.suppressions ?? []).map((row: { email: string; reason: string }) => (
              <li key={row.email} className="flex flex-wrap items-center gap-2 rounded-[24px] border border-line bg-white p-3 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
                <span>{row.email} · {row.reason || "suppressed"}</span>
                <Button type="button" variant="secondary" disabled={busy === row.email} onClick={() => runUnsuppress(row.email)}>
                  {busy === row.email ? "Working…" : "Unsuppress"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {(box?.intents ?? []).length === 0 ? <Empty title="No queued mail" body="Queue a message from an application. Addresses at bounce.example bounce. defer.example retries once. fail.example fails." /> : null}
      <ul className="space-y-2">
        {(box?.intents ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
            <p className="font-medium">{String(row.subject)}</p>
            <p>{String(row.to_email)} · {String(row.status)} · {String(row.provider)} · attempts {String(row.attempt_count)}</p>
            <p className="text-muted">{String(row.last_error || "")}</p>
            {looksSuppressed(row) ? (
              <div className="mt-2">
                <Button type="button" variant="secondary" disabled={busy === String(row.to_email)} onClick={() => runUnsuppress(String(row.to_email))}>
                  {busy === String(row.to_email) ? "Working…" : "Unsuppress"}
                </Button>
              </div>
            ) : null}
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
