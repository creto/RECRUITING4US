import { useMemo, useState } from "react";
import { useCopy } from "@/content/i18n";
import { Link } from "@/ui/Link";
import { Check, CalendarPlus, Download } from "./glyphs";
import { demoWeek, longDay } from "./demo";
import s from "./Agenda.module.css";

const TAKEN = new Set([0, 3]);

/** Step 1: the candidate's compact slot picker. */
export function AgendaSlide() {
  const t = useCopy();
  const a = t.interview.agenda;
  const [chosen, setChosen] = useState<number | null>(null);
  const day = useMemo(() => longDay(demoWeek()[1]), []);

  return (
    <div className={s.wrap}>
      <div className={s.phone}>
        <p className={s.view}>{a.view}</p>
        <p className={s.company}>{t.offers.offer.company}</p>
        <p className={s.role}>
          {t.interview.card.kind}, {t.offers.offer.role}
        </p>
        <p className={s.day}>{day}</p>
        <ul className={s.slots} role="list" aria-label={t.schedule.pick}>
          {a.slots.map((time, i) => {
            const taken = TAKEN.has(i);
            const mine = chosen === i;
            return (
              <li key={time}>
                {taken ? (
                  <span className={s.slot} data-state="taken">
                    <span className="num">{time}</span>
                    <span className={s.state}>{a.taken}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={s.slot}
                    data-state={mine ? "mine" : "free"}
                    aria-pressed={mine}
                    onClick={() => setChosen(mine ? null : i)}
                  >
                    <span className="num">{time}</span>
                    <span className={s.state}>
                      {mine ? (
                        <>
                          <Check className={s.check} />
                          {a.chosen}
                        </>
                      ) : (
                        a.free
                      )}
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className={s.after} data-show={chosen !== null ? "" : undefined} aria-hidden={chosen === null}>
          <p className={s.afterText}>{a.after}</p>
          <p className={s.files}>
            <span>
              <Download /> {a.files[0]}
            </span>
            <span>
              <CalendarPlus /> {a.files[1]}
            </span>
          </p>
        </div>
      </div>
      <div className={s.aside}>
        <ol className={s.facts} role="list">
          {t.schedule.points.slice(0, 3).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <Link href="#agenda" className={s.more}>
          {a.more}
        </Link>
      </div>
    </div>
  );
}
