import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createJob, listJobs } from "@/server/talent.functions";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/jobs/")({ component: Jobs });

function Jobs() {
  const { companySlug } = Route.useParams();
  const navigate = useNavigate();
  const state = useAuthed(() => listJobs({ data: { slug: companySlug } }), [companySlug]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await createJob({
        data: {
          slug: companySlug,
          title,
          department: "General",
          locations: "",
          workArrangement: "HYBRID",
          employmentType: "FULL_TIME",
          description: "",
          skills: "",
        },
      });
      void navigate({ href: `/app/${companySlug}/jobs/${created.jobId}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the job.");
    }
  }

  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const jobs = state.data ?? [];
  return (
    <div>
      <PageTitle title="Jobs" lede="Drafts stay private. Public applications open only after you publish." />
      <p className="mb-1 text-sm">
        <AppLink className="text-link" href="/portal">Applicant portal</AppLink>
      </p>
      <p className="mb-4 text-sm text-muted">A person opens this after they apply. It is not part of this workspace.</p>
      <form className="mb-8 flex flex-col gap-3 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)] sm:flex-row sm:items-end" onSubmit={onCreate}>
        <div className="flex-1">
          <Field label="New job title">
            <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} required />
          </Field>
        </div>
        <Button type="submit">Create draft</Button>
      </form>
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      <h2 className="mb-3 text-xl">Roles</h2>
      {jobs.length === 0 ? <Empty title="No jobs yet" body="Create a draft, then publish it when the description is ready." /> : null}
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <AppLink className="block rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" href={`/app/${companySlug}/jobs/${job.id}`}>
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-xl">{job.title}</span>
                <span className="text-xs uppercase text-muted">{job.status}</span>
              </span>
              <span className="mt-1 block text-sm text-muted">
                {job.department || "No department"} · {job.work_arrangement} · {job.active} active
              </span>
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
