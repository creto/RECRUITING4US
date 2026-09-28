import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getReports } from "@/server/talent.functions";
import { Alert, Loading, PageTitle, useAuthed } from "@/components/talent/kit";

const Bars = lazy(() => import("@/components/talent/bars").then((mod) => ({ default: mod.Bars })));

export const Route = createFileRoute("/app/$companySlug/reports")({ component: Reports });

function Reports() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => getReports({ data: { slug: companySlug } }), [companySlug]);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const data = state.data;
  if (!data) return null;
  return (
    <div>
      <PageTitle title="Reports" lede={data.definition} />
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<div className="h-48 rounded-md border border-line bg-surface" />}>
          <Bars title="Active pipeline" rows={data.pipeline.map((row) => ({ name: row.category, n: Number(row.n) }))} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-md border border-line bg-surface" />}>
          <Bars title="Applications by source" rows={data.volume.map((row) => ({ name: row.source, n: Number(row.n) }))} />
        </Suspense>
      </div>
      <section className="mt-6 overflow-x-auto">
        <h2 className="text-2xl">Cohort stage reach</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead><tr className="border-b border-line"><th className="py-2">Stage category</th><th>Distinct applications</th></tr></thead>
          <tbody>
            {data.funnel.map((row) => (
              <tr key={row.category} className="border-b border-line"><td className="py-2">{row.category}</td><td className="tabular-nums">{row.n}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">{data.finalizedScores} finalized automatic scores. Pending or failed grading is excluded.</p>
      </section>
    </div>
  );
}
