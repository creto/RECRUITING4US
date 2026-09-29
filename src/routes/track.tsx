import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { trackApplications } from "@/server/talent.functions";
import { trackQuery } from "@/domain/sheet";
import { Alert, Button, Field, inputClass, PageTitle, StageBar, Wordmark } from "@/components/talent/kit";

export const Route = createFileRoute("/track")({ component: Track });

type Item = {
  companyName: string;
  jobTitle: string;
  stageName: string;
  label: string;
  steps: string[];
  index: number;
  stopped: boolean;
  hired: boolean;
};

function Track() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/"><Wordmark /></Link>
      <PageTitle title="Application status" lede="Enter the email you applied with, the receipt from the apply form, or the application id. You see the stage only. Notes, scores, and pay stay with the employer." />
      <form className="space-y-3 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" onSubmit={(event) => {
        event.preventDefault();
        const parsed = trackQuery(query);
        if ("error" in parsed) {
          setItems(null);
          setError(parsed.error);
          return;
        }
        setError(null);
        setPending(true);
        trackApplications({ data: { query } })
          .then((result) => setItems(result.items))
          .catch((err: unknown) => {
            setItems(null);
            const message = err instanceof Error ? err.message : "";
            setError(!message || message.startsWith("[") || message.startsWith("{")
              ? "Enter the email or the receipt from the apply form."
              : message);
          })
          .finally(() => setPending(false));
      }}>
        <Field label="Email, receipt, or application id">
          <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ada@example.com or R-ABC1234Z" required />
        </Field>
        <Button type="submit" disabled={pending}>{pending ? "Looking" : "Show progress"}</Button>
      </form>
      {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      {items && items.length === 0 ? <p className="mt-4 text-sm text-muted">No application matches that email or id.</p> : null}
      <ul className="mt-4 space-y-3">
        {(items ?? []).map((item, position) => (
          <li key={`${item.companyName}-${item.jobTitle}-${position}`} className="rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
            <p className="text-xl">{item.jobTitle}</p>
            <p className="text-sm text-muted">{item.companyName}</p>
            <p className="mt-2 text-sm">{item.label}{item.stageName && item.stageName !== item.label ? ` · ${item.stageName}` : ""}</p>
            <StageBar steps={item.steps} index={item.hired ? item.steps.length : item.index} stopped={item.stopped} />
          </li>
        ))}
      </ul>
    </main>
  );
}
