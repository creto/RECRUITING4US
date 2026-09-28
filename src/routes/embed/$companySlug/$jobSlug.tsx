import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ApplyForm } from "@/components/talent/apply-form";
import { embedCssVars, embedTheme } from "@/domain/embed-theme";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPublicJob } from "@/server/talent.functions";
import { Empty, Loading } from "@/components/talent/kit";

export const Route = createFileRoute("/embed/$companySlug/$jobSlug")({
  head: () => ({
    styles: [{ children: "html,body{background:#ffffff;color:#14221b}" }],
  }),
  component: EmbedApply,
});

function EmbedApply() {
  const { companySlug, jobSlug } = Route.useParams();
  const { user } = useCurrentUserState();
  const [job, setJob] = useState<Awaited<ReturnType<typeof getPublicJob>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = embedTheme(job ? {
    background: job.embed_background,
    ink: job.embed_ink,
    accent: job.embed_accent,
    accentInk: job.embed_accent_ink,
  } : null);

  useEffect(() => {
    const nodes = [document.documentElement, document.body];
    for (const node of nodes) {
      node.style.background = theme.background;
      node.style.color = theme.ink;
    }
  }, [theme.background, theme.ink]);

  useEffect(() => {
    let live = true;
    getPublicJob({ data: { companySlug, jobSlug } })
      .then((value) => { if (live) setJob(value); })
      .catch((err: unknown) => { if (live) setError(err instanceof Error ? err.message : "Could not load this job."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [companySlug, jobSlug]);

  const fields = (job?.form_schema ?? []) as { id: string; label: string; type: string; required?: boolean; help?: string; options?: string[] }[];
  return (
    <main className="min-h-screen px-4 py-6" style={embedCssVars(theme)}>
      <div className="mx-auto max-w-xl">
        {loading ? <Loading /> : null}
        {!loading && error ? <p className="text-sm">{error}</p> : null}
        {!loading && !error && !job ? <Empty title="This job is not open" body="The form is only available for a published job." /> : null}
        {job ? (
          <>
            <p className="text-sm text-muted">{job.company_name}</p>
            <h1 className="mt-1 text-3xl">{job.title}</h1>
            <p className="mt-2 text-sm text-muted">{job.department} · {job.locations} · {job.work_arrangement}</p>
            <div className="mt-4">
              <ApplyForm companySlug={companySlug} jobSlug={jobSlug} fields={fields} user={user} source="EMBED" />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
