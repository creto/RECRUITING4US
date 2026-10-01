import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import { SceneSlot } from "@/three/SceneSlot";
import { pinnedProgress } from "@/motion/progress";
import s from "./Journey.module.css";

/**
 * Pinned storytelling (one of two pinned sections on the page). The section
 * is tall; its inner stage sticks to the viewport. Scroll progress picks the
 * stage: the stage names snap vertically on the left, the "records / decides"
 * pair updates, and the same 3D Candidate Trace advances on the right.
 * The full content is also rendered as an ordered list for screen readers.
 */
export function Journey() {
  const t = useCopy().journey;
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = t.stages.length;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = pinnedProgress(ref.current);
      setActive(Math.min(n - 1, Math.floor(p * n)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [n]);

  const stage = t.stages[active];

  return (
    <section id="recorrido" data-dock="inicio" ref={ref} className={s.section} style={{ ["--n" as string]: n }} aria-labelledby="recorrido-title">
      <div className={s.sticky}>
        <div className={`wrap ${s.grid}`}>
          <div className={s.copy}>
            <h2 id="recorrido-title" className={`h3 ${s.title}`}>
              {t.title}
            </h2>

            <div className={s.snapWindow} aria-hidden="true">
              <ol className={s.snap} style={{ ["--a" as string]: active }}>
                {t.stages.map((st, i) => (
                  <li key={st.name} data-state={i === active ? "on" : i < active ? "past" : "next"}>
                    {st.name}
                  </li>
                ))}
              </ol>
            </div>

            <div className={s.pair} aria-hidden="true" key={active}>
              <div className={s.records}>
                <p className={s.pairLabel}>{t.records}</p>
                <p className={s.pairText}>{stage.records}</p>
              </div>
              <div className={s.decides}>
                <p className={s.pairLabel}>{t.decides}</p>
                <p className={s.pairText}>{stage.decides}</p>
              </div>
            </div>

            <div className={s.progress} aria-hidden="true">
              {t.stages.map((st, i) => (
                <i key={st.name} data-on={i <= active || undefined} />
              ))}
              <span className="num">
                {t.progress} {active + 1}/{n}
              </span>
            </div>

            <ol className="sr-only">
              {t.stages.map((st) => (
                <li key={st.name}>
                  {st.name}. {t.records}: {st.records} {t.decides}: {st.decides}
                </li>
              ))}
            </ol>
          </div>
          <SceneSlot id="journey" className={s.scene} label={`${t.title} ${t.intro}`} />
        </div>
      </div>
    </section>
  );
}
