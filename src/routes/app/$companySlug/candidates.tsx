import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addCandidateManual, exportCsv, importCsv, listCandidates, listJobs } from "@/server/talent.functions";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, Section, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/candidates")({ component: Candidates });

function Candidates() {
  const { companySlug } = Route.useParams();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [education, setEducation] = useState("");
  const [criteria, setCriteria] = useState("");
  const [submitted, setSubmitted] = useState({ query: "", location: "", education: "", criteria: "" });
  const state = useAuthed(
    () => listCandidates({ data: { slug: companySlug, query: submitted.query, location: submitted.location, education: submitted.education, criteria: submitted.criteria } }),
    [companySlug, submitted],
  );
  const jobs = useAuthed(() => listJobs({ data: { slug: companySlug } }), [companySlug]);
  const [csv, setCsv] = useState("name,email,source\nAda Example,ada@northstar.example,IMPORT");
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");
  const [jobId, setJobId] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  async function copyId(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const node = document.createElement("textarea");
      node.value = value;
      node.setAttribute("readonly", "");
      node.style.position = "fixed";
      node.style.left = "-9999px";
      document.body.appendChild(node);
      node.select();
      document.execCommand("copy");
      node.remove();
    }
    setCopied(value);
  }

  async function addPerson(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setAdded(null);
    try {
      const result = await addCandidateManual({ data: { slug: companySlug, name: personName, email: personEmail, jobId: jobId || undefined } });
      if (result.applicationId && result.alreadyActive) {
        setAdded(`Already on this job. Application id ${result.applicationId}`);
      } else if (result.applicationId) {
        setAdded(`Application id ${result.applicationId}`);
      } else {
        setAdded("Person stored. Choose a job to create an application id.");
      }
      setPersonName("");
      setPersonEmail("");
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that person.");
    }
  }

  if (state.loading || state.isPending) return <Loading />;
  const people = state.data ?? [];
  return (
    <div>
      <PageTitle title="Candidates" lede="People who applied to this company. Search looks at indexed resumes and application answers. It does not reject anyone." />
      <details className="mb-6 max-w-2xl text-sm text-muted">
        <summary className="cursor-pointer text-link">How search works</summary>
        <p className="mt-2">A CV is indexed into titles, skills, education, locations, years, and work-history lines. The original file stays attached. DOCX, PDF, and text can be indexed. Legacy .doc is kept and not extracted. AND, OR, NOT, quotes, and parentheses are Boolean. Words without an operator must all appear. Location, education, and a custom phrase omit anyone whose indexed text or answers do not contain them.</p>
      </details>
      {state.error ? <Alert>{state.error}</Alert> : null}
      <form className="rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" onSubmit={(event) => { event.preventDefault(); setSubmitted({ query, location, education, criteria }); }}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Boolean search">
            <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="typescript AND (sql OR react) NOT retail" />
          </Field>
          <Field label="Custom phrase">
            <input className={inputClass} value={criteria} onChange={(event) => setCriteria(event.target.value)} placeholder="A skill or an answer" />
          </Field>
          <Field label="Location">
            <input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} />
          </Field>
          <Field label="Education">
            <input className={inputClass} value={education} onChange={(event) => setEducation(event.target.value)} />
          </Field>
        </div>
        <Button type="submit" className="mt-3" variant="secondary">Search</Button>
      </form>
      <Section title="Results" lede={people.length === 0 ? undefined : `${people.length} ${people.length === 1 ? "person" : "people"}`}>
        {people.length === 0 ? <Empty title="No matching candidates" body="Applications from the careers page show up here." /> : null}
        <ul className="space-y-3">
          {people.map((person) => {
            const lines = person.applicationsList ?? [];
            return (
            <li key={person.id} className="rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg">{person.name}</h3>
                  <p className="text-sm text-muted">{person.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[#f7fbe9] px-2.5 py-1">{person.source}</span>
                  <span className="rounded-full border border-line px-2.5 py-1">{person.applications} applications</span>
                  {person.tags ? <span className="rounded-full border border-line px-2.5 py-1">{person.tags}</span> : null}
                </div>
              </div>
              {lines.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No application id yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {lines.map((line) => (
                    <li key={line.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <AppLink href={`/app/${companySlug}/applications/${line.id}`} className="font-mono text-xs text-link">{line.id}</AppLink>
                      <span className="text-muted">{line.title}{line.lifecycle && line.lifecycle !== "ACTIVE" ? ` · ${line.lifecycle}` : ""}</span>
                      <Button type="button" variant="ghost" className="min-h-9 px-3" onClick={() => copyId(line.id)}>Copy id</Button>
                    </li>
                  ))}
                </ul>
              )}
              {copied && lines.some((line) => line.id === copied) ? <p className="mt-1 text-xs text-ok">Copied.</p> : null}
              {person.indexed ? (
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  {person.titles?.length ? <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Titles</dt><dd>{person.titles.slice(0, 2).join("; ")}</dd></div> : null}
                  {person.skills?.length ? <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Skills</dt><dd>{person.skills.slice(0, 6).join(", ")}</dd></div> : null}
                  {person.education?.length ? <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Education</dt><dd>{person.education.slice(0, 2).join("; ")}</dd></div> : null}
                  {person.locations?.length ? <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Locations</dt><dd>{person.locations.join(", ")}</dd></div> : null}
                  {person.years != null ? <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Years mentioned</dt><dd>{person.years}</dd></div> : null}
                  {person.history?.length ? <div className="sm:col-span-2"><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">History</dt><dd>{person.history[0]}</dd></div> : null}
                  {!person.titles?.length && !person.skills?.length ? <p className="text-muted sm:col-span-2">Indexed. No title or skill phrase matched the dictionary.</p> : null}
                </dl>
              ) : <p className="mt-3 text-sm text-muted">No indexed CV yet. A search for words in a resume will not list this person.</p>}
              {person.knockout ? <p className="mt-3 text-sm text-muted">{person.knockout}</p> : null}
            </li>
            );
          })}
        </ul>
      </Section>
      <Section title="Add a person" lede="Creates a candidate. Choose a job to also open an active application and get its id.">
        <form className="grid gap-3 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)] md:grid-cols-2" onSubmit={addPerson}>
          <Field label="Name">
            <input className={inputClass} value={personName} onChange={(event) => setPersonName(event.target.value)} required />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={personEmail} onChange={(event) => setPersonEmail(event.target.value)} required />
          </Field>
          <Field label="Job">
            <select className={inputClass} value={jobId} onChange={(event) => setJobId(event.target.value)}>
              <option value="">No job — person only</option>
              {(jobs.data ?? []).map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="submit">Add</Button>
          </div>
          {added ? <p className="text-sm text-ok md:col-span-2">{added}</p> : null}
          {jobs.error ? <p className="text-sm text-muted md:col-span-2">Jobs could not be loaded. You can still add a person without an application.</p> : null}
        </form>
      </Section>
      <Section title="Files" lede="Export what is already here, or preview a CSV before it is written.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
            <h3 className="text-lg">Export</h3>
            <p className="mt-2 text-sm text-muted">Spreadsheet formulas in names are escaped.</p>
            <Button type="button" className="mt-3" variant="secondary" onClick={() => download().catch((err) => setError(err.message))}>Download CSV</Button>
          </div>
          <form className="space-y-3 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" onSubmit={(event) => event.preventDefault()}>
            <h3 className="text-lg">Import</h3>
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
      </Section>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </div>
  );
}
