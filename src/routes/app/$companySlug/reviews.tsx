import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { gradingGuide, manualBasisPoints } from "@/domain/rules";
import { getReview, judgeCodeBoard, listCodeBoard, listReviews, submitReview } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/reviews")({ component: Reviews });

function Reviews() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listReviews({ data: { slug: companySlug } }), [companySlug]);
  const [open, setOpen] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  return (
    <div>
      <PageTitle title="Reviews" lede="Human-graded work stays pending until every required dimension is scored. Code answers are ranked separately: correct cases first, then a better estimated time class, then space, then measured time." />
      <CodeBoard slug={companySlug} />
      {(state.data ?? []).length === 0 ? <Empty title="No review tasks" body="Assign an assessment with a written section, or wait for a submission." /> : null}
      <ul className="space-y-3">
        {(state.data ?? []).map((task: any) => (
          <li key={String(task.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
            <button type="button" className="text-left" onClick={() => setOpen(String(task.id))}>
              <span className="text-xl">{String(task.candidate_name)}</span>
              <span className="mt-1 block text-sm text-muted">{String(task.assessment_name)} · {String(task.job_title)} · {String(task.status)}</span>
            </button>
            {open === String(task.id) ? <ReviewForm slug={companySlug} reviewId={String(task.id)} /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeBoard({ slug }: { slug: string }) {
  const state = useAuthed(() => listCodeBoard({ data: { slug } }), [slug]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const groups = state.data?.groups ?? [];
  return (
    <section className="mb-8 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
      <h2 className="text-2xl">Code ranking</h2>
      <p className="mt-1 text-sm text-muted">{state.data?.note}</p>
      {groups.length === 0 ? <div className="mt-3"><Empty title="No submitted code" body="Submitted code answers for this company show up here." /></div> : null}
      {groups.map((group) => (
        <div key={group.questionKey} className="mt-4">
          <h3 className="text-lg">{group.title}</h3>
          <ul className="mt-2 space-y-2">
            {group.rows.map((row) => (
              <li key={`${group.questionKey}:${row.candidateName}:${row.excerpt.slice(0, 24)}`} className="rounded-md border border-line p-3 text-sm">
                <p>
                  <span className="text-xl">{row.rank ?? "—"}</span>
                  <span className="ml-2">{row.candidateName}</span>
                  <span className="ml-2 text-muted">{row.timeClass} time · {row.spaceClass} space</span>
                </p>
                <p className="mt-1 text-muted">
                  {row.status === "ESTIMATE"
                    ? "Cases not judged yet."
                    : row.total
                      ? `${row.passed ?? 0} of ${row.total} cases passed.`
                      : "No cases for this question, so only the estimate is shown."}
                  {row.measuredMs != null ? ` Largest case ${row.measuredMs} ms.` : ""}
                  {row.basisPoints != null ? ` Judge score ${row.basisPoints} basis points (${(row.basisPoints / 100).toFixed(2)}%).` : " No judge score stored."}
                  {row.status === "TIMED_OUT" || row.status === "FAILED" || row.status === "REFUSED" ? ` ${row.status} is not a zero.` : ""}
                </p>
                {row.reasons.length > 0 ? <p className="mt-1 text-muted">{row.reasons.join(" ")}</p> : null}
                {row.excerpt ? <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{row.excerpt}</pre> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="mt-3">
        <Button type="button" disabled={busy} onClick={() => {
          setBusy(true);
          setError(null);
          judgeCodeBoard({ data: { slug } })
            .then(() => refreshPage())
            .catch((err: Error) => {
              setBusy(false);
              setError(err.message);
            });
        }}>Judge new answers</Button>
      </div>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </section>
  );
}

function ReviewForm({ slug, reviewId }: { slug: string; reviewId: string }) {
  const state = useAuthed(() => getReview({ data: { slug, reviewId } }), [slug, reviewId]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dimensions = state.data?.items[0]?.rubric.dimensions ?? [];
  useEffect(() => {
    if (dimensions.length === 0) return;
    setRatings((current) => {
      if (dimensions.every((dimension) => typeof current[dimension.id] === "number")) return current;
      return Object.fromEntries(dimensions.map((dimension) => [dimension.id, current[dimension.id] ?? 2]));
    });
  }, [dimensions]);
  if (state.loading) return <Loading />;
  if (state.error || !state.data) return <Alert>{state.error ?? "Not found"}</Alert>;
  const ids = dimensions.map((dimension) => dimension.id);
  const scored = manualBasisPoints(ratings, ids);
  return (
    <form className="mt-4 space-y-3" onSubmit={(event) => {
      event.preventDefault();
      if (!scored) {
        setError("Score every required dimension from 0 to 4.");
        return;
      }
      submitReview({ data: { slug, reviewId, ratings, notes } }).then(() => refreshPage()).catch((err) => setError(err.message));
    }}>
      {state.data.items.length === 0 ? <p className="text-sm text-muted">This attempt has no human-graded answers.</p> : null}
      {state.data.items.map((item) => {
        const guide = gradingGuide(item.type);
        return (
          <article key={item.id} className="rounded-md border border-line p-3 text-sm">
            <p className="text-xs uppercase text-muted">{item.type} · {item.points} pt · {guide.title}</p>
            <p className="mt-1 whitespace-pre-wrap">{item.prompt}</p>
            <p className="mt-2 whitespace-pre-wrap text-muted">{item.answer || "No answer saved."}</p>
            <p className="mt-2 text-muted">{guide.steps[0]}</p>
          </article>
        );
      })}
      {dimensions.map((dimension) => (
        <Field key={dimension.id} label={`${dimension.label} (0–4)`}>
          <input className={inputClass} type="number" min={0} max={4} value={ratings[dimension.id] ?? 0} onChange={(event) => setRatings((current) => ({ ...current, [dimension.id]: Number(event.target.value) }))} />
          <span className="text-xs text-muted">{dimension.anchors.join(" · ")}</span>
        </Field>
      ))}
      <p className="text-sm">
        {scored
          ? `${scored.earned} of ${scored.possible} rubric points → ${scored.basisPoints} basis points (${(scored.basisPoints / 100).toFixed(2)}%).`
          : "The score stays pending until every dimension is an integer from 0 to 4."}
      </p>
      <Field label="Notes"><textarea className={`${inputClass} min-h-20 py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={state.data.items.length === 0}>Submit review</Button>
    </form>
  );
}
