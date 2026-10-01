import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { useReducedMotion } from "@/lib/media";
import { ScrollTrigger } from "@/motion/scroll";
import s from "./Pipeline.module.css";

type Card = { name: string; chips: string[] };
const LANES: Card[][] = [
  [
    { name: "Andrés M.", chips: ["CV recibido"] },
    { name: "Laura C.", chips: ["CV recibido"] },
    { name: "Tomás R.", chips: ["CV recibido", "Referido"] },
  ],
  [
    { name: "Julián P.", chips: ["CV revisado"] },
    { name: "Sara N.", chips: ["CV revisado", "Nota"] },
  ],
  [{ name: "Sofía L.", chips: ["Evaluación enviada"] }],
  [{ name: "Mateo G.", chips: ["2 de 3 scorecards"] }],
  [{ name: "Daniela V.", chips: ["Oferta enviada"] }],
];
const COUNTS = [14, 8, 5, 3, 1];
const FEATURED_CHIPS = [["CV recibido"], ["CV revisado", "SQL", "Python"], ["Evaluación enviada", "Comprobante"], ["Scorecards: 3 de 3"], ["Oferta en el portal"]];
const MOVES = [
  { who: "Laura Pérez", reason: "El CV menciona SQL y Python." },
  { who: "Laura Pérez", reason: "Pasa a la evaluación técnica." },
  { who: "Diego Ruiz", reason: "Evaluación revisada con la rúbrica." },
  { who: "Comité de contratación", reason: "Tres scorecards enviadas, recomendación a favor." },
];

/**
 * Talent pipeline as spatial stage lanes. One featured candidate advances
 * as the section scrolls, one discrete move at a time, and every move writes
 * an audit line with the person who made it and the reason. Storytelling
 * only: the product does not move candidates by itself.
 */
export function Pipeline() {
  const t = useCopy().pipeline;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [lane, setLane] = useState(reduce ? 2 : 0);

  useEffect(() => {
    if (reduce || !ref.current) return;
    const board = ref.current.querySelector("[data-board]");
    const st = ScrollTrigger.create({
      trigger: board,
      start: "top 75%",
      end: "bottom 35%",
      onUpdate: (self) => setLane(Math.min(4, Math.floor(self.progress * 5))),
    });
    return () => st.kill();
  }, [reduce]);

  return (
    <section id="pipeline" data-dock="pipeline" ref={ref} className={`section ${s.section}`} aria-labelledby="pipeline-title" data-trace="2">
      <div className="wrap">
        <SectionHead id="pipeline-title" tag={{ label: "Pipeline", tone: 2 }} title={t.title} body={t.body} align="split" />

        <div className={s.stageWrap}>
          <div className={s.board} data-board role="group" aria-label={`${t.title} ${t.demoNote}`}>
            {t.lanes.map((name, i) => (
              <div key={name} className={s.lane} data-reached={i <= lane || undefined}>
                <div className={s.laneHead}>
                  <span className={s.laneName}>{name}</span>
                  <span className={`num ${s.count}`}>{COUNTS[i] + (i === lane ? 1 : 0)}</span>
                </div>
                <ul role="list" className={s.cards}>
                  {i === lane && (
                    <li className={`${s.card} ${s.featured}`} key={`f-${lane}`}>
                      <span className={s.avatar} aria-hidden="true">
                        V
                      </span>
                      <span className={s.cardName}>Valentina R.</span>
                      <span className={s.chips}>
                        {FEATURED_CHIPS[lane].map((c) => (
                          <em key={c}>{c}</em>
                        ))}
                      </span>
                    </li>
                  )}
                  {LANES[i].map((c) => (
                    <li key={c.name} className={s.card}>
                      <span className={s.avatar} aria-hidden="true">
                        {c.name[0]}
                      </span>
                      <span className={s.cardName}>{c.name}</span>
                      <span className={s.chips}>
                        {c.chips.map((x) => (
                          <em key={x}>{x}</em>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <aside className={s.audit} aria-live="polite">
            <p className={s.auditTitle}>Registro de movimientos</p>
            <ol role="list" className={s.log}>
              {MOVES.slice(0, lane).map((m, i) => (
                <li key={i}>
                  <p>
                    <b>{m.who}</b> movió a Valentina R. a <b>{t.lanes[i + 1]}</b>.
                  </p>
                  <span>Motivo: {m.reason}</span>
                </li>
              ))}
              {lane === 0 && <li className={s.logEmpty}>Aún no hay movimientos. Desplázate para ver cómo avanza.</li>}
            </ol>
          </aside>
        </div>
        <p className="demo-note">{t.demoNote}</p>

        <blockquote className={s.rule}>
          <p>{t.rule}</p>
        </blockquote>

        <div className={s.lower}>
          <ul role="list" className={s.extras}>
            {t.extras.map((x) => (
              <li key={x.name}>
                <h3 className={s.extraName}>{x.name}</h3>
                <p>{x.text}</p>
              </li>
            ))}
          </ul>
          <div className={s.plans}>
            <div>
              <h3 className="h3">{t.planTitle}</h3>
              <p className="body">{t.planBody}</p>
            </div>
            <div>
              <h3 className="h3">{t.styleTitle}</h3>
              <p className="body">{t.styleBody}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
