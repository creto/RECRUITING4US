import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useCopy } from "@/content/i18n";
import { useIsMobile } from "@/lib/media";
import { SectionHead } from "@/ui/SectionHead";
import { CalendarPlus, Check, Download } from "./interviews/glyphs";
import { SLOT_MINUTES, demoWeek, downloadIcs, googleCalendarUrl, longDay, shortDay, slotInstant } from "./interviews/demo";
import s from "./Schedule.module.css";

type Key = string; // "day-slot"
const key = (d: number, t: number): Key => `${d}-${t}`;
const parse = (k: Key) => k.split("-").map(Number) as [number, number];

/** Slots other candidates already hold in the demo week. */
const taken: ReadonlySet<Key> = new Set(["0-0", "0-3", "1-1", "2-2", "2-4", "3-0", "3-1", "4-3"]);

const endTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + SLOT_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Agenda: open slots the candidate picks, exclusive claims (a second
 * candidate cannot take the same slot), rescheduling, a real .ics download
 * and a Google Calendar template link, all on a synthetic week.
 */
export function Schedule() {
  const t = useCopy();
  const c = t.schedule;
  const mobile = useIsMobile();
  const uid = useId();

  const week = useMemo(() => demoWeek(), []);
  const [eventUid] = useState(() => `demo-${Math.random().toString(36).slice(2, 10)}@recruit4us.example`);
  const [mine, setMine] = useState<Key | null>(null);
  const [moving, setMoving] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [clash, setClash] = useState<{ key: Key; n: number } | null>(null);
  const [otherSaw, setOtherSaw] = useState(false);
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);
  const [day, setDay] = useState(1);
  const logId = useRef(0);

  const label = (k: Key) => {
    const [d, ti] = parse(k);
    return `${longDay(week[d])}, ${c.times[ti]}`;
  };
  const push = (text: string) => setLog((l) => [{ id: ++logId.current, text }, ...l].slice(0, 3));

  useEffect(() => {
    if (!clash) return;
    const id = window.setTimeout(() => setClash(null), 1100);
    return () => window.clearTimeout(id);
  }, [clash]);

  const pick = (k: Key) => {
    if (taken.has(k) || k === mine) return;
    setOtherSaw(false);
    if (mine && moving) {
      push(`${c.logMoved} ${label(mine)}.`);
      setSequence((n) => n + 1);
      setMoving(false);
    } else if (mine) {
      return;
    } else {
      push(`${c.logBooked} ${label(k)}.`);
    }
    setMine(k);
  };

  const simulate = () => {
    if (!mine) return;
    setClash((prev) => ({ key: mine, n: (prev?.n ?? 0) + 1 }));
    setOtherSaw(true);
    push(c.logCollision);
  };

  const reset = () => {
    setMine(null);
    setMoving(false);
    setSequence(0);
    setOtherSaw(false);
    setLog([]);
  };

  const event = useMemo(() => {
    if (!mine) return null;
    const [d, ti] = parse(mine);
    return {
      uid: eventUid,
      sequence,
      start: slotInstant(week[d], c.times[ti]),
      minutes: SLOT_MINUTES,
      title: c.eventTitle,
      details: c.eventDetails,
      location: c.eventLocation,
      when: `${longDay(week[d])}, ${c.times[ti]} ${c.to} ${endTime(c.times[ti])}`,
    };
  }, [mine, sequence, eventUid, week, c]);

  const range =
    week[0].getMonth() === week[4].getMonth() ? `${week[0].getDate()} ${c.rangeTo} ${shortDay(week[4])}` : `${shortDay(week[0])} ${c.rangeTo} ${shortDay(week[4])}`;

  const stateOf = (k: Key) => (k === mine ? "mine" : taken.has(k) ? "taken" : "free");
  const statusText = (k: Key) => {
    const st = stateOf(k);
    return st === "mine" ? c.yours : st === "taken" ? c.taken : c.free;
  };

  const renderSlot = (d: number, ti: number, row = false) => {
    const k = key(d, ti);
    const st = stateOf(k);
    const clashing = clash?.key === k;
    const aria = `${label(k)}, ${statusText(k)}`;
    const inner = (
      <>
        {row && <span className={`num ${s.rowTime}`}>{c.times[ti]}</span>}
        <span className={s.slotState}>
          {st === "mine" && <Check className={s.check} />}
          {st === "mine" ? (moving ? c.current : c.yours) : st === "taken" ? t.interview.agenda.taken : c.free}
        </span>
        {clashing && (
          <span key={clash.n} className={s.ghost} aria-hidden="true">
            {c.other}
          </span>
        )}
      </>
    );
    if (st === "taken") {
      return (
        <span className={s.slot} data-state="taken" data-row={row ? "" : undefined} role="img" aria-label={aria}>
          {inner}
        </span>
      );
    }
    return (
      <button
        type="button"
        className={s.slot}
        data-state={st}
        data-row={row ? "" : undefined}
        data-moving={moving ? "" : undefined}
        data-clash={clashing ? "" : undefined}
        aria-label={aria}
        aria-pressed={st === "mine"}
        aria-disabled={!!mine && !moving && st === "free" ? true : undefined}
        onClick={() => pick(k)}
      >
        {inner}
      </button>
    );
  };

  const onDayKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, number> = { ArrowRight: day + 1, ArrowLeft: day - 1, Home: 0, End: 4 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = (map[e.key] + 5) % 5;
    setDay(next);
    document.getElementById(`${uid}-day-${next}`)?.focus();
  };

  return (
    <section id="agenda" data-dock="entrevistas" className={`section ${s.section}`} aria-labelledby="agenda-title" data-trace="4">
      <div className={`wrap ${s.layout}`}>
        <div className={s.intro}>
          <SectionHead id="agenda-title" tag={{ label: "Entrevistar", step: 5, tone: 3 }} title={c.title} body={c.body} className={s.head} />
          <ul className={s.points} role="list">
            {c.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className={`small ${s.conditional}`}>{c.conditional}</p>
        </div>

        <div className={s.board}>
          <header className={s.boardHead}>
            <div>
              <p className={s.week}>{c.weekLabel}</p>
              <p className={s.range}>{range}</p>
            </div>
            <span className={s.tz}>{c.timezone}</span>
          </header>

          {mobile ? (
            <div className={s.mobile}>
              <div className={`glass ${s.days}`} role="tablist" aria-label={c.dayPicker}>
                {week.map((date, d) => (
                  <button
                    key={d}
                    id={`${uid}-day-${d}`}
                    type="button"
                    role="tab"
                    aria-selected={day === d}
                    aria-controls={`${uid}-daypanel`}
                    aria-label={longDay(date)}
                    tabIndex={day === d ? 0 : -1}
                    className={s.dayTab}
                    data-has={mine && parse(mine)[0] === d ? "" : undefined}
                    onClick={() => setDay(d)}
                    onKeyDown={onDayKey}
                  >
                    <span>{c.week[d]}</span>
                    <span className={`num ${s.dayNum}`}>{date.getDate()}</span>
                  </button>
                ))}
              </div>
              <div id={`${uid}-daypanel`} role="tabpanel" aria-labelledby={`${uid}-day-${day}`} className={s.dayPanel}>
                <p className={s.dayName}>{longDay(week[day])}</p>
                <ul className={s.rows} role="list" key={day}>
                  {c.times.map((_, ti) => (
                    <li key={ti} style={{ ["--k" as string]: ti }}>
                      {renderSlot(day, ti, true)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <table className={s.grid}>
              <caption className="sr-only">
                {c.weekLabel}, {range}, {c.timezone}
              </caption>
              <thead>
                <tr>
                  <td />
                  {week.map((date, d) => (
                    <th key={d} scope="col">
                      <span className={s.dow}>{c.week[d]}</span>
                      <span className={`num ${s.dom}`}>{date.getDate()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.times.map((time, ti) => (
                  <tr key={time}>
                    <th scope="row" className={`num ${s.time}`}>
                      {time}
                    </th>
                    {week.map((_, d) => (
                      <td key={d}>
                        {renderSlot(d, ti)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* The ticket is always laid out at full size; booking only fills it in. */}
          <div className={s.ticket} data-booked={event ? "" : undefined}>
            <div className={s.ticketHead}>
              <div className={s.ticketMain}>
                <p className={s.ticketLabel}>{c.ticket}</p>
                <p className={s.ticketTitle}>{c.eventTitle}</p>
                <p className={s.when} key={event?.when ?? "empty"}>
                  {event ? event.when : c.empty}
                  <span>{c.timezone}</span>
                </p>
              </div>
              <div className={s.actions}>
                <button type="button" className={`glass glass-press ${s.cta}`} onClick={() => event && downloadIcs(event)} disabled={!event}>
                  <Download />
                  {c.ics}
                </button>
                {event ? (
                  <a className={`glass glass-press ${s.cta}`} href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus />
                    {c.gcal}
                  </a>
                ) : (
                  <a className={`glass ${s.cta}`} aria-disabled="true" role="link">
                    <CalendarPlus />
                    {c.gcal}
                  </a>
                )}
              </div>
            </div>

            <div className={s.secondary}>
              <button
                type="button"
                className={s.quiet}
                onClick={() => {
                  setOtherSaw(false);
                  setMoving((m) => !m);
                }}
                aria-pressed={moving}
                disabled={!event}
              >
                {moving ? c.keep : c.reschedule}
              </button>
              <button type="button" className={s.quiet} onClick={simulate} disabled={!event || moving}>
                {c.simulate}
              </button>
              <button type="button" className={s.quiet} onClick={reset} disabled={!event && log.length === 0}>
                {c.reset}
              </button>
            </div>

            <div aria-live="polite" className={s.notice}>
              {otherSaw && event ? (
                <div className={s.other} key={clash?.n}>
                  <p className={s.otherLabel}>{c.otherSees}</p>
                  <p className={s.otherMsg}>{c.collision}</p>
                </div>
              ) : moving ? (
                <p className={s.moving}>{c.rescheduling}</p>
              ) : (
                <p className={s.seq}>{c.sequence}</p>
              )}
            </div>

            <div className={s.log}>
              <p className={s.logTitle}>{c.log}</p>
              <ol role="list">
                {log.length === 0 && <li className={s.logEmpty}>{c.logEmpty}</li>}
                {log.map((l) => (
                  <li key={l.id}>{l.text}</li>
                ))}
              </ol>
            </div>
          </div>

          <p className={`demo-note ${s.demo}`}>{c.demo}</p>
        </div>
      </div>
    </section>
  );
}
