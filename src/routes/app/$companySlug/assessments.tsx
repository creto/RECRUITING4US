import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

function Assessments() {
  const { companySlug } = Route.useParams();
  const tests = useAuthed(() => listAssessments({ data: { slug: companySlug } }), [companySlug]);
  const questions = useAuthed(() => listQuestions({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number][0]>("text");
  const [prompt, setPrompt] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [correct, setCorrect] = useState("a");
  const [expected, setExpected] = useState("");
  const [tolerance, setTolerance] = useState("0");
  const [points, setPoints] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(20);
  const [poolPick, setPoolPick] = useState("");

  if (tests.loading || tests.isPending) return <Loading />;

  const choice = type === "single" || type === "multi";
  const human = !choice && type !== "numeric";

  async function saveQuestion(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const options = choice
      ? [
          { id: "a", label: optA },
          { id: "b", label: optB },
        ]
      : [];
    const correctIds = type === "multi"
      ? correct.split(",").map((part) => part.trim()).filter(Boolean)
      : type === "single"
        ? [correct]
        : [];
    try {
      await createQuestion({
        data: {
          slug: companySlug,
          type,
          prompt,
          tags: "custom",
          points,
          options,
          correct: correctIds,
          expected: type === "numeric" ? expected : undefined,
          absTolerance: type === "numeric" ? tolerance : undefined,
          relTolerance: "0",
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
        <h2 className="text-2xl">Question bank</h2>
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
                  <span className="text-xs uppercase text-muted">{String(question.type)} · v{String(question.version_number)} · {String(question.points)} pt</span>
                  <p className="mt-1 whitespace-pre-wrap">{String(question.prompt).slice(0, 280)}</p>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <form className="mt-4 space-y-3" onSubmit={saveQuestion}>
          <h3 className="text-xl">New question</h3>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Prompt">
            <textarea className={`${inputClass} min-h-24 py-2`} value={prompt} onChange={(event) => setPrompt(event.target.value)} required minLength={3} />
          </Field>
          {choice ? (
            <>
              <Field label="Option A"><input className={inputClass} value={optA} onChange={(event) => setOptA(event.target.value)} required /></Field>
              <Field label="Option B"><input className={inputClass} value={optB} onChange={(event) => setOptB(event.target.value)} required /></Field>
              <Field label={type === "multi" ? "Correct option ids, comma separated" : "Correct option"}>
                {type === "single" ? (
                  <select className={inputClass} value={correct} onChange={(event) => setCorrect(event.target.value)}>
                    <option value="a">A</option>
                    <option value="b">B</option>
                  </select>
                ) : (
                  <input className={inputClass} value={correct} onChange={(event) => setCorrect(event.target.value)} placeholder="a, b" />
                )}
              </Field>
            </>
          ) : null}
          {type === "numeric" ? (
            <>
              <Field label="Expected value"><input className={inputClass} value={expected} onChange={(event) => setExpected(event.target.value)} required /></Field>
              <Field label="Absolute tolerance"><input className={inputClass} value={tolerance} onChange={(event) => setTolerance(event.target.value)} required /></Field>
            </>
          ) : null}
          {human ? <p className="text-sm text-muted">This answer is kept for human review. The application will not run it or invent a score.</p> : null}
          <Field label="Points">
            <input className={inputClass} type="number" min={1} max={100} value={points} onChange={(event) => setPoints(Number(event.target.value))} />
          </Field>
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
