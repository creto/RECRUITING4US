import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createBookingLink, finishCalendarConnect, listCalendarDesk, retryCalendarEvent, revokeCalendar } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/calendar")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$companySlug/interviews", params: { companySlug: params.companySlug }, hash: "scheduling" });
  },
});

export function SchedulingDesk({ companySlug }: { companySlug: string }) {
  const state = useAuthed(() => listCalendarDesk({ data: { slug: companySlug } }), [companySlug]);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <section id="scheduling" className="mt-10">
      <h2 className="text-2xl">Calendar</h2>
      <p className="mt-2 text-sm text-muted">Two people cannot take the same open slot. A provider error stays as sync failed until you retry it. ICS is a file, not a connected calendar.</p>
      {state.loading || state.isPending ? <div className="mt-3"><Loading /></div> : null}
      {state.error ? <div className="mt-3"><Alert>{state.error}</Alert></div> : null}
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
      <ul className="mb-4 mt-3 space-y-1 text-sm">
        {(state.data?.steps ?? []).map((step: string) => <li key={step}>{step}</li>)}
      </ul>
      <ul className="mb-4 space-y-1 text-sm">
        {(state.data?.connections ?? []).map((row: { provider?: string; status?: string; detail?: string; oauth_stored?: boolean }) => <li key={String(row.provider)}>{String(row.provider)} · {String(row.status)} · {String(row.detail)}{row.oauth_stored ? " · token stored, not shown" : ""}</li>)}
      </ul>
      {state.data?.authUrl ? <p className="mb-3 text-sm">Authorization URL: <a className="underline" href={state.data.authUrl}>{state.data.authUrl}</a></p> : null}
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const code = String(new FormData(event.currentTarget).get("code") ?? "");
        finishCalendarConnect({ data: { slug: companySlug, code } }).then((row) => setError(row.detail)).catch((err: Error) => setError(err.message));
      }}>
        <input name="code" className={inputClass} placeholder="Authorization code" />
        <Button type="submit" variant="secondary">Exchange code</Button>
        <Button type="button" variant="danger" onClick={() => revokeCalendar({ data: { slug: companySlug } }).then(() => state.reload()).catch((err: Error) => setError(err.message))}>Revoke</Button>
      </form>
      <form className="grid gap-2 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        createBookingLink({ data: { slug: companySlug, applicationId: String(form.get("applicationId")), title: String(form.get("title")), durationMin: Number(form.get("duration")), timezone: String(form.get("timezone")) } }).then((row) => setToken(row.token)).catch((err: Error) => setError(err.message));
      }}>
        <Field label="Application"><input name="applicationId" className={inputClass} /></Field>
        <Field label="Title"><input name="title" className={inputClass} defaultValue="Technical interview" /></Field>
        <Field label="Minutes"><input name="duration" className={inputClass} defaultValue="45" /></Field>
        <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue="America/New_York" /></Field>
        <Button type="submit">Create self-schedule link</Button>
      </form>
      {token ? <p className="mt-3 text-sm">Candidate path: /book/{token}</p> : null}
      <ul className="mt-4 space-y-2 text-sm">
        {(state.data?.events ?? []).map((row: { id?: string; title?: string; status?: string; starts_at?: string; detail?: string }) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3">
            {String(row.title)} · {String(row.status)} · {when(String(row.starts_at))} · {String(row.detail)}
            {row.status === "SYNC_FAILED" ? <Button type="button" className="ml-2" variant="secondary" onClick={() => retryCalendarEvent({ data: { slug: companySlug, eventId: String(row.id) } }).then((result) => setError(result.detail)).catch((err: Error) => setError(err.message))}>Retry sync</Button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
