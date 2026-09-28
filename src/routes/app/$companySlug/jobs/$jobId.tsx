import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getJob, setJobStatus, updateJob } from "@/server/talent.functions";
import { Alert, AppLink, Button, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/jobs/$jobId")({ component: JobEditor });

function JobEditor() {
  const { companySlug, jobId } = Route.useParams();
  const state = useAuthed(() => getJob({ data: { slug: companySlug, jobId } }), [companySlug, jobId]);
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

  function set(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
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
          formSchema: [
            { id: "why", type: "long_text", label: "Why this role?", required: false, help: "" },
            { id: "website", type: "url", label: "Portfolio or website", required: false, help: "" },
          ],
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
        <AppLink className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 text-sm" href={`/app/${companySlug}/jobs/${jobId}/pipeline`}>Pipeline</AppLink>
        {job.status === "PUBLISHED" ? (
          <AppLink className="inline-flex min-h-11 items-center text-sm text-accent" href={`/careers/${companySlug}/${job.job_slug}`}>View public page</AppLink>
        ) : null}
      </div>
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
