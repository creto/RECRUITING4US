import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { importQuestionCatalog, inviteToCode, listCodingQuestions } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, refreshPage, useAuthed } from "@/components/talent/kit";
import { DifficultyBadge } from "@/components/talent/code-block";

export const Route = createFileRoute("/app/$companySlug/questions")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$companySlug/assessments", params: { companySlug: params.companySlug }, hash: "auto-scored-problems" });
  },
});

export function ScoredProblems({ companySlug }: { companySlug: string }) {
  const state = useAuthed(() => listCodingQuestions({ data: { slug: companySlug } }), [companySlug]);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const questions = state.data?.questions ?? [];
  return (
    <section id="auto-scored-problems" className="mt-10">
      <h2 className="text-2xl">Auto-scored problems</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">These are not the exam bank. You send one problem to one application. Hidden tests stay on the server and the runner scores the answer. A timeout is not stored as zero. JavaScript runs in a separate process. The version freezes when you send it.</p>
      {state.loading || state.isPending ? <div className="mt-3"><Loading /></div> : null}
      {state.error ? <div className="mt-3"><Alert>{state.error}</Alert></div> : null}
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
      <Button type="button" className="mt-4" onClick={() => importQuestionCatalog({ data: { slug: companySlug } }).then(() => refreshPage()).catch((err: Error) => setError(err.message))}>Import the {state.data?.catalog ?? 0} built-in questions</Button>
      <div className="mt-3">
        <Field label="Application to invite"><input className={inputClass} value={applicationId} onChange={(event) => setApplicationId(event.target.value)} /></Field>
      </div>
      {link ? <p className="mt-3 text-sm">Candidate path: /code/{link}</p> : null}
      {!(state.loading || state.isPending) && questions.length === 0 ? <Empty title="No questions yet" body="Import the catalog. Each question freezes its version when you send it." /> : null}
      <ul className="mt-4 space-y-2">
        {questions.map((question: { id: string; title: string; difficulty: string; status: string; skill_tags?: string }) => (
          <li key={question.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-line bg-white p-4 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
            <div className="min-w-0 space-y-2">
              <p className="font-brand text-xl text-[#17211c]">{question.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={question.difficulty} />
                <span className="rounded-full border border-line px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">{question.status}</span>
                {question.skill_tags ? <span className="text-xs text-muted">{question.skill_tags}</span> : null}
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => inviteToCode({ data: { slug: companySlug, applicationId, questionId: question.id } }).then((row) => setLink(row.token)).catch((err: Error) => setError(err.message))}>Send</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
