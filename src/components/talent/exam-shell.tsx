import { memo, useState, type ReactNode } from "react";
import { answerComplete, type SavedAnswer } from "@/domain/candidate-view";
import { ProblemPrompt } from "@/components/talent/code-block";
import {
  CODING_LANGUAGES,
  codingLanguage,
  entryNameFromPrompt,
  isStarterOrEmpty,
  starterForLanguage,
  type CodingLanguageId,
} from "@/domain/coding-languages";

export type ExamCard = {
  id: string;
  prompt: string;
  type: string;
  section: string;
  points: number;
  difficulty?: string | null;
  options: { id: string; label: string }[];
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Light sheet. Dark text stays readable even when the workspace theme is green on green. */
export const examPaper =
  "bg-white text-[#17211c] [--color-bg:#ffffff] [--color-surface:#f3f6f4] [--color-ink:#17211c] [--color-muted:#44574e] [--color-line:#d7e1da] [--color-accent:#cefa90] [--color-accent-ink:#14221b] [--color-lime:#cefa90] [--color-leaf:#cefa90] [--color-forest:#e8f6ee] [--color-warn:#8a4b00] [--color-danger:#9f1239]";

export function ExamDesk({
  kicker,
  title,
  instructions,
  items,
  index,
  answers,
  secondsLeft,
  totalSeconds,
  closed = false,
  saveLabel,
  notice,
  onSelect,
  onAnswer,
  onSubmit,
  submitLabel = "Submit",
  toolbar,
}: {
  kicker: string;
  title: string;
  instructions?: string;
  items: ExamCard[];
  index: number;
  answers: Record<string, SavedAnswer | undefined>;
  secondsLeft: number;
  totalSeconds: number;
  closed?: boolean;
  saveLabel?: string;
  notice?: string | null;
  onSelect: (index: number) => void;
  onAnswer: (answer: SavedAnswer) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  toolbar?: ReactNode;
}) {
  const [blocked, setBlocked] = useState<string | null>(null);
  const item = items[index];
  const answeredCount = items.filter((row) => answerComplete(row.type, answers[row.id])).length;
  const firstOpen = items.findIndex((row) => !answerComplete(row.type, answers[row.id]));
  const reachable = closed || firstOpen === -1 ? items.length - 1 : firstOpen;
  const currentDone = item ? answerComplete(item.type, answers[item.id]) : false;
  const progress = items.length ? Math.round((answeredCount / items.length) * 100) : 0;

  function go(next: number) {
    if (next < 0 || next >= items.length) return;
    if (!closed && next > reachable) {
      setBlocked("Answer this question before moving on. Blank questions are not a pass.");
      return;
    }
    setBlocked(null);
    onSelect(next);
  }

  function finish() {
    if (!closed && firstOpen !== -1) {
      setBlocked(`Answer every question before submitting. ${items.length - answeredCount} still open.`);
      onSelect(firstOpen);
      return;
    }
    setBlocked(null);
    onSubmit?.();
  }

  if (!item) {
    return <p className={`${examPaper} rounded-3xl border border-[#d7e1da] p-6 text-sm text-[#44574e]`}>This paper has no questions.</p>;
  }

  const answer = answers[item.id];

  return (
    <section className={`${examPaper} overflow-hidden rounded-[28px] border border-[#d7e1da] shadow-[0_16px_40px_rgba(23,33,28,0.06)]`}>
      <div className="h-1.5 bg-line" aria-hidden="true">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#4c6b16]">{kicker}</p>
          <h2 className="truncate text-2xl text-[#17211c] sm:text-3xl">{title}</h2>
        </div>
        <TimeRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      </div>
      <div className="grid gap-0 lg:grid-cols-[232px_1fr]">
        <aside className="border-t border-line px-4 py-4 lg:border-r lg:border-t-0">
          <p className="px-1 text-[11px] uppercase tracking-[0.18em] text-[#44574e]">{answeredCount} of {items.length} answered</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:grid lg:max-h-[28rem] lg:grid-cols-5 lg:overflow-y-auto" aria-label="Questions">
            {items.map((row, position) => {
              const done = answerComplete(row.type, answers[row.id]);
              const active = position === index;
              const locked = !closed && position > reachable;
              return (
                <button
                  key={row.id}
                  type="button"
                  disabled={locked}
                  aria-current={active ? "step" : undefined}
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl border text-sm ${
                    active
                      ? "border-[#cefa90] bg-[#cefa90] text-[#14221b]"
                      : done
                        ? "border-[#e4f6c4] bg-[#f4fbe6] text-[#4c6b16]"
                        : "border-[#d7e1da] bg-[#f3f6f4] text-[#44574e]"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                  onClick={() => go(position)}
                >
                  {done && !active ? "✓" : position + 1}
                </button>
              );
            })}
          </div>
          {toolbar ? <div className="mt-4">{toolbar}</div> : null}
        </aside>
        <div className="border-t border-line px-5 py-6 sm:px-8 lg:border-t-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#44574e]">
            <span className="rounded-full border border-[#d7e1da] bg-[#f7fbe9] px-2.5 py-1 text-[#4c6b16]">{item.section}</span>
            <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">{kindLabel(item.type)}</span>
            <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">{item.type === "likert" ? "No correct answer" : `${item.points} pt`}</span>
            <span className="ml-auto normal-case tracking-normal">{index + 1} / {items.length}</span>
          </div>
          <div className="mt-5">
            <ProblemPrompt
              prompt={item.prompt}
              difficulty={item.difficulty}
            />
          </div>
          <div className="mt-6">
            <AnswerSurface item={item} answer={answer} closed={closed} onAnswer={onAnswer} />
          </div>
          {blocked ? <p className="mt-4 rounded-2xl border border-[#e7d3a1] bg-[#fff8e8] px-4 py-3 text-sm text-[#6b4a00]" role="status">{blocked}</p> : null}
          {notice ? <p className="mt-4 text-sm text-[#9f1239]" role="alert">{notice}</p> : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#d7e1da] pt-4">
            <p className="text-xs text-[#44574e]" aria-live="polite">{saveLabel ?? (currentDone ? "Answered" : "Required before the next question")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-full border border-[#d7e1da] bg-white px-5 text-sm text-[#17211c] disabled:opacity-40" disabled={index === 0} onClick={() => go(index - 1)}>Previous</button>
              {index < items.length - 1 ? (
                <button type="button" className="min-h-11 rounded-full bg-[#cefa90] px-5 text-sm font-medium text-[#14221b] disabled:opacity-40" disabled={!closed && !currentDone} onClick={() => go(index + 1)}>Next</button>
              ) : (
                <button type="button" className="min-h-11 rounded-full bg-[#cefa90] px-5 text-sm font-medium text-[#14221b]" onClick={finish}>{submitLabel}</button>
              )}
            </div>
          </div>
          {index < items.length - 1 && onSubmit ? (
            <div className="mt-3 text-right">
              <button type="button" className="text-xs text-[#44574e] underline-offset-4 hover:underline" onClick={finish}>{submitLabel}</button>
            </div>
          ) : null}
        </div>
      </div>
      {instructions ? <p className="border-t border-[#d7e1da] bg-[#f7faf8] px-5 py-3 text-xs leading-relaxed text-[#44574e] sm:px-7">{instructions}</p> : null}
    </section>
  );
}

function AnswerSurface({
  item,
  answer,
  closed,
  onAnswer,
}: {
  item: ExamCard;
  answer: SavedAnswer | undefined;
  closed: boolean;
  onAnswer: (answer: SavedAnswer) => void;
}) {
  if (item.type === "likert" && item.options.length > 0) {
    return (
      <fieldset disabled={closed} className="grid gap-2 sm:grid-cols-5">
        <legend className="sr-only">How much do you agree</legend>
        {item.options.map((option) => {
          const selected = answer?.optionId === option.id;
          return (
            <label key={option.id} className={`flex min-h-24 cursor-pointer flex-col justify-between rounded-2xl border px-3 py-3 text-sm ${selected ? "border-[#cefa90] bg-[#cefa90] text-[#14221b]" : "border-[#d7e1da] bg-[#f7faf8] text-[#17211c] hover:border-[#cefa90]"}`}>
              <input className="sr-only" type="radio" name={item.id} checked={selected} onChange={() => onAnswer({ optionId: option.id })} />
              <span className={`text-[10px] uppercase tracking-[0.16em] ${selected ? "text-[#14221b]/70" : "text-[#44574e]"}`}>{shortScale(option.id)}</span>
              <span className="mt-3 font-medium leading-snug">{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    );
  }
  if ((item.type === "single" || item.type === "multi") && item.options.length > 0) {
    const selectedIds = item.type === "multi" ? answer?.optionIds ?? [] : [];
    return (
      <fieldset disabled={closed} className="space-y-3">
        <legend className="sr-only">{item.type === "multi" ? "Choose all that apply" : "Choose one"}</legend>
        {item.options.map((option, position) => {
          const selected = item.type === "multi" ? selectedIds.includes(option.id) : answer?.optionId === option.id;
          return (
            <label key={option.id} className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 ${selected ? "border-[#cefa90] bg-[#f4fbe6]" : "border-[#d7e1da] bg-[#f7faf8] hover:border-[#cefa90]"}`}>
              <input
                className="sr-only"
                type={item.type === "multi" ? "checkbox" : "radio"}
                name={item.id}
                checked={selected}
                onChange={() => {
                  if (item.type === "multi") {
                    const next = selectedIds.includes(option.id)
                      ? selectedIds.filter((id) => id !== option.id)
                      : [...selectedIds, option.id];
                    onAnswer({ optionIds: next });
                  } else {
                    onAnswer({ optionId: option.id });
                  }
                }}
              />
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl font-brand text-sm ${selected ? "bg-[#cefa90] text-[#14221b]" : "bg-white text-[#4c6b16]"}`}>
                {LETTERS[position] ?? position + 1}
              </span>
              <span className="pt-2 text-base leading-snug">{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    );
  }
  if (item.type === "single" || item.type === "multi" || item.type === "likert") {
    return <p className="rounded-2xl border border-[#e7d3a1] bg-[#fff8e8] px-4 py-3 text-sm text-[#6b4a00]">The choices for this question did not load. Refresh the page. It cannot be skipped.</p>;
  }
  if (item.type === "numeric") {
    return (
      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-[#44574e]">Your answer</span>
        <input
          disabled={closed}
          inputMode="decimal"
          className="mt-2 w-full rounded-2xl border border-[#d7e1da] bg-white px-4 py-5 text-center font-brand text-4xl tracking-wide text-[#17211c] outline-none focus:border-[#4c6b16]"
          value={answer?.value ?? ""}
          placeholder="0"
          aria-label="Your answer"
          onChange={(event) => onAnswer({ value: event.target.value })}
        />
      </label>
    );
  }
  if (item.type === "sql") {
    return (
      <label className="block overflow-hidden rounded-2xl border border-[#2a3530] bg-[#15201b]">
        <span className="flex items-center justify-between border-b border-[#2f3d36] bg-[#1b2822] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8fb59a]">
          query.sql
          <span className="normal-case tracking-normal text-[#6f8f7c]">Your answer</span>
        </span>
        <textarea
          disabled={closed}
          spellCheck={false}
          className="min-h-64 w-full resize-y bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-[#e8f0ea] outline-none"
          value={answer?.text ?? ""}
          onChange={(event) => onAnswer({ text: event.target.value })}
        />
      </label>
    );
  }
  if (item.type === "code") {
    return <CodeAnswerSurface item={item} answer={answer} closed={closed} onAnswer={onAnswer} />;
  }
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-[#44574e]">Response</span>
      <textarea
        disabled={closed}
        spellCheck
        className="mt-2 min-h-64 w-full rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-4 py-4 text-sm text-[#17211c] outline-none focus:border-[#4c6b16]"
        value={answer?.text ?? ""}
        onChange={(event) => onAnswer({ text: event.target.value })}
      />
    </label>
  );
}

export const TimeRing = memo(function TimeRing({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const left = Math.max(0, secondsLeft);
  const total = Math.max(left, totalSeconds, 1);
  const ratio = Math.min(1, left / total);
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const urgent = left > 0 && left <= 60;
  const label = left <= 0 ? "Ended" : formatClock(left);
  return (
    <div className="relative grid size-[72px] place-items-center" aria-live="polite">
      <svg width="72" height="72" viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#d7e1da" strokeWidth="4" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={urgent ? "#8a4b00" : "#cefa90"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${circ * ratio} ${circ}`}
        />
      </svg>
      <span className={`relative font-brand text-[11px] tabular-nums ${urgent ? "text-[#8a4b00]" : "text-[#17211c]"}`}>{label}</span>
      <span className="sr-only">{left <= 0 ? "Time is up" : `${label} remaining`}</span>
    </div>
  );
});

export function PersonalityCard({
  personality,
}: {
  personality: {
    code?: string | null;
    letters?: string | null;
    identity?: string | null;
    title: string;
    summary?: string;
    note: string;
    scales: { name: string; result: string }[];
  };
}) {
  return (
    <div className={`${examPaper} overflow-hidden rounded-[28px] border border-[#d7e1da]`}>
      <div className="bg-[#cefa90] px-6 py-6 text-[#14221b]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#14221b]/70">Preference summary</p>
        <p className="mt-1 font-brand text-6xl tracking-wide">{personality.letters ?? personality.code ?? "—"}</p>
        {personality.identity ? <p className="mt-1 text-sm">{personality.identity}</p> : null}
      </div>
      <div className="space-y-3 px-6 py-5 text-sm text-[#17211c]">
        <p>{personality.title}</p>
        {personality.summary ? <p className="text-[#44574e]">{personality.summary}</p> : null}
        <ul className="grid gap-2 sm:grid-cols-2">
          {personality.scales.map((scale) => (
            <li key={scale.name} className="rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-3 py-3">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-[#44574e]">{scale.name}</span>
              <span className="mt-1 block text-base text-[#17211c]">{scale.result}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#44574e]">{personality.note}</p>
      </div>
    </div>
  );
}

function CodeAnswerSurface({
  item,
  answer,
  closed,
  onAnswer,
}: {
  item: ExamCard;
  answer: SavedAnswer | undefined;
  closed: boolean;
  onAnswer: (answer: SavedAnswer) => void;
}) {
  const entry = entryNameFromPrompt(item.prompt);
  const languageId = codingLanguage(answer?.language).id;
  const meta = codingLanguage(languageId);

  function pickLanguage(nextId: CodingLanguageId) {
    if (nextId === languageId) return;
    const currentText = answer?.text ?? "";
    const dirty = !isStarterOrEmpty(currentText, languageId, entry);
    if (dirty) {
      const ok = window.confirm(
        `Replace your ${meta.label} answer with the ${codingLanguage(nextId).label} starter? Your current code will be lost.`,
      );
      if (!ok) return;
    }
    onAnswer({ text: starterForLanguage(nextId, entry), language: nextId });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a3530] bg-[#15201b]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2f3d36] bg-[#1b2822] px-3 py-1.5">
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8fb59a]">
          <span className="sr-only">Language</span>
          <select
            disabled={closed}
            aria-label="Programming language"
            className="rounded-md border border-[#2f3d36] bg-[#15201b] px-2 py-1 font-mono text-[11px] normal-case tracking-normal text-[#e8f0ea] outline-none disabled:opacity-50"
            value={languageId}
            onChange={(event) => pickLanguage(event.target.value as CodingLanguageId)}
          >
            {CODING_LANGUAGES.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label}
              </option>
            ))}
          </select>
        </label>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8fb59a]">{meta.filename}</span>
        <span className="ml-auto font-mono text-[10px] normal-case tracking-normal text-[#6f8f7c]">
          {meta.runnable ? "Sample run available" : "Submit as text · not executed"}
        </span>
        {!closed ? (
          <button
            type="button"
            className="rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#8fb59a] hover:bg-[#24332c] hover:text-[#e8f0ea]"
            onClick={() => {
              const currentText = answer?.text ?? "";
              const dirty = !isStarterOrEmpty(currentText, languageId, entry);
              if (dirty) {
                const ok = window.confirm("Replace your answer with the starter for this language?");
                if (!ok) return;
              }
              onAnswer({ text: starterForLanguage(languageId, entry), language: languageId });
            }}
          >
            Load starter
          </button>
        ) : null}
      </div>
      <textarea
        disabled={closed}
        spellCheck={false}
        aria-label={`${meta.label} solution`}
        className="min-h-64 w-full resize-y bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-[#e8f0ea] outline-none"
        value={answer?.text ?? ""}
        onChange={(event) => onAnswer({ text: event.target.value, language: languageId })}
      />
    </div>
  );
}

function kindLabel(type: string) {
  if (type === "single") return "Single choice";
  if (type === "multi") return "Multiple choice";
  if (type === "likert") return "Scale";
  if (type === "numeric") return "Numeric";
  if (type === "code") return "Code";
  if (type === "sql") return "SQL";
  return "Written";
}

function shortScale(id: string) {
  if (id === "agree") return "Yes";
  if (id === "slightly-agree") return "Lean yes";
  if (id === "middle") return "Middle";
  if (id === "slightly-disagree") return "Lean no";
  if (id === "disagree") return "No";
  return "Choice";
}

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}
