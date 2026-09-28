import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { compareSubmissions, disposeIntegrity, listIntegrity, saveIntegrityPolicy } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/integrity")({ component: Integrity });

function Integrity() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listIntegrity({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  return (
    <div>
      <PageTitle title="Integrity" lede={state.data?.webcam} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <form className="mb-4 grid gap-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        saveIntegrityPolicy({ data: { slug: companySlug, assessmentKey: String(form.get("key")), consentText: String(form.get("consent")), allowPaste: true, webcamRequested: false, threshold: Number(form.get("threshold")), accommodationText: String(form.get("accommodation") ?? ""), retentionDays: Number(form.get("days") ?? 30) } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <Field label="Assessment key"><input name="key" className={inputClass} defaultValue="coding" /></Field>
        <Field label="Consent text"><textarea name="consent" className={`${inputClass} min-h-20 py-2`} defaultValue="We store focus and similarity signals. They do not reject you by themselves. No camera image is stored." /></Field>
        <Field label="Similarity threshold"><input name="threshold" className={inputClass} defaultValue="80" /></Field>
        <Field label="Accommodation path"><textarea name="accommodation" className={`${inputClass} min-h-16 py-2`} defaultValue="Ask for more time or an alternative format before you start. A person reviews it. It does not reject you." /></Field>
        <Field label="Keep signals for (days)"><input name="days" className={inputClass} defaultValue="30" /></Field>
        <Button type="submit">Save policy</Button>
      </form>
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        compareSubmissions({ data: { slug: companySlug, leftId: String(form.get("left")), rightId: String(form.get("right")) } }).then((row) => setScore(`${row.score} (threshold ${row.threshold}). ${row.note}`)).catch((err: Error) => setError(err.message));
      }}>
        <input name="left" className={inputClass} placeholder="Submission id" />
        <input name="right" className={inputClass} placeholder="Other submission id" />
        <Button type="submit" variant="secondary">Compare</Button>
      </form>
      {score ? <p className="mb-3 text-sm">{score}</p> : null}
      <ul className="space-y-2">
        {(state.data?.cases ?? []).map((row: any) => (
          <li key={String(row.id)} className="rounded-md border border-line p-3 text-sm">
            <p>{String(row.summary)} · {String(row.status)}</p>
            {row.status === "OPEN" ? (
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => disposeIntegrity({ data: { slug: companySlug, caseId: String(row.id), next: "DISMISSED", note: "False positive" } }).then(() => refreshPage())}>Dismiss</Button>
                <Button type="button" variant="danger" onClick={() => disposeIntegrity({ data: { slug: companySlug, caseId: String(row.id), next: "CONFIRMED", note: "Reviewed" } }).then(() => refreshPage())}>Confirm</Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
