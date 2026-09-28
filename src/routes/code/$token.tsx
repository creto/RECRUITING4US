import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getCodeExercise, runCode } from "@/server/talent.functions";
import { Alert, Button, Gate, Loading, useAuthed } from "@/components/talent/kit";
import { examPaper } from "@/components/talent/exam-shell";

export const Route = createFileRoute("/code/$token")({ component: CodeExercise });

function CodeExercise() {
  const { token } = Route.useParams();
  const state = useAuthed(() => getCodeExercise({ data: { token } }), [token]);
  const [source, setSource] = useState("");
  const [seen, setSeen] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  if (state.data && seen !== token) {
    setSeen(token);
    setSource(state.data.starter);
  }
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className={`${examPaper} min-h-screen bg-[#f4f7f5]`}>
        <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#4c6b16]">Coding exercise</p>
        <h1 className="mt-1 text-4xl text-[#17211c]">{state.data?.title ?? "Coding exercise"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#44574e]">{state.data?.note}</p>
        {state.loading ? <Loading /> : null}
        {state.error ? <Alert>{state.error}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
        <article className={`${examPaper} mt-6 overflow-hidden rounded-[28px] border border-[#d7e1da]`}>
          <div className="flex items-center justify-between border-b border-[#d7e1da] bg-[#f7faf8] px-5 py-3 text-xs text-[#44574e]">
            <span className="font-mono text-[#4c6b16]">solution.ts</span>
            <span>One file · network denied</span>
          </div>
          <div className="space-y-4 px-5 py-5">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[#17211c]">{state.data?.prompt}</p>
            <ul className="grid gap-2">
              {(state.data?.samples ?? []).map((sample: any) => (
                <li key={sample.name} className="rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-4 py-3 font-mono text-xs text-[#17211c]">
                  {sample.name}: {JSON.stringify(sample.args)}
                </li>
              ))}
            </ul>
            {state.data?.consentText ? <p className="text-sm">{state.data.consentText}</p> : null}
            {state.data?.accommodationText ? <p className="text-sm">{state.data.accommodationText}</p> : null}
            {state.data?.webcamRequested ? <p className="text-sm">A camera was requested by policy. This page does not capture snapshots. A camera flag would not prove cheating and would not reject you.</p> : null}
            {state.data?.consentText ? <label className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3 text-sm"><input type="checkbox" className="mt-1" checked={consented} onChange={(event) => setConsented(event.target.checked)} /> I have read the notice. I can refuse and ask for an accommodation. Refusal is not a rejection.</label> : null}
            <label className="block text-[11px] uppercase tracking-[0.16em] text-[#44574e]" htmlFor="source">Your function</label>
            <textarea id="source" className="min-h-80 w-full rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-4 py-4 font-mono text-sm leading-6 text-[#17211c] outline-none focus:border-[#4c6b16]" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="rounded-full border-[#d7e1da] bg-white text-[#17211c]" onClick={() => runCode({ data: { token, source, final: false, consented } }).then((row) => setResult(row.detail)).catch((err: Error) => setError(err.message))}>Run samples</Button>
              <Button type="button" className="rounded-full bg-[#cefa90] text-[#14221b]" onClick={() => runCode({ data: { token, source, final: true, consented } }).then((row) => setResult(`${row.detail} ${row.complexity.label} ${row.complexity.timeClass}`)).catch((err: Error) => setError(err.message))}>Submit</Button>
            </div>
            {result ? <p className="rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-4 py-3 text-sm text-[#17211c]" role="status">{result}</p> : null}
          </div>
        </article>
        <p className="mt-3 text-xs text-[#44574e]">Supported runtime: JavaScript on Node, one file, entry function named on the question. Network, files, and extra processes are denied. A judge failure is not a zero.</p>
        </div>
      </main>
    </Gate>
  );
}
