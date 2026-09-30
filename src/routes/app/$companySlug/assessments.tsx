import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_TEXT_RUBRIC, explainAuthorQuestion, gradingGuide } from "@/domain/rules";
import { archiveAssessment, assignAssessment, createAssessment, createQuestion, listActiveAttempts, listAssessments, listQuestions, previewAssessment, publishAssessment, sendAssessmentToFits, updateAssessmentDelivery } from "@/server/talent.functions";
import { ExamPreview, type AssessmentPreview } from "@/components/talent/exam-preview";
import { examPaper } from "@/components/talent/exam-shell";
import { DifficultyBadge, ProblemPrompt } from "@/components/talent/code-block";
import { Alert, AppLink, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/assessments")({ component: Assessments });

const TYPES = [
  ["single", "Single choice"],
  ["multi", "Multiple choice"],
  ["numeric", "Numeric"],
  ["text", "Written"],
  ["code", "Code (human review)"],
  ["sql", "SQL (human review)"],
  ["file", "Work sample"],
  ["spreadsheet", "Spreadsheet (human review)"],
  ["recording", "Recorded response (notes only)"],
] as const;

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"] as const;

function Assessments() {
  const { companySlug } = Route.useParams();
  const tests = useAuthed(() => listAssessments({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number][0]>("single");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState([{ id: "a", label: "" }, { id: "b", label: "" }]);
  const [correctIds, setCorrectIds] = useState<string[]>(["a"]);
  const [expected, setExpected] = useState("");
  const [tolerance, setTolerance] = useState("0");
  const [relTolerance, setRelTolerance] = useState("0");
  const [points, setPoints] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(45);
  const [poolPick, setPoolPick] = useState("");
  const [proctored, setProctored] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [bankFilter, setBankFilter] = useState<"all" | "bank" | "read" | "other">("other");
  const [bankPage, setBankPage] = useState(0);
  const [bankQuery, setBankQuery] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const pageSize = 40;
  const questions = useAuthed(
    () => listQuestions({
      data: {
        slug: companySlug,
        filter: bankFilter,
        limit: pageSize,
        offset: bankPage * pageSize,
        q: bankSearch || undefined,
      },
    }),
    [companySlug, bankFilter, bankPage, bankSearch],
  );
  const [sendApplicationId, setSendApplicationId] = useState("");
  const [sendAssessmentId, setSendAssessmentId] = useState("");
  const preview = useAuthed(
    () => previewAssessment({ data: { slug: companySlug, assessmentId: previewId ?? "" } }) as Promise<AssessmentPreview>,
    [companySlug, previewId],
    Boolean(previewId),
  );

  if (tests.loading || tests.isPending) return <Loading />;

  const choice = type === "single" || type === "multi";
  const published = (tests.data ?? []).filter((test: { published?: unknown; archived?: unknown }) => test.archived !== true && Number(test.published) > 0);

  async function sendOne(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNote(null);
    if (sendApplicationId.trim().length < 8 || !sendAssessmentId) {
      setError("Paste an application id and choose a published assessment.");
      return;
    }
    try {
      const result = await assignAssessment({
        data: {
          slug: companySlug,
          applicationId: sendApplicationId.trim(),
          assessmentId: sendAssessmentId,
          startBy: new Date(Date.now() + 14 * 86400000).toISOString(),
          multiplierBasisPoints: 10000,
          extraSeconds: 0,
        },
      });
      setNote(`Sent. Assignment ${result.assignmentId}. The candidate can start within 14 days.`);
      setSendApplicationId("");
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the assessment.");
    }
  }

  async function saveQuestion(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const filled = choice
      ? options.map((option) => ({ id: option.id, label: option.label.trim() })).filter((option) => option.label)
      : [];
    const correct = choice ? correctIds.filter((id) => filled.some((option) => option.id === id)) : [];
    if (choice && filled.length < 2) {
      setError("Add at least two answer choices.");
      return;
    }
    if (choice && correct.length === 0) {
      setError("Mark the correct choice or choices.");
      return;
    }
    if (type === "single" && correct.length !== 1) {
      setError("A single-choice question has one correct option.");
      return;
    }
    try {
      await createQuestion({
        data: {
          slug: companySlug,
          type,
          prompt,
          tags: "custom",
          points,
          options: filled,
          correct,
          expected: type === "numeric" ? expected : undefined,
          absTolerance: type === "numeric" ? tolerance : undefined,
          relTolerance: type === "numeric" ? relTolerance : "0",
        },
      });
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the question.");
    }
  }

  async function saveAssessment(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (picked.length === 0) {
      setError("Choose at least one question version.");
      return;
    }
    try {
      await createAssessment({
        data: {
          slug: companySlug,
          name,
          description: "Draft assembled in the workspace.",
          durationSeconds: Math.max(1, minutes) * 60,
          scoreRelease: "AGGREGATE",
          instructions: proctored
            ? `Time limit: ${minutes} minutes. The timer starts only after you choose Start. This version is proctored: the camera must stay on, and leaving the tab or fullscreen is noted. Video is not uploaded.`
            : "The timer starts only after you choose Start. Refreshing this page does not start it.",
          proctored,
          autoSend,
          sections: [{
            title: "Questions",
            weightBasisPoints: 10000,
            poolPick: poolPick.trim() ? Number(poolPick) : null,
            questionVersionIds: picked,
          }],
        },
      });
      refreshPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the assessment.");
    }
  }

  return (
    <div>
      <PageTitle title="Assessments" lede="Open Preview to take the paper with its time limit. Automatic send assigns a published exam when a CV is a fit. The coding bank is 500 original write-code problems across easy, medium, and hard. They are not items copied from another site. Code is stored for a person to grade." />
      {tests.error ? <Alert>{tests.error}</Alert> : null}
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      {note ? <p className="mb-3 text-sm text-ok">{note}</p> : null}
      <LiveExams companySlug={companySlug} />
      {previewId ? (
        <div className="mb-6">
          {preview.loading || preview.isPending ? <Loading /> : null}
          {preview.error ? <Alert>{preview.error}</Alert> : null}
          {preview.data ? <ExamPreview exam={preview.data} onClose={() => setPreviewId(null)} /> : null}
        </div>
      ) : null}
      <h2 className="mb-3 text-xl">Exams</h2>
      {(tests.data ?? []).length === 0 ? <Empty title="No assessments" body="Create a draft below, or open the Northstar demo." /> : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {(tests.data ?? []).map((test: any) => (
          <li key={String(test.id)} className={`${examPaper} flex flex-col rounded-[28px] border border-[#d7e1da] p-5`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl leading-tight text-[#17211c]">{String(test.name)}</h2>
              <span className="shrink-0 rounded-full bg-[#cefa90] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#14221b]">{Number(test.published) > 0 ? `${String(test.published)} live` : "Draft"}</span>
            </div>
            <p className="mt-3 text-sm text-[#44574e]">
              {String(test.assignments)} assignments
              {Number(test.duration_seconds) > 0 ? ` · ${Math.round(Number(test.duration_seconds) / 60)} min` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-[#17211c]">
              <span className="rounded-full border border-[#d7e1da] bg-[#f7fbe9] px-2.5 py-1 text-[#4c6b16]">{test.proctored ? "Proctored" : "Open book"}</span>
              <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">{test.auto_send ? "Auto-send" : "Manual send"}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={() => { setNote(null); setPreviewId(String(test.id)); }}>Preview</Button>
              <Button variant="secondary" type="button" onClick={() => {
                setError(null);
                setNote(null);
                void publishAssessment({ data: { slug: companySlug, assessmentId: String(test.id) } })
                  .then((result) => {
                    setNote(result?.alreadyPublished ? "Already published." : "Published. Candidates can be assigned this version.");
                    refreshPage();
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : "Could not publish."));
              }}>Publish</Button>
              <Button variant="ghost" type="button" onClick={() => updateAssessmentDelivery({ data: { slug: companySlug, assessmentId: String(test.id), autoSend: !test.auto_send } }).then(() => refreshPage()).catch((err) => setError(err.message))}>
                {test.auto_send ? "Auto-send off" : "Auto-send on"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => updateAssessmentDelivery({ data: { slug: companySlug, assessmentId: String(test.id), proctored: !test.proctored } }).then(() => refreshPage()).catch((err) => setError(err.message))}>
                {test.proctored ? "Proctoring off" : "Proctoring on"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => sendAssessmentToFits({ data: { slug: companySlug, assessmentId: String(test.id) } }).then((result) => { setNote(`Sent to ${result.sent} ${result.sent === 1 ? "person" : "people"} whose CV was a fit.`); refreshPage(); }).catch((err) => setError(err.message))}>Send to fits</Button>
              <Button variant="ghost" type="button" onClick={() => archiveAssessment({ data: { slug: companySlug, assessmentId: String(test.id) } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Archive</Button>
            </div>
          </li>
        ))}
      </ul>
      <section className="mt-8 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
        <h2 className="text-2xl">Create an assessment</h2>
        <p className="mt-1 text-sm text-muted">Pick question versions in the bank further down, then save a draft. Publishing pins those versions. Later edits do not change an assignment that already exists. {picked.length} selected.</p>
        <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={saveAssessment}>
          <Field label="Name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /></Field>
          <Field label="Time limit (minutes)">
            <input className={inputClass} type="number" min={1} max={240} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={proctored} onChange={(event) => setProctored(event.target.checked)} />
            Proctor the exam (camera on, focus and clipboard noted, no video stored)
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={autoSend} onChange={(event) => setAutoSend(event.target.checked)} />
            Send automatically when a CV is a fit
          </label>
          <Field label="Draw this many questions (blank uses all)">
            <input className={inputClass} type="number" min={1} value={poolPick} onChange={(event) => setPoolPick(event.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Save draft</Button>
          </div>
        </form>
      </section>
      <section className="mt-8 rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
        <h2 className="text-2xl">Send to one application</h2>
        <p className="mt-1 text-sm text-muted">Paste an application id from Candidates. Only a published exam can be sent. The candidate can start any time in the next 14 days. Opening the notice does not start the timer.</p>
        <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={sendOne}>
          <Field label="Application id">
            <input className={inputClass} value={sendApplicationId} onChange={(event) => setSendApplicationId(event.target.value)} placeholder="Application id" />
          </Field>
          <Field label="Published assessment">
            <select className={inputClass} value={sendAssessmentId} onChange={(event) => setSendAssessmentId(event.target.value)}>
              <option value="">Choose</option>
              {published.map((test: { id?: string; name?: string }) => (
                <option key={String(test.id)} value={String(test.id)}>{String(test.name)}</option>
              ))}
            </select>
          </Field>
          {published.length === 0 ? <p className="text-sm text-muted md:col-span-2">Publish an assessment before sending it.</p> : null}
          <div>
            <Button type="submit" disabled={published.length === 0}>Send assessment</Button>
          </div>
        </form>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl">How questions are graded</h2>
        <p className="mt-1 text-sm text-muted">These are the only three graders. A section that still needs a person stays pending. Pending is not zero, and a failed scorer does not invent a zero.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(["single", "numeric", "text"] as const).map((kind) => {
            const guide = gradingGuide(kind);
            return (
              <article key={kind} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
                <h3 className="text-xl">{guide.title}</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted">
                  {guide.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </article>
            );
          })}
        </div>
        <h2 className="mt-8 text-2xl">Question bank</h2>
        <p className="mt-1 text-sm text-muted">The coding bank is 500 original write-code problems, easy, medium, and hard. The read-code bank is 500 original multiple-choice snippets. Lists load a page at a time so this tab stays fast.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["other", "bank", "read", "all"] as const).map((value) => (
            <Button key={value} type="button" variant={bankFilter === value ? "secondary" : "ghost"} onClick={() => { setBankFilter(value); setBankPage(0); }}>
              {value === "all" ? "All" : value === "bank" ? "Coding bank" : value === "read" ? "Read-code bank" : "Other questions"}
            </Button>
          ))}
        </div>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setBankPage(0); setBankSearch(bankQuery.trim()); }}>
          <input className={`${inputClass} max-w-md`} value={bankQuery} onChange={(event) => setBankQuery(event.target.value)} placeholder="Search titles or prompts" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        {questions.loading || questions.isPending ? <Loading /> : null}
        {questions.error ? <p className="text-sm text-muted">Question authoring is limited to assessment authors. {questions.error}</p> : null}
        <p className="mt-3 text-sm text-muted">
          Showing {((questions.data as any)?.items ?? []).length} of {Number((questions.data as any)?.total ?? 0)} · page {bankPage + 1}
        </p>
        <ul className="mt-3 space-y-2">
          {(((questions.data as any)?.items ?? []) as any[]).map((question: any) => (
            <li key={String(question.version_id)} className={`${examPaper} rounded-[24px] border border-[#d7e1da] p-4 text-sm`}>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--color-accent)]"
                  checked={picked.includes(String(question.version_id))}
                  onChange={(event) => {
                    const id = String(question.version_id);
                    setPicked((current) => event.target.checked ? [...current, id] : current.filter((item) => item !== id));
                  }}
                />
                <span className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#4c6b16]">
                    <span>{String(question.type)} · v{String(question.version_number)} · {String(question.points)} pt</span>
                    <DifficultyBadge difficulty={question.difficulty ? String(question.difficulty) : null} />
                  </div>
                  <div className="mt-3">
                    <ProblemPrompt
                      prompt={String(question.prompt ?? "")}
                      title={question.title ? String(question.title) : null}
                      difficulty={null}
                      compact
                    />
                  </div>
                  {Array.isArray(question.options) && question.options.length > 0 ? (
                    <ul className="mt-3 grid gap-2">
                      {question.options.map((option: { id: string; label: string }, position: number) => (
                        <li key={option.id} className="flex items-start gap-3 rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-3 py-2 text-[#17211c]">
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white font-brand text-xs text-[#4c6b16]">{String.fromCharCode(65 + position)}</span>
                          <span className="leading-snug">{option.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {question.grading?.keySummary ? <p className="mt-3 text-xs text-[#44574e]">{String(question.grading.keySummary)}</p> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" disabled={bankPage <= 0} onClick={() => setBankPage((page) => Math.max(0, page - 1))}>Previous</Button>
          <Button type="button" variant="ghost" disabled={(bankPage + 1) * pageSize >= Number((questions.data as any)?.total ?? 0)} onClick={() => setBankPage((page) => page + 1)}>Next</Button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={saveQuestion}>
          <h3 className="text-xl">New question</h3>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(event) => {
              const next = event.target.value as typeof type;
              setType(next);
              if (next === "single") setCorrectIds((current) => current.slice(0, 1).length ? current.slice(0, 1) : ["a"]);
            }}>
              {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Prompt">
            <textarea className={`${inputClass} min-h-24 py-2`} value={prompt} onChange={(event) => setPrompt(event.target.value)} required minLength={3} />
          </Field>
          {choice ? (
            <fieldset className={`${examPaper} space-y-2 rounded-[24px] border border-[#d7e1da] p-4`}>
              <legend className="px-1 text-[11px] uppercase tracking-[0.16em] text-[#4c6b16]">Choices · mark the correct ones</legend>
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type={type === "single" ? "radio" : "checkbox"}
                    name="correct"
                    className="size-4"
                    checked={correctIds.includes(option.id)}
                    onChange={() => {
                      if (type === "single") setCorrectIds([option.id]);
                      else setCorrectIds((current) => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]);
                    }}
                    aria-label={`Mark ${option.id.toUpperCase()} correct`}
                  />
                  <input
                    className={inputClass}
                    value={option.label}
                    placeholder={`Option ${option.id.toUpperCase()}`}
                    onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))}
                    required
                  />
                </div>
              ))}
              {options.length < OPTION_IDS.length ? (
                <Button type="button" variant="ghost" onClick={() => {
                  const id = OPTION_IDS[options.length];
                  if (!id) return;
                  setOptions((current) => [...current, { id, label: "" }]);
                }}>Add a choice</Button>
              ) : null}
            </fieldset>
          ) : null}
          {type === "numeric" ? (
            <>
              <Field label="Expected value"><input className={inputClass} value={expected} onChange={(event) => setExpected(event.target.value)} required /></Field>
              <Field label="Absolute tolerance"><input className={inputClass} value={tolerance} onChange={(event) => setTolerance(event.target.value)} required /></Field>
              <Field label="Relative tolerance (0.01 = 1%)"><input className={inputClass} value={relTolerance} onChange={(event) => setRelTolerance(event.target.value)} required /></Field>
            </>
          ) : null}
          <Field label="Points">
            <input className={inputClass} type="number" min={1} max={100} value={points} onChange={(event) => setPoints(Number(event.target.value))} />
          </Field>
          <GradingPreview type={type} points={points} options={options} correctIds={correctIds} expected={expected} tolerance={tolerance} relTolerance={relTolerance} />
          <Button type="submit" variant="secondary">Save question</Button>
        </form>
      </section>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </div>
  );
}

function GradingPreview({
  type,
  points,
  options,
  correctIds,
  expected,
  tolerance,
  relTolerance,
}: {
  type: string;
  points: number;
  options: { id: string; label: string }[];
  correctIds: string[];
  expected: string;
  tolerance: string;
  relTolerance: string;
}) {
  const choice = type === "single" || type === "multi";
  const human = type !== "single" && type !== "multi" && type !== "numeric";
  const preview = explainAuthorQuestion({
    type,
    points,
    payload: choice ? { options } : type === "numeric" ? { absTolerance: tolerance, relTolerance } : { mode: type },
    rubric: human ? DEFAULT_TEXT_RUBRIC : null,
    key: choice ? { correct: correctIds } : type === "numeric" ? { expected } : {},
  });
  return (
    <aside className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
      <p className="text-xs uppercase text-muted">How this question will be graded</p>
      <p className="mt-1 text-xl">{preview.title}</p>
      <p className="mt-2">{preview.keySummary}</p>
    </aside>
  );
}

type ActiveAttempt = {
  attemptId: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  assessmentName: string;
  startedAt: string;
  deadline: string;
  lastSeen: string | null;
  liveToken: string;
  watchPath: string;
  summary: string;
};

function LiveExams({ companySlug }: { companySlug: string }) {
  const live = useAuthed(
    () => listActiveAttempts({ data: { slug: companySlug } }) as Promise<{ items: ActiveAttempt[]; polledAt: string }>,
    [companySlug],
  );

  useEffect(() => {
    const timer = window.setInterval(() => live.reload(), 4000);
    return () => window.clearInterval(timer);
    // reload bumps an internal tick; identity is not stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySlug]);

  const items = live.data?.items ?? [];
  return (
    <section className="mb-8 rounded-[24px] border border-[#d7e1da] bg-[#f7fbe9] p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl text-[#17211c]">Live now</h2>
          <p className="mt-1 text-sm text-[#44574e]">
            When a candidate starts an exam, they show up here. Open Watch to see their answers update in the existing live pad.
          </p>
        </div>
        <span className="rounded-full border border-[#d7e1da] bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#4c6b16]">
          {items.length === 0 ? "Nobody taking an exam" : `${items.length} in progress`}
        </span>
      </div>
      {live.error ? <div className="mt-3"><Alert>{live.error}</Alert></div> : null}
      {items.length === 0 && !live.loading ? (
        <p className="mt-3 text-sm text-[#44574e]">No open attempts right now. This list refreshes every few seconds.</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {items.map((row) => (
          <li key={row.attemptId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d7e1da] bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-[#17211c]">{row.candidateName}</p>
              <p className="text-sm text-[#44574e]">{row.jobTitle} · {row.assessmentName}</p>
              <p className="mt-1 text-xs text-[#44574e]">
                Started {when(row.startedAt)}
                {row.lastSeen ? ` · last active ${when(row.lastSeen)}` : ""}
                {" · deadline "}{when(row.deadline)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppLink href={row.watchPath} className="inline-flex min-h-10 items-center rounded-full bg-[#14221b] px-4 text-sm text-white">
                Watch live
              </AppLink>
              <AppLink href={`/app/${companySlug}/applications/${row.applicationId}`} className="inline-flex min-h-10 items-center rounded-full border border-[#d7e1da] px-4 text-sm text-[#17211c]">
                Application
              </AppLink>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
