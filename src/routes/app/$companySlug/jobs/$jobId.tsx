import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { applicationSheet, getJob, listAssessments, setJobStatus, updateJob } from "@/server/talent.functions";
import { applicationForm } from "@/domain/cv-index";
import { Alert, AppLink, Button, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/jobs/$jobId")({ component: JobEditor });

function JobEditor() {
  const { companySlug, jobId } = Route.useParams();
  const path = useRouterState({ select: (router) => router.location.pathname });
  const state = useAuthed(() => getJob({ data: { slug: companySlug, jobId } }), [companySlug, jobId]);
  const tests = useAuthed(() => listAssessments({ data: { slug: companySlug } }), [companySlug]);
  const [form, setForm] = useState<Record<string, string | boolean | number | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const job = state.data?.job as Record<string, unknown> | undefined;
    if (!job) return;
    setForm({
      title: String(job.title ?? ""),
      department: String(job.department ?? ""),
      locations: String(job.locations ?? ""),
      workArrangement: String(job.work_arrangement ?? "HYBRID"),
      employmentType: String(job.employment_type ?? "FULL_TIME"),
      description: String(job.description ?? ""),
      skills: String(job.skills ?? ""),
      screenRequired: String(job.screen_required ?? ""),
      screenPreferred: String(job.screen_preferred ?? ""),
      screenAssessmentId: String(job.screen_assessment_id ?? ""),
      scorecardAttributes: String(job.scorecard_attributes ?? ""),
      knockoutYears: knockoutYears(job.form_schema),
      requireAuthorization: knockoutAuth(job.form_schema),
      salaryMin: job.salary_min == null ? "" : String(job.salary_min),
      salaryMax: job.salary_max == null ? "" : String(job.salary_max),
      salaryVisible: Boolean(job.salary_visible),
      openings: String(job.openings ?? 1),
    });
  }, [state.data]);

  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const job = state.data?.job as { status?: string; job_slug?: string } | undefined;
  if (!job) return null;
  if (path.endsWith("/pipeline")) return <Outlet />;

  function set(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.knockoutYears !== "" && form.knockoutYears != null && yearsValue(form.knockoutYears) == null) {
      setError("Minimum years must be a whole number from 0 to 40, or blank.");
      return;
    }
    try {
      await updateJob({
        data: {
          slug: companySlug,
          jobId,
          title: String(form.title ?? ""),
          department: String(form.department ?? ""),
          locations: String(form.locations ?? ""),
          workArrangement: String(form.workArrangement ?? "HYBRID") as "HYBRID",
          employmentType: String(form.employmentType ?? "FULL_TIME") as "FULL_TIME",
          description: String(form.description ?? ""),
          skills: String(form.skills ?? ""),
          salaryMin: form.salaryMin === "" || form.salaryMin == null ? null : Number(form.salaryMin),
          salaryMax: form.salaryMax === "" || form.salaryMax == null ? null : Number(form.salaryMax),
          salaryCurrency: "USD",
          salaryVisible: Boolean(form.salaryVisible),
          openings: Number(form.openings) || 1,
          formSchema: applicationForm({
            minYears: yearsValue(form.knockoutYears),
            requireAuthorization: Boolean(form.requireAuthorization),
          }),
          screenRequired: String(form.screenRequired ?? ""),
          screenPreferred: String(form.screenPreferred ?? ""),
          screenAssessmentId: String(form.screenAssessmentId ?? ""),
          scorecardAttributes: String(form.scorecardAttributes ?? ""),
        },
      });
      setSaved("Draft saved. Publish to update the public page.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  async function status(next: string) {
    setError(null);
    try {
      await setJobStatus({ data: { slug: companySlug, jobId, status: next } });
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  return (
    <div>
      <PageTitle title={String(form.title || "Job")} lede={`Status ${job.status}. The public page uses the last published revision, not unsaved draft edits.`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <AppLink className="inline-flex min-h-11 items-center rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] px-4 text-sm" href={`/app/${companySlug}/jobs/${jobId}/pipeline`}>Pipeline</AppLink>
        {job.status === "PUBLISHED" ? (
          <AppLink className="inline-flex min-h-11 items-center text-sm text-link" href={`/careers/${companySlug}/${job.job_slug}`}>View public page</AppLink>
        ) : null}
      </div>
      <ApplyPortal companySlug={companySlug} jobId={jobId} jobSlug={String(job.job_slug ?? "")} published={job.status === "PUBLISHED"} />
      <form className="space-y-3" onSubmit={save}>
        <Field label="Title"><input className={inputClass} value={String(form.title ?? "")} onChange={(event) => set("title", event.target.value)} /></Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Department"><input className={inputClass} value={String(form.department ?? "")} onChange={(event) => set("department", event.target.value)} /></Field>
          <Field label="Location"><input className={inputClass} value={String(form.locations ?? "")} onChange={(event) => set("locations", event.target.value)} /></Field>
          <Field label="Work arrangement">
            <select className={inputClass} value={String(form.workArrangement ?? "HYBRID")} onChange={(event) => set("workArrangement", event.target.value)}>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </Field>
          <Field label="Employment type">
            <select className={inputClass} value={String(form.employmentType ?? "FULL_TIME")} onChange={(event) => set("employmentType", event.target.value)}>
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </Field>
          <Field label="Annual minimum (USD)"><input className={inputClass} inputMode="numeric" value={String(form.salaryMin ?? "")} onChange={(event) => set("salaryMin", event.target.value)} /></Field>
          <Field label="Annual maximum (USD)"><input className={inputClass} inputMode="numeric" value={String(form.salaryMax ?? "")} onChange={(event) => set("salaryMax", event.target.value)} /></Field>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(form.salaryVisible)} onChange={(event) => set("salaryVisible", event.target.checked)} />
          Show compensation on the public careers page
        </label>
        <Field label="Description">
          <textarea className={`${inputClass} min-h-48 py-3`} value={String(form.description ?? "")} onChange={(event) => set("description", event.target.value)} />
        </Field>
        <Field label="Skills"><input className={inputClass} value={String(form.skills ?? "")} onChange={(event) => set("skills", event.target.value)} /></Field>
        <Field label="Must-have skills for the CV screen">
          <input className={inputClass} value={String(form.screenRequired ?? "")} onChange={(event) => set("screenRequired", event.target.value)} placeholder="TypeScript, SQL, PostgreSQL" />
        </Field>
        <p className="text-sm text-muted">Comma-separated, up to 12. These words add points to the expertise rank. They do not by themselves send an assessment. Saving applies to the next screen. This is a word check, not a model score.</p>
        <Field label="Preferred skills (recorded only)">
          <input className={inputClass} value={String(form.screenPreferred ?? "")} onChange={(event) => set("screenPreferred", event.target.value)} placeholder="React" />
        </Field>
        <Field label="Scorecard attributes">
          <textarea className={`${inputClass} min-h-20 py-2`} value={String(form.scorecardAttributes ?? "")} onChange={(event) => set("scorecardAttributes", event.target.value)} placeholder="Evidence for the role, Collaboration, Communication" />
        </Field>
        <p className="text-sm text-muted">Skills and qualifications for interview scorecards. On each interview you choose which of these that session focuses on. Blank uses Evidence for the role, Collaboration, and Communication. These are not a prediction of who will do the job.</p>
        <Field label="Knockout: minimum years">
          <input className={inputClass} inputMode="numeric" value={String(form.knockoutYears ?? "")} onChange={(event) => set("knockoutYears", event.target.value)} placeholder="Blank means no years question" />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(form.requireAuthorization)} onChange={(event) => set("requireAuthorization", event.target.checked)} />
          Knockout: require work authorization. “No” stores the application and closes it.
        </label>
        <p className="text-sm text-muted">Knockout questions are asked on the application. They are not a reading of the CV. Publish the job before they appear on the public page. DOCX, PDF, and text are indexed. Legacy .doc is not extracted.</p>
        <Field label="Assessment to send when the CV matches">
          <select className={inputClass} value={String(form.screenAssessmentId ?? "")} onChange={(event) => set("screenAssessmentId", event.target.value)}>
            <option value="">Do not send one automatically</option>
            {(tests.data ?? []).filter((test: { published?: number; archived?: boolean }) => Number(test.published) > 0 && !test.archived).map((test: { id: string; name: string; duration_seconds?: number; proctored?: boolean; auto_send?: boolean }) => (
              <option key={test.id} value={test.id}>
                {test.name}
                {Number(test.duration_seconds) > 0 ? ` · ${Math.round(Number(test.duration_seconds) / 60)} min` : ""}
                {test.proctored ? " · proctored" : ""}
                {test.auto_send === false ? " · automatic send off" : ""}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-sm text-muted">The pipeline sends its own papers to the top half. This choice is not that send. You can still assign it by hand.</p>
        {error ? <Alert>{error}</Alert> : null}
        {saved ? <p className="text-sm text-ok">{saved}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save draft</Button>
          <Button type="button" variant="secondary" onClick={() => status("PUBLISHED")}>Publish</Button>
          {job.status === "PUBLISHED" ? <Button type="button" variant="secondary" onClick={() => status("PAUSED")}>Pause</Button> : null}
          {job.status === "PUBLISHED" || job.status === "PAUSED" ? <Button type="button" variant="danger" onClick={() => status("CLOSED")}>Close</Button> : null}
          {job.status === "CLOSED" ? <Button type="button" variant="secondary" onClick={() => status("ARCHIVED")}>Archive</Button> : null}
        </div>
      </form>
    </div>
  );
}

function ApplyPortal({
  companySlug,
  jobId,
  jobSlug,
  published,
}: {
  companySlug: string;
  jobId: string;
  jobSlug: string;
  published: boolean;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const src = origin && jobSlug ? `${origin}/embed/${companySlug}/${jobSlug}` : "";
  const snippet = src
    ? `<iframe src="${src}" title="Apply" width="100%" height="900" style="border:0;max-width:40rem;background:#ffffff"></iframe>`
    : "";

  async function download() {
    setError(null);
    try {
      const result = await applicationSheet({ data: { slug: companySlug, jobId } });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      setNote(`${result.rows} row${result.rows === 1 ? "" : "s"} downloaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download the sheet.");
    }
  }

  return (
    <section className="mb-6 space-y-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
      <h2 className="text-2xl">Website apply form</h2>
      <p className="text-sm text-muted">Paste this HTML into another site. The form is white unless this company changes the colors in Settings. It checks the CV and adds the other answers as one CSV row. The applicant sees a receipt on the form. It is not emailed.</p>
      {published ? null : <p className="text-sm">Publish the job before the frame will accept an application.</p>}
      <textarea className={`${inputClass} min-h-24 py-2 font-mono text-xs`} readOnly value={snippet} aria-label="Embed HTML" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => { void navigator.clipboard.writeText(snippet).then(() => setCopied(true)).catch(() => setError("Could not copy. Select the HTML and copy it.")); }}>Copy HTML</Button>
        {src ? <a className="inline-flex min-h-11 items-center text-sm text-link" href={src}>Open the form</a> : null}
        <Button type="button" variant="secondary" onClick={() => void download()}>Download application CSV</Button>
      </div>
      {copied ? <p className="text-sm text-ok">Copied.</p> : null}
      {note ? <p className="text-sm">{note}</p> : null}
      {error ? <Alert>{error}</Alert> : null}
    </section>
  );
}

function yearsValue(value: string | boolean | number | null | undefined): number | null {
  if (value === "" || value == null) return null;
  const years = Number(value);
  if (!Number.isInteger(years) || years < 0 || years > 40) return null;
  return years;
}

function knockoutYears(schema: unknown): string {
  if (!Array.isArray(schema)) return "";
  const field = schema.find((item) => item && typeof item === "object" && (item as { id?: string }).id === "years") as { knockout?: { min?: number } } | undefined;
  return field?.knockout?.min == null ? "" : String(field.knockout.min);
}

function knockoutAuth(schema: unknown): boolean {
  return Array.isArray(schema) && schema.some((item) => item && typeof item === "object" && (item as { id?: string }).id === "work_auth");
}
