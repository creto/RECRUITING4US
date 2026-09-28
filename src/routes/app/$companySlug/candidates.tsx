import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { exportCsv, importCsv, listCandidates } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/candidates")({ component: Candidates });

function Candidates() {
  const { companySlug } = Route.useParams();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const state = useAuthed(() => listCandidates({ data: { slug: companySlug, query: submitted } }), [companySlug, submitted]);
  const [csv, setCsv] = useState("name,email,source\nAda Example,ada@northstar.example,IMPORT");
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    const file = await exportCsv({ data: { slug: companySlug } });
    const blob = new Blob([file.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function preview(commit: boolean) {
    setError(null);
    try {
      const result = await importCsv({ data: { slug: companySlug, csv, commit } });
      setReport(result.report.map((row) => `Row ${row.row}: ${row.status} — ${row.message}`).join("\n"));
      if (commit) refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    }
  }

  if (state.loading || state.isPending) return <Loading />;
  return (
    <div>
      <PageTitle title="Candidates" lede="Search stays inside this company. Names that also exist at another employer are not merged." />
      {state.error ? <Alert>{state.error}</Alert> : null}
      <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setSubmitted(query); }}>
        <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" aria-label="Search candidates" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      {(state.data ?? []).length === 0 ? <Empty title="No matching candidates" body="Applications from the careers page show up here." /> : null}
      <ul className="space-y-2">
        {(state.data ?? []).map((person) => (
          <li key={person.id} className="rounded-md border border-line bg-surface px-4 py-3 text-sm">
            <span className="font-medium">{person.name}</span>
            <span className="mt-1 block text-muted">{person.email} · {person.source} · {person.applications} applications{person.tags ? ` · ${person.tags}` : ""}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-line bg-surface p-4">
          <h2 className="text-2xl">Export</h2>
          <p className="mt-2 text-sm text-muted">Spreadsheet formulas in names are escaped.</p>
          <Button type="button" className="mt-3" variant="secondary" onClick={() => download().catch((err) => setError(err.message))}>Download CSV</Button>
        </div>
        <form className="space-y-3 rounded-md border border-line bg-surface p-4" onSubmit={(event) => event.preventDefault()}>
          <h2 className="text-2xl">Import</h2>
          <Field label="CSV">
            <textarea className={`${inputClass} min-h-28 py-2 font-mono`} value={csv} onChange={(event) => setCsv(event.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => preview(false)}>Dry run</Button>
            <Button type="button" onClick={() => preview(true)}>Import</Button>
          </div>
          {report ? <pre className="whitespace-pre-wrap text-xs text-muted">{report}</pre> : null}
        </form>
      </div>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </div>
  );
}
