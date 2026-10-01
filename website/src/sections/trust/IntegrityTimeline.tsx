import { useEffect, useId, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import s from "./IntegrityTimeline.module.css";

type Decision = "dismissed" | "confirmed" | null;

/**
 * Interactive integrity case. The first two steps have happened (attempt,
 * signal). The visitor opens the evidence, then decides as the human
 * reviewer would. Whatever they pick, the score stays exactly where it was:
 * a signal never changes the grade and never rejects anyone.
 */
export function IntegrityTimeline({ headingLevel = 3 }: { headingLevel?: 3 | 4 }) {
  const t = useCopy().trust;
  const id = useId();
  const [step, setStep] = useState(2); // index of the current step
  const [decision, setDecision] = useState<Decision>(null);
  const [announce, setAnnounce] = useState("");
  const focusNext = useRef<"decide" | "reset" | "open" | null>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const decideRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === "open") openRef.current?.focus();
    else if (target === "decide") decideRef.current?.focus();
    else if (target === "reset") resetRef.current?.focus();
  }, [step, decision]);

  const open = () => {
    focusNext.current = "decide";
    setStep(3);
    setAnnounce(t.opened);
  };
  const decide = (d: Exclude<Decision, null>) => {
    focusNext.current = "reset";
    setDecision(d);
    setStep(4);
    setAnnounce(d === "dismissed" ? t.dismissed : t.confirmed);
  };
  const reset = () => {
    focusNext.current = "open";
    setDecision(null);
    setStep(2);
    setAnnounce(t.pending);
  };

  const H = `h${headingLevel}` as "h3" | "h4";
  const stateOf = (i: number) => (i < step ? "done" : i === step ? "current" : "todo");
  const srState = { done: t.stepDone, current: t.stepCurrent, todo: t.stepTodo };

  return (
    <div className={s.root} data-step={step} data-decision={decision ?? "none"}>
      <H id={`${id}-title`} className={`h3 ${s.title}`}>
        {t.integrityTitle}
      </H>
      <p className={`body ${s.body}`}>{t.integrityBody}</p>

      <div className={s.track} role="group" aria-labelledby={`${id}-title`}>
        <ol className={s.steps} aria-label={t.timelineLabel} role="list">
          {t.timeline.map((label, i) => {
            const st = stateOf(i);
            return (
              <li key={label} className={s.step} data-state={st} data-signal={i === 1 ? "" : undefined} aria-current={st === "current" ? "step" : undefined}>
                <span className={s.node} aria-hidden="true" />
                <span className={s.label}>{label}</span>
                <span className="sr-only">, {srState[st]}</span>
              </li>
            );
          })}
        </ol>
        <span className={s.rail} aria-hidden="true">
          <span className={s.fill} style={{ ["--p" as string]: Math.min(step, 3) / 3 }} />
        </span>
      </div>

      <div className={s.case} data-open={step >= 3 ? "" : undefined}>
        <div className={s.caseHead}>
          <span className={s.signalDot} aria-hidden="true" />
          <p className={s.signal}>{t.signal}</p>
        </div>
        <p className={s.detail}>{t.signalDetail}</p>

        {/* Always laid out (so the case never changes height); sealed until opened. */}
        <div className={s.evidence} aria-hidden="true" data-sealed={step < 3 ? "" : undefined}>
            <span className={s.codeCol}>
              <i style={{ width: "72%" }} />
              <i style={{ width: "54%" }} data-hl="" />
              <i style={{ width: "80%" }} data-hl="" />
              <i style={{ width: "40%" }} />
            </span>
            <span className={s.codeCol}>
              <i style={{ width: "66%" }} />
              <i style={{ width: "54%" }} data-hl="" />
              <i style={{ width: "78%" }} data-hl="" />
              <i style={{ width: "58%" }} />
            </span>
        </div>

        <dl className={s.score}>
          <dt>{t.scoreLabel}</dt>
          <dd>
            <span className="num">{t.scoreValue}</span>
            {decision && <span className={s.unchanged}>{t.unchanged}</span>}
          </dd>
        </dl>

        <div className={s.actions}>
          {step === 2 && (
            <button ref={openRef} type="button" className={`glass glass-press ${s.action}`} onClick={open}>
              {t.open}
            </button>
          )}
          {step === 3 && (
            <>
              <button ref={decideRef} type="button" className={`glass glass-press ${s.action}`} onClick={() => decide("dismissed")}>
                {t.dismiss}
              </button>
              <button type="button" className={`glass glass-press ${s.action}`} onClick={() => decide("confirmed")}>
                {t.confirm}
              </button>
            </>
          )}
          {step === 4 && (
            <button ref={resetRef} type="button" className={`${s.action} ${s.reset}`} onClick={reset}>
              {t.reset}
            </button>
          )}
        </div>

        <p className={s.status} role="status" aria-live="polite">
          {announce || t.pending}
        </p>
      </div>
      <p className={`demo-note ${s.note}`}>{t.demo}</p>
    </div>
  );
}
