import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { ProductShot } from "@/ui/ProductShot";
import { useReducedMotion } from "@/lib/media";
import s from "./Portal.module.css";

/** The real export shape (exportMine in the app): { exportedAt, applications: [...] }. */
const SAMPLE = {
  exportedAt: "2026-10-05T14:02:11.000Z",
  applications: [{ jobTitle: "Analista de datos", companyName: "Northstar Labs", lifecycle: "ACTIVE", submittedAt: "2026-09-21T15:40:00.000Z" }],
};

/** Stage marks shared with the Candidate Trace: submission, evidence, conversation, completion. */
const MARK_KIND = [2, 2, 3, 4, 5];

/**
 * Candidate portal. A portrait portal with three views a visitor can switch
 * (enter with a one-time code, my journey, my data) plus the real screen.
 * Product truth: the code-unlocked /portal shows progress, assessments,
 * interviews, offers and messages for one employer; onboarding tasks and the
 * JSON download live in the signed-in candidate account, so the data view
 * says so.
 * The first time the section is in view, the code types itself and the
 * portal unlocks into "Mi recorrido" (skipped with reduced motion or once
 * the visitor picks a view). The download button saves a sample file with
 * the same structure as the product's export.
 */
export function Portal() {
  const t = useCopy().portal;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [tab, setTab] = useState(reduce ? 1 : 0);
  const [typed, setTyped] = useState(reduce ? t.enter.digits.length : 0);
  const touched = useRef(false);
  const views = [...t.tabs, t.realTab];

  // One orchestrated moment: type the code, then unlock.
  useEffect(() => {
    if (reduce || !ref.current) return;
    const timers: number[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || touched.current) return;
        io.disconnect();
        const n = t.enter.digits.length;
        for (let i = 1; i <= n; i++) timers.push(window.setTimeout(() => !touched.current && setTyped(i), 500 + i * 140));
        timers.push(window.setTimeout(() => !touched.current && setTab(1), 500 + n * 140 + 900));
      },
      { threshold: 0.45 },
    );
    io.observe(ref.current.querySelector("[data-device]") ?? ref.current);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [reduce, t.enter.digits.length]);

  const pick = (i: number) => {
    touched.current = true;
    setTyped(t.enter.digits.length);
    setTab(i);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -99, End: 99 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(views.length - 1, keys[e.key] === -99 ? 0 : keys[e.key] === 99 ? views.length - 1 : tab + keys[e.key]));
    pick(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(SAMPLE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t.data.file;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="portal" ref={ref} data-dock="ofertas" className={`section ${s.section}`} aria-labelledby="portal-title" data-trace="5">
      <div className="wrap">
        <SectionHead id="portal-title" tag={{ label: t.tag, tone: 4 }} title={t.title} body={t.body} align="split" />

        <div className={s.grid}>
          <div className={s.stage}>
            <div role="tablist" aria-label={t.tabsLabel} className={`glass ${s.tabs}`} onKeyDown={onKey}>
              {views.map((v, i) => (
                <button
                  key={v}
                  role="tab"
                  type="button"
                  id={`portal-tab-${i}`}
                  aria-selected={tab === i}
                  aria-controls="portal-view"
                  tabIndex={tab === i ? 0 : -1}
                  className={`glass-press ${s.tab}`}
                  onClick={() => pick(i)}
                >
                  {v}
                </button>
              ))}
              <span className={s.tabMark} style={{ ["--i" as string]: tab, ["--n" as string]: views.length }} aria-hidden="true" />
            </div>

            <div id="portal-view" role="tabpanel" aria-labelledby={`portal-tab-${tab}`} className={s.viewport}>
              {tab === 3 ? (
                <div className={s.real} key="real">
                  <ProductShot name="portal" alt={t.realAlt} sizes="(min-width: 1100px) 40vw, 100vw" />
                </div>
              ) : (
                <div className={s.device} data-device data-view={tab}>
                  <header className={s.deviceBar}>
                    <span className={s.brand}>
                      <span className={s.brandMark} aria-hidden="true">
                        N
                      </span>
                      {t.company}
                    </span>
                    <span className={s.portalName}>{t.portalName}</span>
                  </header>

                  <div className={s.screen} key={tab}>
                    {tab === 0 && <Enter t={t} typed={typed} onUnlock={() => pick(1)} />}
                    {tab === 1 && <Journey t={t} />}
                    {tab === 2 && <Data t={t} onDownload={download} />}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={s.side}>
            <div className={s.list} data-kind="sees">
              <h3 className={s.listTitle}>{t.seesTitle}</h3>
              <ul role="list">
                {t.sees.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className={s.list} data-kind="hidden">
              <h3 className={s.listTitle}>{t.hiddenTitle}</h3>
              <ul role="list">
                {t.hidden.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <p className={`small ${s.verified}`}>{t.verified}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

type T = ReturnType<typeof useCopy>["portal"];

function Enter({ t, typed, onUnlock }: { t: T; typed: number; onUnlock: () => void }) {
  const digits = t.enter.digits.split("");
  return (
    <div className={s.enter}>
      <p className={s.fieldLabel}>{t.enter.email}</p>
      <p className={s.field}>{t.enter.emailValue}</p>
      <p className={s.fieldLabel}>{t.enter.code}</p>
      <p className={s.code}>
        <span className="sr-only">{typed >= digits.length ? t.enter.digits.split("").join(" ") : ""}</span>
        {digits.map((d, i) => (
          <span key={i} data-on={i < typed || undefined} aria-hidden="true">
            {i < typed ? d : ""}
          </span>
        ))}
      </p>
      <p className={s.note}>{t.enter.note}</p>
      <button type="button" className={s.primary} onClick={onUnlock}>
        {t.enter.unlock}
      </button>
    </div>
  );
}

function Journey({ t }: { t: T }) {
  const j = t.journey;
  return (
    <div className={s.journey}>
      <article className={s.app}>
        <p className={s.appRole}>{j.role}</p>
        <p className={s.appMeta}>
          {t.company}. {j.submitted}
        </p>
        <ol className={s.track} aria-label={j.steps.join(", ")}>
          {j.steps.map((st, i) => (
            <li key={st} data-state={i < j.current ? "done" : i === j.current ? "now" : "next"}>
              <Mark kind={MARK_KIND[i]} />
              <span>{st}</span>
            </li>
          ))}
        </ol>
      </article>
      <div className={s.row}>
        <span className={s.rowIcon} aria-hidden="true">
          {j.exerciseTime}
        </span>
        <span>
          <b>{j.exercise}</b>
          <small>{j.exerciseHint}</small>
        </span>
      </div>
      <div className={s.mail}>
        <p className={s.mailFrom}>{j.message}</p>
        <p>{j.messageBody}</p>
        <span className={s.reply}>{j.reply}</span>
      </div>
    </div>
  );
}

function Data({ t, onDownload }: { t: T; onDownload: () => void }) {
  return (
    <div className={s.data}>
      <p className={s.account}>{t.data.account}</p>
      <p className={s.dataTitle}>{t.data.title}</p>
      <p className={s.dataBody}>{t.data.body}</p>
      <button type="button" className={s.primary} onClick={onDownload}>
        <svg viewBox="0 0 16 16" aria-hidden="true" className={s.dl}>
          <path d="M8 2v8m0 0 3.2-3.2M8 10 4.8 6.8M3 13h10" />
        </svg>
        {t.data.button}
      </button>
      <pre className={s.json}>
        <code>{JSON.stringify(SAMPLE, null, 2)}</code>
      </pre>
      <p className={s.note}>{t.data.caption}</p>
    </div>
  );
}

/** Same shapes as the Candidate Trace stop marks. */
function Mark({ kind }: { kind: number }) {
  return (
    <svg viewBox="-8 -8 16 16" className={s.mark} aria-hidden="true">
      {kind === 2 && <rect x={-4.5} y={-4.5} width={9} height={9} rx={2} />}
      {kind === 3 && <path d="M0 -6 L6 0 L0 6 L-6 0 Z" />}
      {kind === 4 && (
        <>
          <circle cx={-2.6} r={3.8} />
          <circle cx={3} r={3.8} />
        </>
      )}
      {kind === 5 && (
        <>
          <circle r={6.2} />
          <path d="M-2.7 0.2 L-0.6 2.3 L2.9 -1.9" className={s.check} />
        </>
      )}
    </svg>
  );
}
