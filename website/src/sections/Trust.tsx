import { useEffect, useRef } from "react";
import { useCopy } from "@/content/i18n";
import { useReducedMotion } from "@/lib/media";
import { gsap } from "@/motion/scroll";
import { SceneSlot } from "@/three/SceneSlot";
import { Button } from "@/ui/Button";
import { SectionHead } from "@/ui/SectionHead";
import { IntegrityTimeline } from "./trust/IntegrityTimeline";
import { TrustFallback } from "./trust/TrustFallback";
import s from "./Trust.module.css";

const TONES = ["var(--stage-1)", "var(--stage-2)", "var(--stage-3)"];

/** How far each door reaches, drawn as a tiny volume: surface only, one record, everything. */
function Reach({ door }: { door: number }) {
  return (
    <svg className={s.reach} viewBox="0 0 40 30" aria-hidden="true" fill="none">
      <rect x="1.5" y="1.5" width="37" height="27" rx="5" stroke="var(--line-strong)" />
      {door === 0 && <rect x="8" y="0" width="14" height="4" rx="1.5" fill="var(--stage-1)" />}
      {door === 1 && (
        <>
          <circle cx="12" cy="11" r="1.6" fill="var(--line-strong)" />
          <circle cx="27" cy="20" r="1.6" fill="var(--line-strong)" />
          <circle cx="16" cy="21" r="1.6" fill="var(--line-strong)" />
          <circle cx="24" cy="12" r="3.2" fill="var(--stage-2)" />
        </>
      )}
      {door === 2 &&
        [
          [10, 9], [17, 12], [26, 9], [31, 15], [12, 19], [20, 21], [28, 22], [22, 15],
        ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.9" fill="var(--stage-3)" />)}
    </svg>
  );
}

export function Trust({ page = false }: { page?: boolean }) {
  const t = useCopy();
  const tr = t.trust;
  const reduced = useReducedMotion();
  const doorsRef = useRef<HTMLOListElement>(null);

  // The spine between the doors draws with scroll: one path, then the next.
  useEffect(() => {
    const el = doorsRef.current;
    if (!el) return;
    const spine = el.parentElement?.querySelector<HTMLElement>(`.${s.spine}`);
    if (!spine) return;
    if (reduced) {
      gsap.set(spine, { scaleY: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        spine,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: 0.6 } },
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="confianza" data-dock="confianza" className={`section ${s.trust} ${page ? s.onPage : ""}`} aria-labelledby="trust-title">
      <div className="wrap">
        <SectionHead id="trust-title" tag={page ? undefined : { label: "Confianza", tone: 2 }} title={tr.title} body={tr.body} align="split" />

        <div className={s.grid}>
          <div className={s.sceneCol}>
            <SceneSlot id="trust" label={tr.sceneLabel} className={s.scene} fallback={<TrustFallback className={s.fallback} />} />
          </div>

          <div className={s.content}>
            <div className={s.doorsWrap}>
              <h3 className={`h3 ${s.subhead}`}>{tr.doorsTitle}</h3>
              <div className={s.doorsBody}>
                <span className={s.spine} aria-hidden="true" />
                <ol ref={doorsRef} className={s.doors} role="list">
                  {tr.doors.map((d, i) => (
                    <li key={d.name} className={s.door} style={{ ["--tone" as string]: TONES[i] }}>
                      <span className={s.doorMark} aria-hidden="true" />
                      <div className={s.doorText}>
                        <h4 className={s.doorName}>{d.name}</h4>
                        <p className={s.doorBody}>{d.text}</p>
                      </div>
                      <Reach door={i} />
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className={s.pointsWrap}>
              <h3 className={`h3 ${s.subhead}`}>{tr.pointsTitle}</h3>
              <ul className={s.points} role="list">
                {tr.points.map((pt) => (
                  <li key={pt.name}>
                    <h4 className={s.pointName}>{pt.name}</h4>
                    <p className={s.pointBody}>{pt.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <IntegrityTimeline />

            <div className={s.foot}>
              {!page && (
                <Button href="/seguridad" variant="glass">
                  {tr.more}
                </Button>
              )}
              <p className={`small ${s.noCert}`}>{tr.noCert}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
