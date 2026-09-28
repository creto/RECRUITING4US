import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { bulkMove, listPipeline, moveApplication } from "@/server/talent.functions";
import { Alert, AppLink, Button, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/jobs/$jobId/pipeline")({ component: Pipeline });

function Pipeline() {
  const { companySlug, jobId } = Route.useParams();
  const state = useAuthed(() => listPipeline({ data: { slug: companySlug, jobId } }), [companySlug, jobId]);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const data = state.data;
  if (!data) return null;
  const activeStages = data.stages.filter((stage) => !stage.archived);

  async function move(applicationId: string, toStageId: string, version: number) {
    setError(null);
    try {
      await moveApplication({ data: { slug: companySlug, applicationId, toStageId, expectedVersion: version } });
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move.");
    }
  }

  async function bulk(toStageId: string) {
    const result = await bulkMove({ data: { slug: companySlug, applicationIds: picked, toStageId, reason: "Bulk move" } });
    setMessage(`${result.succeeded} moved, ${result.failed} failed.`);
    refreshPage();
  }

  return (
    <div>
      <PageTitle title="Pipeline" lede="Move people with the menu. History keeps the old stage name even if you rename it later." />
      {error ? <Alert>{error}</Alert> : null}
      {message ? <p className="mb-3 text-sm">{message}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {activeStages.map((stage) => {
          const cards = data.cards.filter((card) => card.stage_id === stage.id && card.lifecycle === "ACTIVE");
          return (
            <section key={stage.id} className="w-64 shrink-0 rounded-md border border-line bg-bg p-3">
              <h2 className="text-lg">{stage.name}</h2>
              <p className="text-xs text-muted">{cards.length} active</p>
              <ul className="mt-3 space-y-2">
                {cards.map((card) => (
                  <li key={card.id} className="rounded-md border border-line bg-surface p-3 text-sm">
                    <label className="flex items-start gap-2">
                      <input type="checkbox" checked={picked.includes(card.id)} onChange={(event) => setPicked((current) => event.target.checked ? [...current, card.id] : current.filter((id) => id !== card.id))} />
                      <span>
                        <AppLink className="font-medium" href={`/app/${companySlug}/applications/${card.id}`}>{card.name}</AppLink>
                        <span className="block text-muted">{card.source}</span>
                      </span>
                    </label>
                    <label className="mt-2 block text-xs text-muted">
                      Move to
                      <select className="mt-1 min-h-11 w-full rounded-md border border-line bg-surface px-2" defaultValue="" onChange={(event) => { if (event.target.value) void move(card.id, event.target.value, card.version); }}>
                        <option value="">Choose a stage</option>
                        {activeStages.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {picked.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">{picked.length} selected</span>
          {activeStages.map((stage) => (
            <Button key={stage.id} type="button" variant="secondary" onClick={() => bulk(stage.id)}>Move to {stage.name}</Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
