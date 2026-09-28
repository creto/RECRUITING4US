import { useEffect, useState } from "react";
import { ExamDesk, examPaper } from "@/components/talent/exam-shell";
import { ExamProctor } from "@/components/talent/proctor";
import type { SavedAnswer } from "@/domain/candidate-view";

export type AssessmentPreview = {
  id: string;
  name: string;
  description: string;
  status: string;
  durationSeconds: number;
  proctored: boolean;
  autoSend: boolean;
  instructions: string;
  sections: {
    title: string;
    poolPick: number | null;
    questions: {
      id: string;
      type: string;
      prompt: string;
      points: number;
      difficulty: string | null;
      options: { id: string; label: string }[];
    }[];
  }[];
};

export function ExamPreview({ exam, onClose }: { exam: AssessmentPreview; onClose: () => void }) {
  const drawn = exam.sections.flatMap((section) => {
    const take = section.poolPick && section.poolPick < section.questions.length
      ? section.questions.slice(0, section.poolPick)
      : section.questions;
    return take.map((question) => ({ ...question, section: section.title }));
  });
  const [index, setIndex] = useState(0);
  const [clockKey, setClockKey] = useState(0);
  const [left, setLeft] = useState(exam.durationSeconds);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setLeft(exam.durationSeconds);
    setIndex(0);
    setAnswers({});
    setFinished(false);
    const id = window.setInterval(() => {
      setLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [exam.id, exam.durationSeconds, clockKey]);

  if (finished) {
    return (
      <section className={`${examPaper} rounded-[28px] border border-[#d7e1da] p-6`}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#4c6b16]">Preview complete</p>
        <h2 className="mt-2 text-3xl text-[#17211c]">{exam.name}</h2>
        <p className="mt-3 max-w-xl text-sm text-[#44574e]">This was a recruiter preview. Nothing was saved to an application, and no score was calculated. A candidate cannot skip ahead until the current question is answered.</p>
        <div className="mt-5 flex gap-2">
          <button type="button" className="min-h-11 rounded-full bg-[#cefa90] px-5 text-sm font-medium text-[#14221b]" onClick={() => setClockKey((value) => value + 1)}>Run the preview again</button>
          <button type="button" className="min-h-11 rounded-full border border-[#d7e1da] bg-white px-5 text-sm text-[#17211c]" onClick={onClose}>Close</button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <ExamDesk
        kicker="Preview · not an application"
        title={exam.name}
        instructions={`${exam.instructions} ${exam.status} · ${exam.proctored ? "Proctored" : "Not proctored"} · automatic send ${exam.autoSend ? "on" : "off"}. Choices are required before Next. ${exam.description}`}
        items={drawn}
        index={index}
        answers={answers}
        secondsLeft={left}
        totalSeconds={exam.durationSeconds}
        closed={left <= 0}
        saveLabel={left <= 0 ? "Preview clock ended. Answers were not stored." : "Preview only. Nothing is submitted."}
        onSelect={setIndex}
        onAnswer={(answer) => {
          const item = drawn[index];
          if (!item || left <= 0) return;
          setAnswers((current) => ({ ...current, [item.id]: answer }));
        }}
        onSubmit={() => setFinished(true)}
        submitLabel="Finish preview"
        toolbar={(
          <div className="space-y-2">
            <button type="button" className="min-h-10 w-full rounded-full border border-line px-3 text-xs" onClick={() => setClockKey((value) => value + 1)}>Reset clock</button>
            <button type="button" className="min-h-10 w-full rounded-full border border-line px-3 text-xs" onClick={onClose}>Close preview</button>
          </div>
        )}
      />
      {exam.proctored ? <ExamProctor /> : null}
    </div>
  );
}
