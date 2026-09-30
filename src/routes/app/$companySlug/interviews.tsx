import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { cancelInterview, createSlot, feedbackFor, interviewIcs, listInterviews, listScoreboard, listSlots, refreshCalendar, scheduleInterview, submitFeedback } from "@/server/talent.functions";
import { RATINGS } from "@/domain/scorecard";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";
import { DateTimeLocalField } from "@/components/talent/datetime-local";
import { SchedulingDesk } from "./calendar";

export const Route = createFileRoute("/app/$companySlug/interviews")({ component: Interviews });

function Interviews() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listInterviews({ data: { slug: companySlug } }), [companySlug]);
  const slots = useAuthed(() => listSlots({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<{ status: string; error: string } | null>(null);
  useEffect(() => {
    let stopped = false;
    const pull = () => {
      refreshCalendar({ data: { slug: companySlug } })
        .then((result) => {
          if (!stopped) setCalendar({ status: result.status, error: result.error });
        })
        .catch(() => {
          if (!stopped) setCalendar({ status: "RECONNECT", error: "Calendar refresh did not complete." });
        });
    };
    pull();
    const timer = window.setInterval(pull, 20000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [companySlug]);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const groups = splitInterviews(state.data ?? []);
  return (
    <div>
      <PageTitle title="Scheduling" lede="Scheduled conversations, scorecards, and the calendar connection. Self-schedule links and sync retries stay on this page." />
      <p className="mb-4 text-sm text-muted">
        {calendar
          ? `External calendar: ${calendar.status}.${calendar.error ? ` ${calendar.error}` : ""}`
          : "Checking the calendar connection."}
      </p>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 className="text-xl">Next 4 days</h2>
          <p className="mt-1 text-sm text-muted">Only interviews that start within four days. Later ones stay under Later. Once the end time has passed, the interview is marked complete and moves to Completed.</p>
          <div className="mt-3">
      {groups.upcoming.length === 0 ? <Empty title="Nothing in the next 4 days" body="A later interview is under Later. Schedule one below if this window should have one." /> : null}
      <InterviewList slug={companySlug} rows={groups.upcoming} onError={setError} />
      {groups.later.length > 0 ? (
        <details className="mt-6 rounded-[24px] border border-line bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium"><span>Later</span> · {groups.later.length}</summary>
          <div className="mt-3">
            <InterviewList slug={companySlug} rows={groups.later} onError={setError} />
          </div>
        </details>
      ) : null}
      <details className="mt-3 rounded-[24px] border border-line bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium"><span>Completed</span> · {groups.done.length}</summary>
        <p className="mt-2 text-sm text-muted">Past interviews stay here. A cancelled one stays cancelled.</p>
        {groups.done.length === 0 ? <p className="mt-3 text-sm text-muted">None yet.</p> : <div className="mt-3"><InterviewList slug={companySlug} rows={groups.done} onError={setError} /></div>}
      </details>
      <form className="mt-8 grid gap-2 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        createSlot({ data: { slug: companySlug, localStart: String(data.get("start")), localEnd: String(data.get("end")), timezone: String(data.get("timezone")) } })
          .then(() => refreshPage()).catch((err) => setError(err.message));
      }}>
        <h2 className="text-2xl md:col-span-2">Exclusive slots</h2>
        <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue="America/New_York" /></Field>
        <DateTimeLocalField label="Local start" name="start" required />
        <DateTimeLocalField label="Local end" name="end" required />
        <Button type="submit">Add slot</Button>
        <ul className="md:col-span-2 text-sm text-muted">
          {(slots.data ?? []).map((slot: any) => (
            <li key={String(slot.id)}>{when(String(slot.starts_at), String(slot.timezone))} · {slot.claimed_application_id ? "Claimed" : "Open"}</li>
          ))}
        </ul>
      </form>
      <form className="mt-8 grid gap-2 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)] md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const applicationId = String(data.get("applicationId") ?? "").trim();
        const candidateName = String(data.get("candidateName") ?? "").trim();
        if (candidateName.length < 2 && applicationId.length < 8) {
          setError("Give a candidate name or an application id.");
          return;
        }
        scheduleInterview({
          data: {
            slug: companySlug,
            applicationId,
            candidateName,
            title: String(data.get("title") ?? "Interview"),
            localStart: String(data.get("start")),
            localEnd: String(data.get("end")),
            timezone: String(data.get("timezone")),
            location: String(data.get("location") ?? ""),
            meetingUrl: String(data.get("url") ?? ""),
          },
        }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <h2 className="text-2xl md:col-span-2">Schedule one</h2>
        <p className="text-sm text-muted md:col-span-2">A name is used only when one active application matches. An application id is used as written.</p>
        <Field label="Candidate name"><input name="candidateName" className={inputClass} placeholder="Exact name" /></Field>
        <Field label="Application id"><input name="applicationId" className={inputClass} placeholder="Or paste an application id" /></Field>
        <Field label="Title"><input name="title" className={inputClass} defaultValue="Interview" required /></Field>
        <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue="America/New_York" required /></Field>
        <DateTimeLocalField label="Local start" name="start" required />
        <DateTimeLocalField label="Local end" name="end" required />
        <Field label="Location"><input name="location" className={inputClass} /></Field>
        <Field label="Meeting URL"><input name="url" className={inputClass} /></Field>
        <Button type="submit">Schedule</Button>
      </form>
          </div>
        </div>
        <Scoreboard slug={companySlug} />
      </div>
      <SchedulingDesk companySlug={companySlug} />
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </div>
  );
}

type InterviewRow = {
  id: string;
  title: string;
  status: string;
  timezone: string;
  candidate_name: string;
  job_title: string;
  starts_at: string;
  ends_at: string;
};

function splitInterviews(rows: InterviewRow[], now = Date.now()) {
  const horizon = now + 4 * 24 * 60 * 60 * 1000;
  const upcoming: InterviewRow[] = [];
  const later: InterviewRow[] = [];
  const done: InterviewRow[] = [];
  for (const row of rows) {
    const start = new Date(row.starts_at).getTime();
    const end = new Date(row.ends_at || row.starts_at).getTime();
    if (row.status === "CANCELLED" || end < now) done.push(row);
    else if (start > horizon) later.push(row);
    else upcoming.push(row);
  }
  const byStart = (a: InterviewRow, b: InterviewRow) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  upcoming.sort(byStart);
  later.sort(byStart);
  done.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  return { upcoming, later, done };
}

function shownStatus(row: InterviewRow, now = Date.now()) {
  if (row.status === "CANCELLED") return "Cancelled";
  const end = new Date(row.ends_at || row.starts_at).getTime();
  if (end < now) return "Complete";
  return row.status;
}

function InterviewList({ slug, rows, onError }: { slug: string; rows: InterviewRow[]; onError: (message: string) => void }) {
  return (
    <ul className="space-y-3">
      {rows.map((item) => {
        const status = shownStatus(item);
        return (
          <li key={item.id} className="rounded-[24px] border border-line bg-white p-4 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
            <h3 className="text-xl">{item.title}</h3>
            <p>{item.candidate_name} · {item.job_title}</p>
            <p>{when(item.starts_at, item.timezone)} · {status}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => interviewIcs({ data: { slug, interviewId: item.id } }).then((file) => download(file.ics, file.filename))}>Calendar file</Button>
              {item.status === "SCHEDULED" && status !== "Complete" ? <Button type="button" variant="danger" onClick={() => cancelInterview({ data: { slug, interviewId: item.id } }).then(() => refreshPage()).catch((err) => onError(err.message))}>Cancel</Button> : null}
            </div>
            <Feedback slug={slug} interviewId={item.id} />
          </li>
        );
      })}
    </ul>
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

function Scoreboard({ slug }: { slug: string }) {
  const state = useAuthed(() => listScoreboard({ data: { slug } }), [slug]);
  if (state.loading || state.isPending) return null;
  if (state.error) return <div className="mb-6"><Alert>{state.error}</Alert></div>;
  const rows = state.data?.rows ?? [];
  return (
    <section className="mb-8">
      <h2 className="text-2xl">Scoreboard</h2>
      <p className="mt-2 text-sm text-muted">{state.data?.note}</p>
      {rows.length === 0 ? <p className="mt-3 text-sm">No interviews yet.</p> : null}
      <ol className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.applicationId} className="relative rounded-[24px] border border-line bg-white p-4 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)] hover:border-[#14221b]">
            <AppLink href={`/app/${slug}/applications/${row.applicationId}`} className="absolute inset-0 z-0 rounded-[24px]" aria-label={`Open ${row.name}`} />
            <div className="pointer-events-none relative z-10">
            <p className="font-medium">
              {row.rank == null ? "Unranked" : `Rank ${row.rank}`}
              {row.tied ? " · tied" : ""}
              {" · "}
              {row.name}
            </p>
            <p className="text-muted">
              {row.jobTitle}
              {row.average == null ? " · no submitted recommendation yet" : ` · average ${row.average} from ${row.submitted} submitted`}
            </p>
            {row.waiting ? <p className="text-muted">Some scorecards stay hidden until you submit yours for that interview. The rank waits until then.</p> : null}
            {row.cards.map((card) => (
              <div key={`${card.interviewId}-${card.reviewerId}`} className="mt-2">
                <p>{card.reviewerName} · {card.interviewTitle} <RatingChip id={card.recommendation} label={card.recommendationLabel} /></p>
                <p>{card.attributes.map((attribute) => `${attribute.label}: ${attribute.ratingLabel}`).join(" · ")}</p>
                {card.notes ? <p className="text-muted">{card.notes}</p> : null}
              </div>
            ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RatingChip({ id, label }: { id: string; label: string }) {
  const rating = RATINGS.find((item) => item.id === id);
  return (
    <span className="ml-1 inline-flex min-h-8 items-center rounded-md px-2 text-xs" style={rating ? { background: rating.background, color: rating.color } : undefined}>
      {label}
    </span>
  );
}

function RatingScale({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {RATINGS.map((rating) => {
          const selected = value === rating.id;
          return (
            <button
              key={rating.id}
              type="button"
              aria-pressed={selected}
              className="min-h-11 rounded-md border px-3 text-sm"
              style={selected
                ? { background: rating.background, color: rating.color, borderColor: "transparent" }
                : { background: "var(--color-surface)", color: "var(--color-ink)", borderColor: "var(--color-line)" }}
              onClick={() => onChange(rating.id)}
            >
              {rating.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Feedback({ slug, interviewId }: { slug: string; interviewId: string }) {
  const state = useAuthed(() => feedbackFor({ data: { slug, interviewId } }), [slug, interviewId]);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!state.data || ready) return;
    const mine = state.data.mine;
    const stored = mine?.ratings && typeof mine.ratings === "object" ? mine.ratings as Record<string, string> : {};
    setRatings(stored);
    setRecommendation(typeof mine?.recommendation === "string" ? mine.recommendation : "");
    setNotes(mine?.notes ?? "");
    setReady(true);
  }, [state.data, ready]);
  if (!state.data) return null;
  const submitted = state.data.mine?.status === "SUBMITTED";
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted">
        {state.data.released
          ? "Submitted scorecards from this interview are visible."
          : "Other interviewers’ scorecards stay hidden until you submit yours."}
      </p>
      {submitted ? (
        <div className="space-y-2">
          <p>Submitted. This scorecard cannot be edited.</p>
          {state.data.attributes.map((attribute: { id: string; label: string }) => (
            <p key={attribute.id}>{attribute.label}: <RatingChip id={ratings[attribute.id] ?? ""} label={RATINGS.find((item) => item.id === ratings[attribute.id])?.label ?? "Not rated"} /></p>
          ))}
          <p>Overall: <RatingChip id={recommendation} label={RATINGS.find((item) => item.id === recommendation)?.label ?? "Not rated"} /></p>
          <p className="text-muted">{notes}</p>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          submitFeedback({
            data: { slug, interviewId, ratings, recommendation, notes, submit: true },
          }).then(() => refreshPage()).catch((err) => setError(err instanceof Error ? err.message : "Could not submit."));
        }}>
          {state.data.attributes.map((attribute: { id: string; label: string }) => (
            <RatingScale key={attribute.id} label={attribute.label} value={ratings[attribute.id] ?? ""} onChange={(id) => setRatings((current) => ({ ...current, [attribute.id]: id }))} />
          ))}
          <RatingScale label="Overall recommendation" value={recommendation} onChange={setRecommendation} />
          <Field label="Written feedback">
            <textarea className={`${inputClass} min-h-20 py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} required />
          </Field>
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" variant="secondary">Submit scorecard</Button>
        </form>
      )}
      {state.data.feedback?.filter((item: { reviewerId: string }) => item.reviewerId !== state.data?.mine?.reviewer_user_id).map((item: { reviewerId: string; reviewerName: string; recommendation: string; recommendationLabel: string; notes: string; attributes: { id: string; label: string; ratingLabel: string }[] }) => (
        <div key={item.reviewerId} className="border-t border-line pt-2 text-sm">
          <p>{item.reviewerName} <RatingChip id={item.recommendation} label={item.recommendationLabel} /></p>
          <p>{item.attributes.map((attribute) => `${attribute.label}: ${attribute.ratingLabel}`).join(" · ")}</p>
          <p className="text-muted">{item.notes}</p>
        </div>
      ))}
    </div>
  );
}
