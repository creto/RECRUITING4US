import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getConnectors, pipeAnalytics, saveConnectorConfig, sendDirectText } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/connectors")({ component: Connectors });

function Connectors() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => getConnectors({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const data = state.data;
  if (!data) return null;
  return (
    <div>
      <PageTitle
        title="Connectors"
        lede="Texts stay in this workspace because no carrier is connected. Analytics extracts stay here until an https destination is saved, and that post carries no API key and no candidate names."
      />
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      {notice ? <p className="mb-3 text-sm">{notice}</p> : null}
      <section className="mb-6 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
        <h2 className="text-2xl">Integration health</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(data.health ?? []).map((row: { name: string; state: string }) => (
            <li key={row.name}><span className="font-medium">{row.name}. </span>{row.state}</li>
          ))}
        </ul>
        <h3 className="mt-4 text-xl">Mail queue</h3>
        <ul className="mt-2 text-sm">
          {(data.queue ?? []).length === 0 ? <li className="text-muted">No delivery rows.</li> : null}
          {(data.queue ?? []).map((row: { status: string; n: number }) => (
            <li key={row.status}>{row.status}: {row.n}</li>
          ))}
        </ul>
      </section>
      <form className="space-y-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        saveConnectorConfig({
          data: {
            slug: companySlug,
            senderLabel: String(form.get("senderLabel") ?? ""),
            destination: String(form.get("destination") ?? ""),
            dataset: String(form.get("dataset") ?? "pipeline"),
          },
        }).then(() => refreshPage()).catch((err) => setError(err.message));
      }}>
        <h2 className="text-2xl">Configuration</h2>
        <Field label="Text sender label">
          <input name="senderLabel" className={inputClass} defaultValue={data.senderLabel} disabled={!data.canConfigure} />
        </Field>
        <p className="text-sm text-muted">The label is stored with the workspace. It is not a phone number and it does not reach a carrier.</p>
        <Field label="Analytics destination (https)">
          <input name="destination" className={inputClass} defaultValue={data.destination} placeholder="Leave blank to keep extracts here" disabled={!data.canConfigure} />
        </Field>
        <Field label="Default extract">
          <select name="dataset" className={inputClass} defaultValue={data.dataset} disabled={!data.canConfigure}>
            <option value="pipeline">Active pipeline counts</option>
            <option value="scores">Final scores only</option>
            <option value="assignments">Assessment assignment counts</option>
          </select>
        </Field>
        {data.canConfigure ? <Button type="submit">Save configuration</Button> : <p className="text-sm text-muted">An owner or admin saves the destination.</p>}
      </form>
      {data.canPipe ? (
        <form className="mt-6 space-y-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          pipeAnalytics({ data: { slug: companySlug, dataset: String(form.get("dataset")) as "pipeline" | "scores" | "assignments" } })
            .then((result) => {
              setNotice(`${result.status}: ${result.detail}`);
              refreshPage();
            })
            .catch((err) => setError(err.message));
        }}>
          <h2 className="text-2xl">Business Intelligence connector</h2>
          <Field label="Extract">
            <select name="dataset" className={inputClass} defaultValue={data.dataset}>
              <option value="pipeline">Active pipeline counts</option>
              <option value="scores">Final scores only</option>
              <option value="assignments">Assessment assignment counts</option>
            </select>
          </Field>
          <Button type="submit">Pipe extract</Button>
        </form>
      ) : null}
      {data.canPipe ? (
        <section className="mt-6">
          <h2 className="text-2xl">Delivery log</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.deliveries.length === 0 ? <li className="text-muted">No extract has been piped yet.</li> : null}
            {data.deliveries.map((row) => (
              <li key={row.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3">
                <p>{row.dataset} · {row.status} · {row.rowCount} rows · {when(row.at)}</p>
                <p className="text-muted">{row.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {data.canText ? (
        <section className="mt-6">
          <h2 className="text-2xl">Texts</h2>
          <form className="mt-3 space-y-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            sendDirectText({
              data: { slug: companySlug, phone: String(form.get("phone") ?? ""), body: String(form.get("body") ?? "") },
            }).then((result) => {
              setNotice(`${result.status}: ${result.reason}`);
              refreshPage();
            }).catch((err) => setError(err.message));
          }}>
            <Field label="Phone"><input name="phone" className={inputClass} required /></Field>
            <Field label="Message"><textarea name="body" className={`${inputClass} min-h-20 py-2`} required /></Field>
            <Button type="submit" variant="secondary">Store text</Button>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {data.texts.length === 0 ? <li className="text-muted">No texts stored.</li> : null}
            {data.texts.map((row) => (
              <li key={row.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3">
                <p>{row.status} · {row.toPhone || "no number"} · {when(row.at)}</p>
                <p className="mt-1 whitespace-pre-wrap">{row.body}</p>
                <p className="text-muted">{row.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
