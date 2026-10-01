import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listPublicJobs } from "@/server/talent.functions";
import { companyCssVars } from "@/domain/embed-theme";
import { Empty, AppLink, inputClass, Loading, MarketingHomeLink } from "@/components/talent/kit";

export const Route = createFileRoute("/careers/$companySlug/")({ component: Careers });

function Careers() {
  const { companySlug } = Route.useParams();
  const [q, setQ] = useState("");
  const [work, setWork] = useState("");
  const [data, setData] = useState<Awaited<ReturnType<typeof listPublicJobs>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listPublicJobs({ data: { companySlug, q, workArrangement: work } })
      .then((value) => {
        if (!live) return;
        setData(value);
        setError(null);
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "Could not load jobs.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [companySlug, q, work]);

  const theme = data?.company ? companyCssVars(data.company.theme) : undefined;
  return (
    <main className="min-h-screen bg-bg text-ink" style={theme}>
      <div className="mx-auto max-w-3xl px-4 py-8">
      <MarketingHomeLink />
      <h1 className="mt-3 text-4xl">{data?.company?.name ?? "Careers"}</h1>
      <p className="mt-2 text-sm text-muted">{data?.company?.headline || "Published jobs only. Drafts, paused roles, and closed roles are hidden."}</p>
      <p className="mt-2 text-sm"><Link to="/track" className="text-link">Already applied? Check your progress</Link></p>
      <form className="mt-6 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
        <input className={inputClass} value={q} onChange={(event) => setQ(event.target.value)} aria-label="Search jobs" placeholder="Search" />
        <select className={inputClass} value={work} aria-label="Work arrangement" onChange={(event) => setWork(event.target.value)}>
          <option value="">Any arrangement</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">Onsite</option>
        </select>
      </form>
      {loading ? <Loading /> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!loading && data && !data.company ? <Empty title="Unknown employer" body="Check the careers link and try again." /> : null}
      {!loading && (data?.jobs.length ?? 0) === 0 && data?.company ? <Empty title="No open roles" body="Check back when this employer publishes a job." /> : null}
      <ul className="mt-4 space-y-3">
        {(data?.jobs ?? []).map((job) => (
          <li key={job.id}>
            <AppLink className="block rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" href={`/careers/${companySlug}/${job.slug}`}>
              <span className="text-xl">{job.title}</span>
              <span className="mt-1 block text-sm text-muted">{job.department} · {job.locations || job.work_arrangement}</span>
              {job.closes_on ? <span className="mt-1 block text-sm text-muted"><span>Open until</span> {prettyDate(job.closes_on)}</span> : null}
            </AppLink>
          </li>
        ))}
      </ul>
      </div>
    </main>
  );
}

function prettyDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
