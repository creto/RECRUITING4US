import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_TEXT_RUBRIC, explainAuthorQuestion, gradingGuide } from "@/domain/rules";
import { archiveAssessment, createAssessment, createQuestion, listAssessments, listQuestions, publishAssessment } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

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
  const questions = useAuthed(() => listQuestions({ data: { slug: companySlug } }), [companySlug]);
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
  const [minutes, setMinutes] = useState(20);
  const [poolPick, setPoolPick] = useState("");

  if (tests.loading || tests.isPending) return <Loading />;

  const choice = type === "single" || type === "multi";

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
          instructions: "The timer starts only after you choose Start. Refreshing this page does not start it.",
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
      <PageTitle title="Assessments" lede="Published versions stay fixed for people already assigned. Code, SQL, and spreadsheets are stored for a person to grade. Nothing is executed here." />
      {tests.error ? <Alert>{tests.error}</Alert> : null}
      {(tests.data ?? []).length === 0 ? <Empty title="No assessments" body="Create a draft below, or open the Northstar demo." /> : null}
      <ul className="space-y-2">
        {(tests.data ?? []).map((test: any) => (
          <li key={String(test.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
            <span className="text-xl">{String(test.name)}</span>
            <span className="mt-1 block text-muted">{String(test.published)} published · {String(test.assignments)} assignments</span>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" type="button" onClick={() => publishAssessment({ data: { slug: companySlug, assessmentId: String(test.id) } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Publish latest draft</Button>
              <Button variant="ghost" type="button" onClick={() => archiveAssessment({ data: { slug: companySlug, assessmentId: String(test.id) } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Archive</Button>
            </div>
          </li>
        ))}
      </ul>
      <section className="mt-8">
        <h2 className="text-2xl">How questions are graded</h2>
        <p className="mt-1 text-sm text-muted">These are the only three graders. A section that still needs a person stays pending. Pending is not zero, and a failed scorer does not invent a zero.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(["single", "numeric", "text"] as const).map((kind) => {
            const guide = gradingGuide(kind);
            return (
              <article key={kind} className="rounded-md border border-line bg-surface p-4 text-sm">
                <h3 className="text-xl">{guide.title}</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted">
                  {guide.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </article>
            );
          })}
        </div>
        <h2 className="mt-8 text-2xl">Question bank</h2>
        {questions.loading ? <Loading /> : null}
        {questions.error ? <p className="text-sm text-muted">Question authoring is limited to assessment authors. {questions.error}</p> : null}
        <ul className="mt-3 space-y-2">
          {(questions.data ?? []).map((question: any) => (
            <li key={String(question.version_id)} className="rounded-md border border-line bg-surface p-3 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={picked.includes(String(question.version_id))}
                  onChange={(event) => {
                    const id = String(question.version_id);
                    setPicked((current) => event.target.checked ? [...current, id] : current.filter((item) => item !== id));
                  }}
                />
                <span>
                  <span className="text-xs uppercase text-muted">{String(question.type)} · v{String(question.version_number)} · {String(question.points)} pt · {String(question.grading?.title ?? "Ungraded")}</span>
                  <p className="mt-1 whitespace-pre-wrap">{String(question.prompt).slice(0, 280)}</p>
                  {question.grading?.keySummary ? <p className="mt-2 text-muted">{String(question.grading.keySummary)}</p> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
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
            <fieldset className="space-y-2">
              <legend className="text-sm">Choices and the answer key</legend>
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
        <form className="mt-8 space-y-3" onSubmit={saveAssessment}>
          <h3 className="text-xl">New draft assessment</h3>
          <p className="text-sm text-muted">Check the questions above. Publishing pins those versions. Later edits do not change an assignment that already exists.</p>
          <Field label="Name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /></Field>
          <Field label="Minutes">
            <input className={inputClass} type="number" min={1} max={240} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
          </Field>
          <Field label="Draw this many questions (blank uses all)">
            <input className={inputClass} type="number" min={1} value={poolPick} onChange={(event) => setPoolPick(event.target.value)} />
          </Field>
          <Button type="submit">Save draft</Button>
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
    <aside className="rounded-md border border-line bg-surface p-4 text-sm">
      <p className="text-xs uppercase text-muted">How this question will be graded</p>
      <p className="mt-1 text-xl">{preview.title}</p>
      <p className="mt-2">{preview.keySummary}</p>
    </aside>
  );
}
