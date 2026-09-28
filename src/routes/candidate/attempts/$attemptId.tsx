import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAttempt, requestSampleRun, saveResponse, submitAttempt } from "@/server/talent.functions";
import { questionIndex, saveStatusLabel } from "@/domain/rules";
import { ExamProctor } from "@/components/talent/proctor";
import { ExamDesk, PersonalityCard, examPaper } from "@/components/talent/exam-shell";
import { answerComplete, type SavedAnswer } from "@/domain/candidate-view";
import { Alert, Gate, Loading, PageTitle, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/candidate/attempts/$attemptId")({ component: AttemptPage });

type Option = { id: string; label: string };
type Answer = SavedAnswer;
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
  runner: { available: boolean; reason: string; mode?: string };
  proctored: boolean;
  durationSeconds: number;
  attempt: { id: string; status: string; deadline: string; startedAt: string; reason: string | null };
  items: Item[];
  receipt: { id: string; submittedAt: string; reason: string; answered: number; score: number | null } | null;
  personality: {
    code: string | null;
    letters?: string | null;
    identity?: string | null;
    title: string;
    group?: string;
    summary: string;
    note: string;
    scales: { name: string; result: string }[];
  } | null;
};

function AttemptPage() {
  const { attemptId } = Route.useParams();
  const state = useAuthed(() => getAttempt({ data: { attemptId } }) as Promise<AttemptView>, [attemptId]);
  if (state.isPending || state.loading) return <Loading />;
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className={`${examPaper} min-h-screen bg-[#f4f7f5]`}>
        <div className="mx-auto max-w-6xl px-4 py-6">
        {state.error ? <Alert>{state.error}</Alert> : null}
        {state.data ? <Delivery key={state.data.receipt?.id ?? state.data.attempt.status} view={state.data} /> : null}
        </div>
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
  const [personality, setPersonality] = useState<AttemptView["personality"]>(null);
  const [runnerNote, setRunnerNote] = useState<string | null>(null);
  const timers = useRef<Record<string, number>>({});
  const left = useRemaining(view.attempt.deadline, view.serverNow);
  const [cameraReady, setCameraReady] = useState(!view.proctored);
  const item = view.items[index];
  const locked = view.proctored && !cameraReady;

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
      setPersonality(result.personality ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    }
  }

  const unanswered = view.items.filter((row) => !answerComplete(row.type, answers[row.id] ?? row.answer)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const next = questionIndex(index, event.key, view.items.length);
      if (next == null) return;
      if (next > index && item && !answerComplete(item.type, answers[item.id])) return;
      event.preventDefault();
      void flushCurrent().then(() => setIndex(next));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, answers, revisions, saveState, item, view.items.length, view.attempt.id]);

  if (receipt) {
    return (
      <section className="space-y-4">
        <PageTitle title="Submission receipt" lede="This receipt is the saved snapshot. A score appears only when the employer releases it." />
        <div className={`${examPaper} rounded-[28px] border border-[#d7e1da] px-6 py-5 text-sm`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#4c6b16]">Receipt {receipt.id}</p>
          <p className="mt-2 text-[#17211c]">Submitted {when(receipt.submittedAt)} · {receipt.reason} · {receipt.answered} saved answers</p>
        </div>
        <PersonalityReadout personality={personality} />
        <Link to="/candidate" className="text-sm text-link">Back to your applications</Link>
      </section>
    );
  }

  if (!item) return <Alert>This attempt has no questions.</Alert>;

  const secondsLeft = Math.max(0, Math.ceil(left / 1000));

  return (
    <div className="space-y-4">
      {view.proctored ? <ExamProctor liveAttemptId={view.attempt.id} onCamera={setCameraReady} /> : null}
      {locked ? <Alert>Allow the camera to see the questions. The picture stays on this device and is not uploaded.</Alert> : (
        <ExamDesk
          kicker={view.assessmentName}
          title={item.section}
          instructions={`${view.instructions}${view.durationSeconds > 0 ? ` Limit ${Math.round(view.durationSeconds / 60)} minutes from the start.` : ""} The server clock ends the attempt. Editing this timer does not add time. The answer key is not on this page. You cannot move on until this question is answered.`}
          items={view.items}
          index={index}
          answers={answers}
          secondsLeft={secondsLeft}
          totalSeconds={view.durationSeconds}
          closed={left <= 0}
          saveLabel={`${saveStatusLabel(saveState[item.id])}${unanswered ? ` · ${unanswered} still open` : ""}`}
          notice={error}
          onSelect={(next) => {
            void flushCurrent().then(() => setIndex(next));
          }}
          onAnswer={edit}
          onSubmit={() => void submit()}
          toolbar={item.type === "code" ? (
            <div className="space-y-2">
              <button
                type="button"
                className="min-h-10 w-full rounded-full border border-line px-3 text-xs"
                onClick={() => {
                  requestSampleRun({ data: { attemptId: view.attempt.id } })
                    .then((result) => setRunnerNote(result.outputExcerpt ? `${result.reason}\n${result.outputExcerpt}` : result.reason))
                    .catch((err) => setRunnerNote(err.message));
                }}
              >
                Request a sample run
              </button>
              <p className="whitespace-pre-wrap text-xs text-muted">{runnerNote ?? view.runner.reason}</p>
            </div>
          ) : null}
        />
      )}
    </div>
  );
}

function PersonalityReadout({ personality }: { personality: AttemptView["personality"] }) {
  if (!personality) return null;
  return <PersonalityCard personality={personality} />;
}

function Receipt({ view }: { view: AttemptView }) {
  const receipt = view.receipt;
  return (
    <section className="space-y-4">
      <PageTitle title={view.assessmentName} lede="Submitted work stays as it was. Reloading does not add time or change answers." />
      <div className={`${examPaper} rounded-[28px] border border-[#d7e1da] px-6 py-5 text-sm text-[#17211c]`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#44574e]">Status {view.attempt.status}{view.attempt.reason ? ` · ${view.attempt.reason}` : ""}</p>
        {receipt ? (
          <>
            <p className="mt-2">Receipt {receipt.id}</p>
            <p>Submitted {when(receipt.submittedAt)} · {receipt.reason}</p>
            <p>{receipt.answered} answers in the snapshot</p>
            <p className="mt-2">{view.personality ? "A personality result is not a percentage." : receipt.score == null ? "No score has been released." : `Released score: ${(receipt.score / 100).toFixed(2)}%`}</p>
          </>
        ) : (
          <p className="mt-2 text-muted">This attempt is closed.</p>
        )}
      </div>
      <PersonalityReadout personality={view.personality} />
      <Link to="/candidate" className="text-sm text-link">Back to your applications</Link>
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
