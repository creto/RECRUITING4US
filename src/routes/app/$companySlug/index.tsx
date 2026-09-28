import { createFileRoute } from "@tanstack/react-router";
import { Alert, Loading, PageTitle, useCompanyWorkspace, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/")({ component: Dashboard });

function Dashboard() {
  const state = useCompanyWorkspace();
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const data = state.data;
  if (!data) return null;
  const cards = [
    ["Published jobs", data.counts?.jobs ?? 0],
    ["Active applications", data.counts?.applications ?? 0],
    ["Open reviews", data.counts?.reviews ?? 0],
    ["Upcoming interviews", data.counts?.interviews ?? 0],
  ];
  return (
    <div>
      <PageTitle title={data.company.name} lede={`Timezone ${data.company.timezone}. Counts come from records in this company only.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-md border border-line bg-surface p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="font-brand mt-2 text-4xl tabular-nums">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-2xl">Recent activity</h2>
          {data.activity.length === 0 ? <p className="mt-2 text-sm text-muted">No activity yet.</p> : null}
          <ul className="mt-3 space-y-2">
            {data.activity.map((item) => (
              <li key={item.id} className="rounded-md border border-line bg-surface px-3 py-2 text-sm">
                <span>{item.summary}</span>
                <span className="mt-1 block text-muted">{when(item.at, data.company.timezone)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl">Needs attention</h2>
          {data.overdue.length === 0 ? <p className="mt-2 text-sm text-muted">No overdue attempts. Deadlines are enforced even if a worker is down.</p> : null}
          <ul className="mt-3 space-y-2">
            {data.overdue.map((item) => (
              <li key={item.id} className="rounded-md border border-line bg-surface px-3 py-2 text-sm">
                {item.title} · deadline {when(item.deadline, "UTC")}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
