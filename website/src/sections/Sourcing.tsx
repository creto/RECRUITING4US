import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { SceneSlot } from "@/three/SceneSlot";
import { sourcingProgress } from "@/three/stores";
import { useReducedMotion } from "@/lib/media";
import { clamp01, elementProgress } from "@/motion/progress";
import s from "./Sourcing.module.css";

/** Scene progress where each step is fully shown, and where the next one begins. */
const TARGETS = [0.06, 0.36, 0.62, 0.83, 1];
const BOUNDS = [0.16, 0.42, 0.64, 0.86];
const stepAt = (p: number) => BOUNDS.filter((b) => p >= b).length;

/**
 * Sourcing: people who have not applied yet. The shared canvas plays the
 * flow (prospects → pools → referral, or campaign through the consent gate →
 * application) as the band crosses the viewport. Not pinned: the page keeps
 * moving. The steps under the band are real buttons: picking one plays the
 * scene to that step until the visitor scrolls on.
 */
export function Sourcing() {
  const t = useCopy().sourcing;
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const override = useRef<{ p: number; y: number } | null>(null);
  const [active, setActive] = useState(reduce ? 4 : 0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const o = override.current;
      if (o && Math.abs(window.scrollY - o.y) > 140) override.current = null;
      const scroll = reduce ? 1 : clamp01((elementProgress(sceneRef.current) - 0.2) / 0.56);
      const p = override.current?.p ?? scroll;
      sourcingProgress.set(p);
      setActive(stepAt(p));
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
  }, [reduce]);

  const pick = (i: number) => {
    override.current = { p: TARGETS[i], y: window.scrollY };
    sourcingProgress.set(TARGETS[i]);
    setActive(i);
  };

  return (
    <section id="sourcing" data-dock="vacantes" className={`section ${s.section}`} aria-labelledby="sourcing-title" data-trace="1">
      <div className="wrap">
        <SectionHead id="sourcing-title" tag={{ label: "Sourcing", tone: 1 }} title={t.title} body={t.body} align="split" />

        <div ref={sceneRef} className={s.band}>
          <SceneSlot id="sourcing" className={s.scene} label={t.sceneLabel} fallback={<Fallback names={t.steps.map((x) => x.name)} />} />
        </div>

        <ol className={s.steps} aria-label={t.stepsLabel} style={{ ["--a" as string]: active }}>
          {t.steps.map((step, i) => (
            <li key={step.name} className={s.step} data-state={i === active ? "on" : i < active ? "past" : "next"} data-kind={i === 4 ? "application" : i === 3 ? "campaign" : undefined}>
              <button type="button" className={s.pick} onClick={() => pick(i)} aria-current={i === active ? "step" : undefined}>
                <span className={s.idx} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={s.name}>{step.name}</span>
                <span className="sr-only">. {t.pickStep}</span>
              </button>
              <p className={s.text}>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className={s.activeText} aria-hidden="true">
          {t.steps[active].text}
        </p>

        <div className={s.lower}>
          <div className={s.consent}>
            <h3 className="h3">{t.consentTitle}</h3>
            <p className="body">{t.consentBody}</p>
          </div>
          <p className={`small ${s.boards}`}>{t.boards}</p>
        </div>
      </div>
    </section>
  );
}

/** Static diagram when WebGL is unavailable: the same five steps, left to right. */
function Fallback({ names }: { names: string[] }) {
  return (
    <svg className={s.fallback} viewBox="0 0 1000 260" aria-hidden="true">
      <path d="M90 130 C 260 130 260 60 420 60 S 700 70 820 130" className={s.fbRoute} />
      <path d="M90 130 C 260 130 260 200 420 200 S 700 190 820 130" className={s.fbRoute} />
      <line x1="470" x2="470" y1="170" y2="230" className={s.fbGate} />
      {[90, 270, 470, 650, 880].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i === 2 ? 60 : i === 3 ? 200 : 130} r={i === 4 ? 0 : 9} className={s.fbNode} />
          <text x={x} y={i === 2 ? 34 : i === 3 ? 246 : 100} textAnchor="middle" className={s.fbText}>
            {names[i]}
          </text>
        </g>
      ))}
      <rect x="830" y="108" width="100" height="44" rx="10" className={s.fbCard} />
    </svg>
  );
}
