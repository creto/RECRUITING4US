import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { getAttempt, getAttemptByAccess, postExamLiveChat, postExamLiveChatByAccess, pushExamLiveBuffer, pushExamLiveBufferByAccess, readExamLiveChat, readExamLiveChatByAccess, requestSampleRun, requestSampleRunByAccess, saveResponse, saveResponseByAccess, submitAttempt, submitAttemptByAccess } from "@/server/talent.functions";
import { questionIndex, saveStatusLabel } from "@/domain/rules";
import { ExamProctor } from "@/components/talent/proctor";
import { ExamDesk, ExamLiveChat, PersonalityCard, examPaper, type ExamChatLine } from "@/components/talent/exam-shell";
import { answerComplete, type SavedAnswer } from "@/domain/candidate-view";
import { Alert, AppLink, Loading, PageTitle, ScreenBack, useAuthed, when } from "@/components/talent/kit";
import { readAssessAccess, takeAssessAccessFromSearch } from "@/domain/assess-access-storage";
import { portalHrefWithAccess, readPortalAccess } from "@/domain/portal-access-storage";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/candidate/attempts/$attemptId")({
  validateSearch: (search: Record<string, unknown>) => ({
    access: typeof search.access === "string" ? search.access : undefined,
  }),
  component: AttemptPage,
});

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
  liveToken?: string | null;
  durationSeconds: number;
  attempt: { id: string; status: string; deadline: string; startedAt: string; reason: string | null };
  items: Item[];
  receipt: { id: string; submittedAt: string; reason: string; answered: number; score: number | null } | null;
  applicationId?: string | null;
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
  const accessFromSearch = Route.useSearch({ select: (s) => s.access });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const accessToken = (() => {
    if (typeof window === "undefined") return accessFromSearch ?? null;
    const fromUrl = accessFromSearch ?? takeAssessAccessFromSearch(attemptId, searchStr);
    return fromUrl ?? readAssessAccess(attemptId);
  })();
  if (accessToken) return <GuestAttempt attemptId={attemptId} accessToken={accessToken} />;
  return <AuthedAttempt attemptId={attemptId} />;
}

function AuthedAttempt({ attemptId }: { attemptId: string }) {
  const state = useAuthed(() => getAttempt({ data: { attemptId } }) as Promise<AttemptView>, [attemptId]);
  if (state.isPending || state.loading) return <Loading />;
  if (state.signedOut) {
    // RedirectToSignIn stamps ?next= from the current attempt URL.
    return <RedirectToSignIn />;
  }
  const error =
    state.error === "Not found." || state.error === "Not found"
      ? "This assessment was not found for your signed-in email. Open your invite link (/assess/…) and unlock with the invited email and one-time code."
      : state.error;
  return (
    <main className={`${examPaper} min-h-screen bg-[#f4f7f5]`}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-[#d7e1da] bg-[#f4f7f5]/95 px-4 py-3 backdrop-blur">
          <ScreenBack fallback="/candidate" />
        </div>
        {error ? <Alert>{error}</Alert> : null}
        {state.data ? <Delivery key={state.data.receipt?.id ?? state.data.attempt.status} view={state.data} /> : null}
      </div>
    </main>
  );
}

function GuestAttempt({ attemptId, accessToken }: { attemptId: string; accessToken: string }) {
  const [view, setView] = useState<AttemptView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    getAttemptByAccess({ data: { attemptId, accessToken } })
      .then((row) => {
        if (!live) return;
        setView(row as AttemptView);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!live) return;
        const message = err instanceof Error ? err.message : "Could not open this assessment.";
        setError(
          message === "Not found." || message === "Not found"
            ? "This assessment session could not be loaded. Open your invite link again and unlock with email and a one-time code."
            : message,
        );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [attemptId, accessToken]);
  if (loading) return <Loading />;
  const portalAppId = view?.applicationId ?? null;
  const portalAccess = portalAppId ? readPortalAccess(portalAppId) : null;
  return (
    <main className={`${examPaper} min-h-screen bg-[#f4f7f5]`}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-[#d7e1da] bg-[#f4f7f5]/95 px-4 py-3 backdrop-blur">
          <ScreenBack fallback={portalAppId && portalAccess ? portalHrefWithAccess(portalAppId, portalAccess) : "/portal"} />
        </div>
        {portalAppId && portalAccess ? (
          <p className="mb-4 text-sm">
            <AppLink className="text-link" href={portalHrefWithAccess(portalAppId, portalAccess)}>
              Back to applicant portal
            </AppLink>
          </p>
        ) : portalAppId ? (
          <p className="mb-4 text-sm">
            <AppLink className="text-link" href="/portal">Applicant portal</AppLink>
          </p>
        ) : null}
        {error ? <Alert>{error}</Alert> : null}
        {view ? <Delivery key={view.receipt?.id ?? view.attempt.status} view={view} accessToken={accessToken} /> : null}
      </div>
    </main>
  );
}

function Delivery({ view, accessToken }: { view: AttemptView; accessToken?: string }) {
  const open = view.attempt.status === "IN_PROGRESS" && !view.receipt;
  if (!open) return <Receipt view={view} />;
  return <Taker view={view} accessToken={accessToken} />;
}

function Taker({ view, accessToken }: { view: AttemptView; accessToken?: string }) {
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
  const [runnerOk, setRunnerOk] = useState<boolean | null>(null);
  const timers = useRef<Record<string, number>>({});
  const answersRef = useRef(answers);
  const revisionsRef = useRef(revisions);
  const saveRef = useRef(saveState);
  answersRef.current = answers;
  revisionsRef.current = revisions;
  saveRef.current = saveState;
  const [cameraReady, setCameraReady] = useState(!view.proctored);
  const [chatLines, setChatLines] = useState<ExamChatLine[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatNotice, setChatNotice] = useState<string | null>(null);
  const liveTimers = useRef<Record<string, number>>({});
  const item = view.items[index];
  const locked = view.proctored && !cameraReady;

  useEffect(() => {
    const handles = timers.current;
    const liveHandles = liveTimers.current;
    return () => {
      for (const timer of Object.values(handles)) window.clearTimeout(timer);
      for (const timer of Object.values(liveHandles)) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let live = true;
    function loadChat() {
      const req = accessToken
        ? readExamLiveChatByAccess({ data: { attemptId: view.attempt.id, accessToken } })
        : readExamLiveChat({ data: { attemptId: view.attempt.id } });
      req.then((row) => {
        if (!live) return;
        setChatLines((row.chat ?? []) as ExamChatLine[]);
        setChatNotice(null);
      }).catch((err: unknown) => {
        if (!live) return;
        setChatNotice(err instanceof Error ? err.message : "Chat could not load.");
      });
    }
    loadChat();
    const timer = window.setInterval(loadChat, 2500);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [view.attempt.id, accessToken]);

  async function persist(next: Item, answer: Answer, expected: number): Promise<number> {
    setSaveState((current) => ({ ...current, [next.id]: "saving" }));
    try {
      const result = accessToken
        ? await saveResponseByAccess({
            data: {
              accessToken,
              attemptId: view.attempt.id,
              itemId: next.id,
              answer,
              expectedRevision: expected,
              mutationId: crypto.randomUUID(),
            },
          })
        : await saveResponse({
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
    const existing = timers.current[item.id];
    if (existing) window.clearTimeout(existing);
    const itemId = item.id;
    const itemType = item.type;
    timers.current[itemId] = window.setTimeout(() => {
      delete timers.current[itemId];
      if (saveRef.current[itemId] === "saving") return;
      setSaveState((current) => ({ ...current, [itemId]: "unsaved" }));
      void persist(item, answer, revisionsRef.current[itemId] ?? 0);
    }, answerComplete(itemType, answer) ? 80 : 450);
    if ((itemType === "code" || itemType === "sql" || itemType === "text") && typeof answer.text === "string") {
      const liveExisting = liveTimers.current[itemId];
      if (liveExisting) window.clearTimeout(liveExisting);
      const bufferText = answer.text;
      liveTimers.current[itemId] = window.setTimeout(() => {
        delete liveTimers.current[itemId];
        const push = accessToken
          ? pushExamLiveBufferByAccess({ data: { accessToken, attemptId: view.attempt.id, itemId, text: bufferText } })
          : pushExamLiveBuffer({ data: { attemptId: view.attempt.id, itemId, text: bufferText } });
        void push.catch(() => {
          // Live pad is best-effort; saving the answer still works.
        });
      }, 400);
    }
  }

  function sendChat() {
    const body = chatDraft.trim();
    if (!body) return;
    setChatNotice(null);
    const req = accessToken
      ? postExamLiveChatByAccess({ data: { accessToken, attemptId: view.attempt.id, body } })
      : postExamLiveChat({ data: { attemptId: view.attempt.id, body } });
    req.then((row) => {
      setChatLines((row.chat ?? []) as ExamChatLine[]);
      setChatDraft("");
    }).catch((err: unknown) => {
      setChatNotice(err instanceof Error ? err.message : "Could not send chat.");
    });
  }

  async function flushCurrent() {
    if (!item) return;
    const timer = timers.current[item.id];
    if (timer) window.clearTimeout(timer);
    const answer = answersRef.current[item.id];
    if (!answer || saveRef.current[item.id] === "saved" || saveRef.current[item.id] === "saving") return;
    const revision = await persist(item, answer, revisionsRef.current[item.id] ?? 0);
    setRevisions((current) => ({ ...current, [item.id]: revision }));
  }

  async function submit() {
    setError(null);
    const latest = { ...revisionsRef.current };
    if (item) {
      const timer = timers.current[item.id];
      if (timer) window.clearTimeout(timer);
      const answer = answersRef.current[item.id];
      if (answer && saveRef.current[item.id] !== "saved" && saveRef.current[item.id] !== "saving") {
        latest[item.id] = await persist(item, answer, revisionsRef.current[item.id] ?? 0);
      }
    }
    const expectedRevisions: Record<string, number> = {};
    for (const row of view.items) expectedRevisions[row.id] = latest[row.id] ?? row.revision;
    try {
      const result = accessToken
        ? await submitAttemptByAccess({ data: { accessToken, attemptId: view.attempt.id, expectedRevisions } })
        : await submitAttempt({ data: { attemptId: view.attempt.id, expectedRevisions } });
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

  const flushRef = useRef(flushCurrent);
  flushRef.current = flushCurrent;

  const unanswered = view.items.filter((row) => !answerComplete(row.type, answers[row.id] ?? row.answer)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const next = questionIndex(index, event.key, view.items.length);
      if (next == null) return;
      if (next > index && item && !answerComplete(item.type, answersRef.current[item.id])) return;
      event.preventDefault();
      void flushRef.current().then(() => setIndex(next));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, item, view.items.length, view.attempt.id]);

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

  return (
    <div className="space-y-4">
      {view.proctored ? <ExamProctor liveAttemptId={view.attempt.id} accessToken={accessToken} onCamera={setCameraReady} /> : null}
      {locked ? <Alert>Allow the camera to see the questions. The picture stays on this device and is not uploaded.</Alert> : (
        <ExamClock
          view={view}
          index={index}
          answers={answers}
          saveState={saveState}
          unanswered={unanswered}
          error={error}
          item={item}
          runnerNote={runnerNote}
          runnerOk={runnerOk}
          chatLines={chatLines}
          chatDraft={chatDraft}
          chatNotice={chatNotice}
          onChatDraft={setChatDraft}
          onChatSend={sendChat}
          onSelect={(next) => {
            setIndex(next);
            void flushCurrent();
          }}
          onAnswer={edit}
          onSubmit={() => void submit()}
          onSample={() => {
            setRunnerOk(null);
            setRunnerNote("Running sample…");
            const run = accessToken
              ? requestSampleRunByAccess({ data: { attemptId: view.attempt.id, accessToken } })
              : requestSampleRun({ data: { attemptId: view.attempt.id } });
            run
              .then((result) => {
                const ok = Boolean((result as { ok?: boolean }).ok) || result.status === "SUCCEEDED";
                setRunnerOk(ok);
                setRunnerNote(result.outputExcerpt ? `${result.reason}\n${result.outputExcerpt}` : result.reason);
              })
              .catch((err: Error) => {
                setRunnerOk(false);
                setRunnerNote(err.message);
              });
          }}
        />
      )}
    </div>
  );
}

function ExamClock({
  view, index, answers, saveState, unanswered, error, item, runnerNote, runnerOk, chatLines, chatDraft, chatNotice, onChatDraft, onChatSend, onSelect, onAnswer, onSubmit, onSample,
}: {
  view: AttemptView;
  index: number;
  answers: Record<string, Answer>;
  saveState: Record<string, string>;
  unanswered: number;
  error: string | null;
  item: Item;
  runnerNote: string | null;
  runnerOk: boolean | null;
  chatLines: ExamChatLine[];
  chatDraft: string;
  chatNotice: string | null;
  onChatDraft: (value: string) => void;
  onChatSend: () => void;
  onSelect: (next: number) => void;
  onAnswer: (answer: Answer) => void;
  onSubmit: () => void;
  onSample: () => void;
}) {
  const clock = useClock(view.attempt.deadline, view.serverNow);
  return (
    <ExamDesk
        kicker={view.assessmentName}
        title={item.section}
        instructions={`${view.instructions}${view.durationSeconds > 0 ? ` Limit ${Math.round(view.durationSeconds / 60)} minutes from the start.` : ""} The server clock ends the attempt. Editing this timer does not add time. The answer key is not on this page. You cannot move on until this question is answered.`}
        items={view.items}
        index={index}
        answers={answers}
        secondsLeft={clock.secondsLeft}
        totalSeconds={view.durationSeconds}
        closed={clock.closed}
        saveLabel={`${saveStatusLabel(saveState[item.id])}${unanswered ? ` · ${unanswered} still open` : ""}`}
        notice={error}
        onSelect={onSelect}
        onAnswer={onAnswer}
        onSubmit={onSubmit}
        livePanel={
          <ExamLiveChat
            lines={chatLines}
            draft={chatDraft}
            onDraft={onChatDraft}
            onSend={onChatSend}
            notice={chatNotice}
          />
        }
        toolbar={item.type === "code" ? (
          <div className="space-y-2">
            <button type="button" className="min-h-10 w-full rounded-full border border-line px-3 text-xs" onClick={onSample}>
              Request a sample run
            </button>
            {runnerOk != null ? (
              <p className={`text-xs font-medium ${runnerOk ? "text-emerald-700" : "text-red-700"}`}>
                {runnerOk ? "Sample run succeeded" : "Sample run failed"}
              </p>
            ) : null}
            <p className={`whitespace-pre-wrap text-xs ${runnerOk === false ? "text-red-800" : runnerOk === true ? "text-emerald-900" : "text-muted"}`}>
              {runnerNote ?? view.runner.reason}
            </p>
          </div>
        ) : null}
      />
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

/** Tick the ring without rebuilding the answer form every second. */
function useClock(deadline: string, serverNow: string) {
  const skew = useMemo(() => new Date(serverNow).getTime() - Date.now(), [serverNow]);
  const read = () => {
    const secondsLeft = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now() - skew) / 1000));
    return { secondsLeft, closed: secondsLeft <= 0 };
  };
  const [clock, setClock] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => setClock(read()), 1000);
    return () => window.clearInterval(id);
    // deadline and skew fully describe the clock
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, skew]);
  return clock;
}
