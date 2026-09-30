import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { bulkMove, listPipeline, moveApplication, passApplicant, setLifecycle } from "@/server/talent.functions";
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

  async function pass(applicationId: string) {
    setError(null);
    try {
      await passApplicant({ data: { slug: companySlug, applicationId } });
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pass.");
    }
  }

  async function reject(applicationId: string, version: number) {
    setError(null);
    try {
      await setLifecycle({ data: { slug: companySlug, applicationId, lifecycle: "REJECTED", expectedVersion: version, reason: "Rejected by a recruiter at this stage." } });
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject.");
    }
  }

  async function bulk(toStageId: string) {
    const result = await bulkMove({ data: { slug: companySlug, applicationIds: picked, toStageId, reason: "Bulk move" } });
    setMessage(`${result.succeeded} moved, ${result.failed} failed.`);
    refreshPage();
  }

  return (
    <div>
      <PageTitle title="Pipeline" lede="A new application is ranked on the CV before any test. The top half, including everyone tied at the cutoff, is sent the next assessment. Coding is 3 medium and 2 hard. The top half of those scores get math and the personality questionnaire. The top half of the math scores get 3 hard problems. Messages are stored here. They are not sent through an outside mail server. Pass or reject still works at every stage." />
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
                  <li key={card.id} className="relative rounded-[24px] border border-line bg-white p-3 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)] hover:border-[#14221b]">
                    <AppLink className="absolute inset-0 z-0 rounded-[24px]" href={`/app/${companySlug}/applications/${card.id}`} aria-label={`Open ${card.name}`} />
                    <div className="pointer-events-none relative z-10">
                      <div className="flex items-start gap-2">
                        <label className="pointer-events-auto">
                          <input type="checkbox" checked={picked.includes(card.id)} aria-label={`Select ${card.name}`} onChange={(event) => setPicked((current) => event.target.checked ? [...current, card.id] : current.filter((id) => id !== card.id))} />
                        </label>
                        <span>
                          <span className="font-medium">{card.name}</span>
                          <span className="block text-muted">{card.source}</span>
                          {card.fit === "GOOD" ? <span className="block text-muted">Keywords found. Ranking decides.</span> : null}
                          {card.fit === "NOT_A_FIT" ? <span className="block text-muted">Keywords: missing a must-have</span> : null}
                          {card.fit === "NEEDS_A_PERSON" ? <span className="block text-muted">CV: needs a person</span> : null}
                          <RankLine label="Expertise" rank={card.expertise_rank} pool={card.expertise_pool} score={card.expertise_score} advanced={card.expertise_advanced} unit="pts" />
                          <RankLine label="Coding" rank={card.coding_rank} pool={card.coding_pool} score={card.coding_score} advanced={card.coding_advanced} unit="bp" />
                          <RankLine label="Math" rank={card.math_rank} pool={card.math_pool} score={card.math_score} advanced={card.math_advanced} unit="bp" />
                        </span>
                      </div>
                      {data.canMove && card.lifecycle === "ACTIVE" ? (
                        <div className="pointer-events-auto mt-2 flex gap-2">
                          <Button type="button" onClick={() => void pass(card.id)}>Pass</Button>
                          <Button type="button" variant="secondary" onClick={() => void reject(card.id, card.version)}>Reject</Button>
                        </div>
                      ) : null}
                      <label className="pointer-events-auto mt-2 block text-xs text-muted">
                        Move to
                        <select className="mt-1 min-h-11 w-full rounded-[24px] border border-line bg-white px-2 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" defaultValue="" onChange={(event) => { if (event.target.value) void move(card.id, event.target.value, card.version); }}>
                          <option value="">Choose a stage</option>
                          {activeStages.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </label>
                    </div>
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

function kept(value: unknown) {
  return value === true || value === "t" || value === "true";
}

function RankLine({ label, rank, pool, score, advanced, unit }: {
  label: string;
  rank: number | null;
  pool: number | null;
  score: number | null;
  advanced: unknown;
  unit: string;
}) {
  if (pool == null && score == null) return null;
  const text = score == null
    ? `${label}: no automatic score`
    : `${label}: ${rank} of ${pool} · ${score} ${unit} · ${kept(advanced) ? "top half" : "below cutoff"}`;
  return <span className="block">{text}</span>;
}
