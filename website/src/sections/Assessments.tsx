import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { SceneSlot } from "@/three/SceneSlot";
import { assessStep } from "@/three/stores";
import { useSlider } from "@/motion/useSlider";
import { useReducedMotion } from "@/lib/media";
import { ScrollTrigger } from "@/motion/scroll";
import s from "./Assessments.module.css";

/**
 * Assessment story: Banco → Intento → Evidencia → Revisión. The slider (drag,
 * touch, keyboard, buttons) drives the 3D pool; scrolling through the section
 * advances it too until the visitor takes over.
 */
export function Assessments() {
  const t = useCopy().assess;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const touched = useRef(false);
  const slider = useSlider(t.steps.length, { onChange: (i) => assessStep.set(i) });
  const { goTo } = slider;

  useEffect(() => {
    if (reduce || !ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current.querySelector("[data-assess-stage]"),
      start: "top 60%",
      end: "bottom 45%",
      onUpdate: (self) => {
        if (!touched.current) goTo(Math.min(3, Math.floor(self.progress * 4)));
      },
    });
    return () => st.kill();
  }, [reduce, goTo]);

  useEffect(() => () => assessStep.set(0), []);

  const takeOver = () => {
    touched.current = true;
  };

  return (
    <section id="evaluaciones" data-dock="evaluaciones" ref={ref} className={`section ${s.section}`} aria-labelledby="eval-title" data-trace="3">
      <div className="wrap">
        <SectionHead id="eval-title" tag={{ label: "Evaluar", step: 4, tone: 3 }} title={t.title} body={t.body} align="split" />

        <div className={s.stage} data-assess-stage>
          <SceneSlot id="pool" className={s.scene} label={t.steps.map((x) => `${x.name}: ${x.text}`).join(" ")} />

          <div
            className={s.slider}
            role="region"
            aria-roledescription="carrusel"
            aria-label={t.title}
            tabIndex={0}
            data-cursor="drag"
            {...slider.handlers}
            onPointerDownCapture={takeOver}
            onKeyDownCapture={takeOver}
          >
            <div className={s.rail} aria-hidden="true">
              {t.steps.map((st, i) => (
                <span key={st.name} data-on={i <= slider.index || undefined} />
              ))}
            </div>
            <div className={s.viewport}>
              <div
                className={s.track}
                style={{ transform: `translateX(calc(${-slider.index * 100}% + ${slider.offset}px))` }}
                data-dragging={slider.dragging || undefined}
              >
                {t.steps.map((st, i) => (
                  <div key={st.name} className={s.card} role="group" aria-roledescription="paso" aria-label={`${i + 1} de ${t.steps.length}`} aria-hidden={i !== slider.index}>
                    <p className={s.num}>{String(i + 1).padStart(2, "0")}</p>
                    <h3 className={s.cardTitle}>{st.name}</h3>
                    <p className={s.cardText}>{st.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={s.controls}>
              <button type="button" className={`glass glass-press ${s.nav}`} onClick={() => { takeOver(); slider.prev(); }} disabled={!slider.canPrev} aria-label="Paso anterior">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className={s.tabs} role="tablist" aria-label="Pasos de la evaluación">
                {t.steps.map((st, i) => (
                  <button key={st.name} role="tab" type="button" aria-selected={i === slider.index} className={s.tab} onClick={() => { takeOver(); goTo(i); }}>
                    {st.name}
                  </button>
                ))}
              </div>
              <button type="button" className={`glass glass-press ${s.nav}`} onClick={() => { takeOver(); slider.next(); }} disabled={!slider.canNext} aria-label="Paso siguiente">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <p className="sr-only" aria-live="polite">
              {t.steps[slider.index].name}: {t.steps[slider.index].text}
            </p>
          </div>
        </div>

        <DeadlineDemo />
        <p className={`small ${s.noKeys}`}>{t.noKeys}</p>
      </div>
    </section>
  );
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Browser clock vs server deadline: editing the on-screen timer adds nothing. */
function DeadlineDemo() {
  const t = useCopy().assess;
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [skew, setSkew] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setNow(Date.now()), 1000);
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, []);

  const limit = 25 * 60;
  const elapsed = (now - started) / 1000;
  const server = limit - (elapsed % limit);
  const browser = server + skew;
  const deadline = new Date(started + limit * 1000);
  const hh = deadline.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div ref={ref} className={s.clock}>
      <h3 className="h3">{t.clockTitle}</h3>
      <div className={s.clocks}>
        <div className={s.clockCard} data-edited={skew > 0 || undefined}>
          <p className={s.clockLabel}>{t.clockBrowser}</p>
          <p className={`num ${s.clockValue}`}>{fmt(browser)}</p>
          <div className={s.clockActions}>
            <button type="button" className={`glass glass-press ${s.clockBtn}`} onClick={() => setSkew((x) => x + 600)}>
              {t.clockEdit}
            </button>
            {skew > 0 && (
              <button type="button" className={s.reset} onClick={() => setSkew(0)}>
                {t.clockReset}
              </button>
            )}
          </div>
        </div>
        <div className={`${s.clockCard} ${s.server}`}>
          <p className={s.clockLabel}>{t.clockServer}</p>
          <p className={`num ${s.clockValue}`}>{fmt(server)}</p>
          <p className="small">Cierra a las {hh}, hora del servidor.</p>
        </div>
      </div>
      <p className={s.clockNote} aria-live="polite">
        {skew > 0 ? t.clockNote : t.extendNote}
      </p>
    </div>
  );
}
