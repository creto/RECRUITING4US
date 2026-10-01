import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useCopy } from "@/content/i18n";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import { Lock } from "./glyphs";
import s from "./Scorecard.module.css";

/** Attributes 1 and 2 are this interview's focus; the others belong to other interviews. */
const FOCUS = new Set([1, 2]);
const NOTE_MIN = 8;

/**
 * Step 3, the centrepiece: a structured scorecard. Rate the focus
 * attributes, pick the overall recommendation on the four-step scale, write
 * the required note, submit. Submission locks the card and only then reveals
 * the two other interviewers' scorecards.
 */
export function ScorecardSlide({ onSubmitted }: { onSubmitted: (rec: number | null) => void }) {
  const t = useCopy();
  const c = t.interview;
  const k = c.card;
  const reduce = useReducedMotion();
  const uid = useId();

  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [overall, setOverall] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const overallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!locked) return;
    if (reduce) {
      setRevealed(true);
      return;
    }
    const id = window.setTimeout(() => setRevealed(true), 650);
    return () => window.clearTimeout(id);
  }, [locked, reduce]);

  const noteLen = note.trim().length;
  const overallError = overall === null ? c.needRating : "";
  const noteError = noteLen === 0 ? c.needNote : noteLen < NOTE_MIN ? k.noteMin : "";
  const showOverallError = tried && !!overallError;
  const showNoteError = tried && !!noteError;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setTried(true);
    if (overallError) {
      overallRef.current?.querySelector("input")?.focus();
      return;
    }
    if (noteError) {
      noteRef.current?.focus();
      return;
    }
    setLocked(true);
    setStatus(k.status.sent);
    onSubmitted(overall);
  };

  const reset = () => {
    setRatings({});
    setOverall(null);
    setNote("");
    setTried(false);
    setLocked(false);
    setRevealed(false);
    setStatus(k.status.reset);
    onSubmitted(null);
  };

  const ids = {
    head: `${uid}-head`,
    overall: `${uid}-overall`,
    note: `${uid}-note`,
    noteHelp: `${uid}-note-help`,
    others: `${uid}-others`,
  };

  return (
    <div className={s.board}>
      <form className={s.card} data-locked={locked ? "" : undefined} onSubmit={submit} noValidate aria-labelledby={ids.head}>
        <header className={s.head}>
          <div>
            <p id={ids.head} className={s.title}>
              {k.yours}
            </p>
            <p className={s.meta}>
              {k.candidate}, {k.kind.toLowerCase()}
            </p>
          </div>
          <span className={s.lock} data-locked={locked ? "" : undefined} aria-hidden="true">
            <Lock />
          </span>
        </header>

        <fieldset className={s.fields} disabled={locked}>
          <legend className="sr-only">{k.yours}</legend>

          <div className={s.dimension}>
            <p className={s.label}>{c.focus}</p>
            <ol className={s.axis} role="list">
              {c.attributes.map((attr, i) => {
                const focus = FOCUS.has(i);
                const val = ratings[i];
                return (
                  <li key={attr} className={s.attr} data-focus={focus ? "" : undefined}>
                    <span className={s.node} aria-hidden="true" />
                    <div className={s.attrName}>
                      <span>{attr}</span>
                      <span className={s.attrTag}>{focus ? k.inFocus : k.outFocus}</span>
                    </div>
                    {focus && (
                      <div className={s.rateRow}>
                        <div className={s.rating} role="radiogroup" aria-label={`${k.rate} ${attr}`}>
                          {c.scale.map((label, v) => (
                            <label key={label} className={s.rv} data-on={val !== undefined && v <= val ? "" : undefined} style={{ ["--d" as string]: `${v * 45}ms` }}>
                              <input
                                type="radio"
                                className="sr-only"
                                name={`${uid}-a${i}`}
                                value={v}
                                checked={val === v}
                                onChange={() => setRatings((r) => ({ ...r, [i]: v }))}
                              />
                              <i />
                              <span className="sr-only">{label}</span>
                            </label>
                          ))}
                        </div>
                        <span className={s.rvText} aria-hidden="true">
                          {val !== undefined ? c.scale[val] : ""}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            ref={overallRef}
            className={s.overall}
            role="radiogroup"
            aria-labelledby={ids.overall}
            aria-invalid={showOverallError || undefined}
            aria-describedby={showOverallError ? `${ids.overall}-err` : undefined}
          >
            <p id={ids.overall} className={s.label}>
              {c.overall}
            </p>
            <div className={s.scale}>
              {c.scale.map((label, v) => (
                <label key={label} className={s.pill} data-on={overall === v ? "" : undefined} style={{ ["--lv" as string]: v }}>
                  <input type="radio" className="sr-only" name={`${uid}-overall`} value={v} checked={overall === v} onChange={() => setOverall(v)} />
                  <span className={s.pillBars} aria-hidden="true">
                    {[0, 1, 2, 3].map((b) => (
                      <i key={b} data-on={b <= v ? "" : undefined} />
                    ))}
                  </span>
                  {label}
                </label>
              ))}
            </div>
            <p id={`${ids.overall}-err`} className={showOverallError ? s.error : s.reserve}>
              {showOverallError ? overallError : ""}
            </p>
          </div>

          <div className={s.noteField}>
            <label htmlFor={ids.note} className={s.label}>
              {c.noteLabel}
            </label>
            <textarea
              ref={noteRef}
              id={ids.note}
              className={s.note}
              rows={3}
              value={note}
              placeholder={c.notePlaceholder}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={showNoteError || undefined}
              aria-describedby={ids.noteHelp}
              required
              minLength={NOTE_MIN}
            />
            <p id={ids.noteHelp} className={showNoteError ? s.error : s.help}>
              {showNoteError ? noteError : k.noteMin}
              <span className={s.counter} aria-hidden="true" data-ok={noteLen >= NOTE_MIN ? "" : undefined}>
                {Math.min(noteLen, NOTE_MIN)}/{NOTE_MIN}
              </span>
            </p>
          </div>
        </fieldset>

        <footer className={s.foot}>
          {locked ? (
            <p className={s.sealed}>
              <Lock />
              <span>
                <strong>{c.locked}</strong>
                <span>{k.lockedHint}</span>
              </span>
            </p>
          ) : (
            <Button type="submit" className={s.submit}>
              {c.submit}
            </Button>
          )}
          <button type="button" className={s.reset} onClick={reset}>
            {c.reset}
          </button>
        </footer>
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </form>

      <section className={s.others} aria-labelledby={ids.others} data-revealed={revealed ? "" : undefined}>
        <p id={ids.others} className={s.othersTitle}>
          {revealed ? c.revealed : c.hiddenOthers}
        </p>
        <p className={s.othersHint}>{revealed ? k.lockedHint : c.hiddenHint}</p>
        <ol className={s.stack} role="list">
          {k.others.map((o, i) => (
            <li key={o.who} className={s.other} style={{ ["--i" as string]: i }}>
              <div className={s.flip}>
                <div className={`${s.face} ${s.front}`} aria-hidden={revealed || undefined}>
                  <span className={s.frontLock}>
                    <Lock />
                  </span>
                  <span className={s.redact} style={{ width: "58%" }} />
                  <span className={s.redact} style={{ width: "84%" }} />
                  <span className={s.redact} style={{ width: "40%" }} />
                  <span className={s.frontLabel}>{k.hiddenLabel}</span>
                </div>
                <div className={`${s.face} ${s.back}`} aria-hidden={!revealed || undefined}>
                  {revealed && (
                    <>
                      <p className={s.who}>
                        {o.who} <span>{o.kind}</span>
                      </p>
                      <p className={s.rec}>
                        <span className={s.pillBars} aria-hidden="true">
                          {[0, 1, 2, 3].map((b) => (
                            <i key={b} data-on={b <= o.rec ? "" : undefined} />
                          ))}
                        </span>
                        {c.scale[o.rec]}
                      </p>
                      <p className={s.otherNote}>{o.note}</p>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
