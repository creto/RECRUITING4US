import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { cancelInterview, createSlot, feedbackFor, interviewIcs, listInterviews, listSlots, submitFeedback } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/interviews")({ component: Interviews });

function Interviews() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listInterviews({ data: { slug: companySlug } }), [companySlug]);
  const slots = useAuthed(() => listSlots({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  return (
    <div>
      <PageTitle title="Interviews" lede="Times are stored in UTC and shown in the interview timezone. External calendar availability is unknown." />
      {(state.data ?? []).length === 0 ? <Empty title="No interviews" body="Schedule one from an application." /> : null}
      <ul className="space-y-3">
        {(state.data ?? []).map((item: any) => (
          <li key={String(item.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
            <h2 className="text-xl">{String(item.title)}</h2>
            <p>{String(item.candidate_name)} · {String(item.job_title)}</p>
            <p>{when(String(item.starts_at), String(item.timezone))} · {String(item.status)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => interviewIcs({ data: { slug: companySlug, interviewId: String(item.id) } }).then((file) => download(file.ics, file.filename))}>Calendar file</Button>
              {String(item.status) === "SCHEDULED" ? <Button type="button" variant="danger" onClick={() => cancelInterview({ data: { slug: companySlug, interviewId: String(item.id) } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Cancel</Button> : null}
            </div>
            <Feedback slug={companySlug} interviewId={String(item.id)} />
          </li>
        ))}
      </ul>
      <form className="mt-8 grid gap-2 rounded-md border border-line bg-surface p-4 md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        createSlot({ data: { slug: companySlug, localStart: String(data.get("start")), localEnd: String(data.get("end")), timezone: String(data.get("timezone")) } })
          .then(() => refreshPage()).catch((err) => setError(err.message));
      }}>
        <h2 className="text-2xl md:col-span-2">Exclusive slots</h2>
        <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue="America/New_York" /></Field>
        <Field label="Local start"><input name="start" className={inputClass} placeholder="2026-10-08T15:00" required /></Field>
        <Field label="Local end"><input name="end" className={inputClass} placeholder="2026-10-08T15:45" required /></Field>
        <Button type="submit">Add slot</Button>
        <ul className="md:col-span-2 text-sm text-muted">
          {(slots.data ?? []).map((slot: any) => (
            <li key={String(slot.id)}>{when(String(slot.starts_at), String(slot.timezone))} · {slot.claimed_application_id ? "Claimed" : "Open"}</li>
          ))}
        </ul>
      </form>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </div>
  );
}

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Feedback({ slug, interviewId }: { slug: string; interviewId: string }) {
  const state = useAuthed(() => feedbackFor({ data: { slug, interviewId } }), [slug, interviewId]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!state.data) return null;
  return (
    <form className="mt-3 space-y-2" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const ratings = {
        evidence: Number(data.get("evidence")),
        collaboration: Number(data.get("collaboration")),
        communication: Number(data.get("communication")),
      };
      submitFeedback({
        data: { slug, interviewId, ratings, recommendation: String(data.get("recommendation")), notes, submit: true },
      }).then(() => refreshPage()).catch((err) => setError(err.message));
    }}>
      <p className="text-xs text-muted">{state.data.released ? "Peer feedback is visible." : "Other interviewers’ feedback stays hidden until you submit."}</p>
      {state.data.scorecard.map((item: any) => (
        <Field key={item.id} label={item.label}>
          <input name={item.id} className={inputClass} type="number" min={0} max={4} required defaultValue={state.data?.mine?.ratings?.[item.id] ?? 3} />
        </Field>
      ))}
      <Field label="Recommendation">
        <select name="recommendation" className={inputClass} defaultValue="yes">
          <option value="yes">Yes</option>
          <option value="mixed">Mixed</option>
          <option value="no">No</option>
        </select>
      </Field>
      <Field label="Notes"><textarea className={`${inputClass} min-h-16 py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" variant="secondary">Submit feedback</Button>
    </form>
  );
}
