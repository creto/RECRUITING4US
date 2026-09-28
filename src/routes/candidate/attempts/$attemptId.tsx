import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAttempt, requestSampleRun, saveResponse, submitAttempt } from "@/server/talent.functions";
import { questionIndex, saveStatusLabel } from "@/domain/rules";
import { Alert, Button, Gate, Loading, PageTitle, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/candidate/attempts/$attemptId")({ component: AttemptPage });

type Option = { id: string; label: string };
type Answer = { optionId?: string; optionIds?: string[]; value?: string; text?: string };
type Item = {
  id: string;
  position: number;
  points: number;
  prompt: string;
  type: string;
  section: string;
  options: Option[];
  numeric: { absTolerance?: string; relTolerance?: string } | null;
  answer: Answer | null;
  revision: number;
};
type AttemptView = {
  serverNow: string;
  assessmentName: string;
  instructions: string;
  runner: { available: false; reason: string };
  attempt: { id: string; status: string; deadline: string; startedAt: string; reason: string | null };
  items: Item[];
  receipt: { id: string; submittedAt: string; reason: string; answered: number; score: number | null } | null;
};

function AttemptPage() {
  const { attemptId } = Route.useParams();
  const state = useAuthed(() => getAttempt({ data: { attemptId } }) as Promise<AttemptView>, [attemptId]);
  if (state.isPending || state.loading) return <Loading />;
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-3xl px-4 py-6">
        {state.error ? <Alert>{state.error}</Alert> : null}
        {state.data ? <Delivery key={state.data.receipt?.id ?? state.data.attempt.status} view={state.data} /> : null}
      </main>
    </Gate>
  );
}

function Delivery({ view }: { view: AttemptView }) {
  const open = view.attempt.status === "IN_PROGRESS" && !view.receipt;
  if (!open) return <Receipt view={view} />;
  return <Taker view={view} />;
}

function Taker({ view }: { view: AttemptView }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    const seed: Record<string, Answer> = {};
    for (const item of view.items) if (item.answer) seed[item.id] = item.answer;
    return seed;
  });
  const [revisions, setRevisions] = useState<Record<string, number>>(() => {
    const seed: Record<string, number> = {};
    for (const item of view.items) seed[item.id] = item.revision;
    return seed;
  });
  const [saveState, setSaveState] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<AttemptView["receipt"]>(null);
  const [runnerNote, setRunnerNote] = useState<string | null>(null);
  const timers = useRef<Record<string, number>>({});
  const left = useRemaining(view.attempt.deadline, view.serverNow);
  const item = view.items[index];

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timers.current)) window.clearTimeout(timer);
    };
  }, []);

  function schedule(next: Item, answer: Answer, expected: number) {
    const existing = timers.current[next.id];
    if (existing) window.clearTimeout(existing);
    setSaveState((current) => ({ ...current, [next.id]: "unsaved" }));
    timers.current[next.id] = window.setTimeout(() => {
      void persist(next, answer, expected);
    }, 450);
  }

  async function persist(next: Item, answer: Answer, expected: number): Promise<number> {
    setSaveState((current) => ({ ...current, [next.id]: "saving" }));
    try {
      const result = await saveResponse({
        data: {
          attemptId: view.attempt.id,
          itemId: next.id,
          answer,
          expectedRevision: expected,
          mutationId: crypto.randomUUID(),
        },
      });
      if (result.status === "saved") {
        setRevisions((current) => ({ ...current, [next.id]: result.revision }));
        setSaveState((current) => ({ ...current, [next.id]: "saved" }));
        return result.revision;
      }
      if (result.status === "conflict" && "answer" in result && result.answer) {
        setAnswers((current) => ({ ...current, [next.id]: result.answer as Answer }));
        setRevisions((current) => ({ ...current, [next.id]: result.revision }));
      }
      setSaveState((current) => ({ ...current, [next.id]: result.status }));
      setError(result.message);
      return result.revision;
    } catch (err) {
      setSaveState((current) => ({ ...current, [next.id]: "offline" }));
      setError(err instanceof Error ? err.message : "Could not save.");
      return expected;
    }
  }

  function edit(answer: Answer) {
    if (!item) return;
    setAnswers((current) => ({ ...current, [item.id]: answer }));
    schedule(item, answer, revisions[item.id] ?? 0);
  }

  async function flushCurrent() {
    if (!item) return;
    const timer = timers.current[item.id];
    if (timer) window.clearTimeout(timer);
    const answer = answers[item.id];
    if (!answer || saveState[item.id] === "saved") return;
    const revision = await persist(item, answer, revisions[item.id] ?? 0);
    setRevisions((current) => ({ ...current, [item.id]: revision }));
  }

  async function submit() {
    setError(null);
    const latest = { ...revisions };
    if (item) {
      const timer = timers.current[item.id];
      if (timer) window.clearTimeout(timer);
      const answer = answers[item.id];
      if (answer && saveState[item.id] !== "saved") {
        latest[item.id] = await persist(item, answer, revisions[item.id] ?? 0);
      }
    }
    const expectedRevisions: Record<string, number> = {};
    for (const row of view.items) expectedRevisions[row.id] = latest[row.id] ?? row.revision;
    try {
      const result = await submitAttempt({ data: { attemptId: view.attempt.id, expectedRevisions } });
      setReceipt({
        id: result.receiptId,
        submittedAt: result.submittedAt,
        reason: result.reason,
        answered: result.answered,
        score: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    }
  }

  const unanswered = view.items.filter((row) => !hasAnswer(answers[row.id] ?? row.answer, row.type)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const next = questionIndex(index, event.key, view.items.length);
      if (next == null) return;
      event.preventDefault();
      void flushCurrent().then(() => setIndex(next));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, answers, revisions, saveState, item, view.items.length, view.attempt.id]);

  if (receipt) {
    return (
      <section className="space-y-3">
        <PageTitle title="Submission receipt" lede="This receipt is the saved snapshot. A score appears only when the employer releases it." />
        <p className="text-sm">Receipt {receipt.id}</p>
        <p className="text-sm">Submitted {when(receipt.submittedAt)} · {receipt.reason} · {receipt.answered} saved answers</p>
        <Link to="/candidate" className="text-sm text-accent">Back to your applications</Link>
      </section>
    );
  }

  if (!item) return <Alert>This attempt has no questions.</Alert>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{view.assessmentName}</p>
          <h1 className="text-3xl">{item.section}</h1>
        </div>
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums" aria-live="polite">
          {left > 0 ? formatLeft(left) : "Time is up"} · server clock
        </p>
      </div>
      <p className="text-sm text-muted">{view.instructions}</p>
      <nav className="flex gap-2 overflow-x-auto" aria-label="Questions">
        {view.items.map((row, position) => (
          <button
            key={row.id}
            type="button"
            className={`min-h-11 min-w-11 rounded-md border px-2 text-sm ${position === index ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface"}`}
            onClick={() => {
              void flushCurrent().then(() => setIndex(position));
            }}
          >
            {position + 1}
          </button>
        ))}
      </nav>
      <article className="space-y-3 rounded-md border border-line bg-surface p-4">
        <p className="whitespace-pre-wrap text-sm">{item.prompt}</p>
        {item.type === "single" ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">Choose one</legend>
            {item.options.map((option) => (
              <label key={option.id} className="flex min-h-11 items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={item.id}
                  checked={answers[item.id]?.optionId === option.id}
                  onChange={() => edit({ optionId: option.id })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        ) : null}
        {item.type === "numeric" ? (
          <label className="block text-sm">
            Number
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-line bg-bg px-3"
              inputMode="decimal"
              value={answers[item.id]?.value ?? ""}
              onChange={(event) => edit({ value: event.target.value })}
            />
          </label>
        ) : null}
        {item.type === "multi" ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">Choose all that apply</legend>
            {item.options.map((option) => {
              const selected = answers[item.id]?.optionIds ?? [];
              return (
                <label key={option.id} className="flex min-h-11 items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => {
                      const next = selected.includes(option.id)
                        ? selected.filter((id) => id !== option.id)
                        : [...selected, option.id];
                      edit({ optionIds: next });
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </fieldset>
        ) : null}
        {item.type !== "single" && item.type !== "multi" && item.type !== "numeric" ? (
          <label className="block text-sm">
            {item.type === "code" ? "Source" : "Response"}
            <textarea
              className="mt-1 min-h-48 w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-sm"
              value={answers[item.id]?.text ?? ""}
              onChange={(event) => edit({ text: event.target.value })}
            />
          </label>
        ) : null}
        <p className="text-xs text-muted" aria-live="polite">
          {saveStatusLabel(saveState[item.id])}
        </p>
        {item.type === "code" ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                requestSampleRun({ data: { attemptId: view.attempt.id } })
                  .then((result) => setRunnerNote(result.reason))
                  .catch((err) => setRunnerNote(err.message));
              }}
            >
              Request a sample run
            </Button>
            <p className="text-sm text-muted">{runnerNote ?? view.runner.reason}</p>
          </div>
        ) : null}
      </article>
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{unanswered} unanswered</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={index === 0} onClick={() => void flushCurrent().then(() => setIndex((value) => value - 1))}>
            Previous
          </Button>
          <Button type="button" variant="secondary" disabled={index >= view.items.length - 1} onClick={() => void flushCurrent().then(() => setIndex((value) => value + 1))}>
            Next
          </Button>
          <Button type="button" onClick={() => void submit()}>Submit</Button>
        </div>
      </div>
    </div>
  );
}

function Receipt({ view }: { view: AttemptView }) {
  const receipt = view.receipt;
  return (
    <section className="space-y-3">
      <PageTitle title={view.assessmentName} lede="Submitted work stays as it was. Reloading does not add time or change answers." />
      <p className="text-sm">Status {view.attempt.status}{view.attempt.reason ? ` · ${view.attempt.reason}` : ""}</p>
      {receipt ? (
        <div className="rounded-md border border-line bg-surface p-4 text-sm">
          <p>Receipt {receipt.id}</p>
          <p>Submitted {when(receipt.submittedAt)} · {receipt.reason}</p>
          <p>{receipt.answered} answers in the snapshot</p>
          <p>{receipt.score == null ? "No score has been released." : `Released score: ${(receipt.score / 100).toFixed(2)}%`}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">This attempt is closed.</p>
      )}
      <Link to="/candidate" className="text-sm text-accent">Back to your applications</Link>
    </section>
  );
}

function useRemaining(deadline: string, serverNow: string) {
  const skew = useMemo(() => new Date(serverNow).getTime() - Date.now(), [serverNow]);
  const [left, setLeft] = useState(() => Math.max(0, new Date(deadline).getTime() - Date.now() - skew));
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft(Math.max(0, new Date(deadline).getTime() - Date.now() - skew));
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadline, skew]);
  return left;
}

function formatLeft(ms: number) {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}

function hasAnswer(answer: Answer | null | undefined, type: string) {
  if (!answer) return false;
  if (type === "single") return Boolean(answer.optionId);
  if (type === "multi") return Boolean(answer.optionIds && answer.optionIds.length > 0);
  if (type === "numeric") return Boolean(answer.value);
  return Boolean(answer.text && answer.text.trim());
}
