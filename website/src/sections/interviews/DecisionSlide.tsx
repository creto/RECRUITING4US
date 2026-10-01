import { useLayoutEffect, useMemo, useRef } from "react";
import { useCopy } from "@/content/i18n";
import { useReducedMotion } from "@/lib/media";
import { decimal, rank, type Row } from "./demo";
import s from "./Decision.module.css";

/**
 * Step 4: the interview ranking. It orders submitted recommendations by
 * their average (ties share a place) and never moves anyone between stages.
 * A scorecard submitted on step 3 joins Valentina's row and can reorder it.
 */
export function DecisionSlide({ myRec }: { myRec: number | null }) {
  const t = useCopy();
  const c = t.interview;
  const b = c.board;
  const reduce = useReducedMotion();

  const ranked = useMemo(() => {
    const rows: Row[] = b.rows.map((r, i) => (i === 0 && myRec !== null ? { name: r.name, recs: [...r.recs, myRec], yours: true } : { name: r.name, recs: r.recs }));
    return rank(rows);
  }, [b.rows, myRec]);

  // FLIP: rows glide to their new place when the order changes.
  const refs = useRef(new Map<string, HTMLLIElement>());
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    refs.current.forEach((el, key) => {
      const top = el.getBoundingClientRect().top;
      next.set(key, top);
      const prev = tops.current.get(key);
      if (!reduce && prev !== undefined && Math.abs(prev - top) > 1 && el.offsetParent) {
        el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "none" }], { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      }
    });
    tops.current = next;
  }, [ranked, reduce]);

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <p className={s.title}>{c.ranking}</p>
        <p className={s.note}>{c.rankingNote}</p>
      </div>
      <ol className={s.list} role="list">
        {ranked.map((r) => (
          <li
            key={r.name}
            ref={(el) => {
              if (el) refs.current.set(r.name, el);
              else refs.current.delete(r.name);
            }}
            className={s.row}
            data-yours={r.yours ? "" : undefined}
          >
            <span className={s.place}>
              <span className="sr-only">{b.place} </span>
              {r.place}
            </span>
            <div className={s.who}>
              <p className={s.name}>
                {r.name}
                {r.tie && <span className={s.tie}>{b.tie}</span>}
              </p>
              <p className={s.stage}>
                <span className={s.pin} aria-hidden="true" />
                {b.stage}
              </p>
            </div>
            <ul className={s.recs} role="list" aria-label={`${r.recs.length} ${b.sent}`}>
              {r.recs.map((v, i) => (
                <li key={i} data-yours={r.yours && i === r.recs.length - 1 ? "" : undefined}>
                  {c.scale[v]}
                </li>
              ))}
            </ul>
            <div className={s.avg}>
              <span className={s.meter} aria-hidden="true">
                <i style={{ transform: `scaleX(${r.avg / 3})` }} />
                <b />
                <b />
              </span>
              <span className={s.value}>
                {b.average} {decimal(r.avg)} {b.outOf}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className={s.foot}>
        <p className={s.status} aria-live="polite" data-yours={myRec !== null ? "" : undefined}>
          {myRec !== null ? b.included : b.pending}
        </p>
        <div className={s.rules}>
          <p className={s.rulesTitle}>{b.rulesTitle}</p>
          <ol role="list">
            {b.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
