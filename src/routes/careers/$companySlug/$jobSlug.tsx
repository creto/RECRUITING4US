import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ApplyForm } from "@/components/talent/apply-form";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPublicJob } from "@/server/talent.functions";
import { companyCssVars } from "@/domain/embed-theme";
import { Empty, Loading, Wordmark } from "@/components/talent/kit";

export const Route = createFileRoute("/careers/$companySlug/$jobSlug")({ component: JobPage });

function JobPage() {
  const { companySlug, jobSlug } = Route.useParams();
  const { user } = useCurrentUserState();
  const [job, setJob] = useState<Awaited<ReturnType<typeof getPublicJob>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getPublicJob({ data: { companySlug, jobSlug } })
      .then((value) => { if (live) setJob(value); })
      .catch((err: unknown) => { if (live) setError(err instanceof Error ? err.message : "Could not load this job."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [companySlug, jobSlug]);

  if (loading) return <Loading />;
  if (error) return <main className="p-6 text-sm">{error}</main>;
  if (!job) return <main className="p-6"><Empty title="This job is not open" body="It may be a draft, paused, or closed." /></main>;
  const fields = (job.form_schema ?? []) as { id: string; label: string; type: string; required?: boolean; help?: string; options?: string[] }[];
  const theme = companyCssVars({
    background: job.embed_background,
    ink: job.embed_ink,
    accent: job.embed_accent,
    accentInk: job.embed_accent_ink,
  });
  return (
    <main className="min-h-screen bg-bg text-ink" style={theme}>
      <div className="mx-auto max-w-3xl px-4 py-8">
      <a href={`/careers/${companySlug}`} className="inline-block text-ink">
        <Wordmark logoUrl={job.logoUrl} companyName={job.company_name} />
      </a>
      <a href={`/careers/${companySlug}`} className="mt-2 block text-sm text-muted">{job.company_name}</a>
      {job.careers_headline ? <p className="mt-2 text-sm text-muted">{job.careers_headline}</p> : null}
      <h1 className="mt-3 text-4xl">{job.title}</h1>
      <p className="mt-2 text-sm text-muted">{job.department} · {job.locations} · {job.work_arrangement}</p>
      {job.salary_visible && job.salary_min ? (
        <p className="mt-2 text-sm">Compensation shown: {job.salary_min.toLocaleString()}–{job.salary_max?.toLocaleString()} {job.salary_currency} per year</p>
      ) : null}
      <article className="mt-6 whitespace-pre-wrap text-sm leading-6">{job.description}</article>
      <div className="mt-8">
        <ApplyForm companySlug={companySlug} jobSlug={jobSlug} fields={fields} user={user} source="CAREERS" />
      </div>
      </div>
    </main>
  );
}
