import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getReview, listReviews, submitReview } from "@/server/talent.functions";
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
      <PageTitle title="Reviews" lede="Human-graded work stays pending until every required dimension is scored. Pending is not zero." />
      {(state.data ?? []).length === 0 ? <Empty title="No review tasks" body="Assign an assessment with a written section, or wait for a submission." /> : null}
      <ul className="space-y-3">
        {(state.data ?? []).map((task: any) => (
          <li key={String(task.id)} className="rounded-md border border-line bg-surface p-4">
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

function ReviewForm({ slug, reviewId }: { slug: string; reviewId: string }) {
  const state = useAuthed(() => getReview({ data: { slug, reviewId } }), [slug, reviewId]);
  const [ratings, setRatings] = useState<Record<string, number>>({ substance: 2, clarity: 2 });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (state.loading) return <Loading />;
  if (state.error || !state.data) return <Alert>{state.error ?? "Not found"}</Alert>;
  return (
    <form className="mt-4 space-y-3" onSubmit={(event) => {
      event.preventDefault();
      submitReview({ data: { slug, reviewId, ratings, notes } }).then(() => refreshPage()).catch((err) => setError(err.message));
    }}>
      {state.data.items.map((item) => (
        <article key={item.id} className="rounded-md border border-line p-3 text-sm">
          <p className="whitespace-pre-wrap">{item.prompt}</p>
          <p className="mt-2 whitespace-pre-wrap text-muted">{item.answer || "No answer saved."}</p>
        </article>
      ))}
      {state.data.items[0]?.rubric.dimensions.map((dimension) => (
        <Field key={dimension.id} label={`${dimension.label} (0–4)`}>
          <input className={inputClass} type="number" min={0} max={4} value={ratings[dimension.id] ?? 0} onChange={(event) => setRatings((current) => ({ ...current, [dimension.id]: Number(event.target.value) }))} />
          <span className="text-xs text-muted">{dimension.anchors.join(" · ")}</span>
        </Field>
      ))}
      <Field label="Notes"><textarea className={`${inputClass} min-h-20 py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit">Submit review</Button>
    </form>
  );
}
