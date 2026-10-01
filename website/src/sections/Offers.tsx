import { useCallback, useEffect, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import { useIsMobile, useReducedMotion } from "@/lib/media";
import { gsap, ScrollTrigger } from "@/motion/scroll";
import { SectionHead } from "@/ui/SectionHead";
import { Button } from "@/ui/Button";
import { Check } from "./interviews/glyphs";
import s from "./Offers.module.css";

const STAGE = ["var(--stage-1)", "var(--stage-2)", "var(--stage-3)", "var(--stage-4)"];
/** Pinned-scroll progress at which the offer accepts itself, then each task checks. */
const ACCEPT_AT = 0.18;
const TASK_AT = [0.36, 0.5, 0.64, 0.78];

/**
 * Ofertas: the candidate portal shows the offer; accepting it unfolds the
 * onboarding checklist from the offer itself. Scrolling through the pinned
 * stage plays the same story (when motion is allowed); the button and the
 * checkboxes are always there to do it by hand.
 */
export function Offers() {
  const t = useCopy();
  const o = t.offers;
  const reduce = useReducedMotion();
  const mobile = useIsMobile();

  const [accepted, setAccepted] = useState(false);
  const [done, setDone] = useState<boolean[]>(() => o.tasks.map(() => false));
  const [live, setLive] = useState("");

  const runway = useRef<HTMLDivElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const doc = useRef<HTMLElement>(null);
  const hinge = useRef<HTMLDivElement>(null);
  const acceptedRef = useRef(accepted);
  acceptedRef.current = accepted;

  const accept = useCallback(() => {
    if (acceptedRef.current) return;
    acceptedRef.current = true;
    setAccepted(true);
    setLive(o.live);
  }, [o.live]);

  const setTask = (i: number, v: boolean) => setDone((d) => d.map((x, j) => (j === i ? v : x)));

  const reset = () => {
    setAccepted(false);
    setDone(o.tasks.map(() => false));
    setLive("");
  };

  // Scroll: the portal settles from a tilt, then (motion allowed) crossing
  // thresholds inside the pinned runway accepts the offer and checks tasks.
  useEffect(() => {
    const el = runway.current;
    const frame = portal.current;
    if (!el || !frame || reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        frame,
        { rotateX: mobile ? 14 : 20, rotateZ: mobile ? 0 : -1.5, y: 70, scale: 0.94 },
        {
          rotateX: 0,
          rotateZ: 0,
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 85%", end: "top top", scrub: 0.6 },
        },
      );
      const fire = (thresholds: number[]) => {
        let last = 0;
        // Task thresholds only count progress made after the offer is accepted.
        let lastTask = Infinity;
        return (p: number) => {
          if (last < thresholds[0] && p >= thresholds[0]) accept();
          last = p;
          if (!acceptedRef.current) return;
          if (lastTask === Infinity) lastTask = Math.min(p, thresholds[0]);
          thresholds.slice(1).forEach((at, i) => {
            if (lastTask < at && p >= at) setDone((d) => d.map((x, j) => (j === i ? true : x)));
          });
          lastTask = p;
        };
      };
      if (!mobile) {
        // Pinned runway: one progress value drives the whole story.
        const step = fire([ACCEPT_AT, ...TASK_AT]);
        ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (st) => step(st.progress) });
      } else {
        // Mobile, no pin: accept when the offer has been read, then check each
        // task as the unfolded list rises through the viewport.
        const docEl = doc.current;
        const hingeEl = hinge.current;
        if (docEl) ScrollTrigger.create({ trigger: docEl, start: "bottom 70%", onEnter: accept });
        if (hingeEl) {
          const step = fire([-1, 0.2, 0.4, 0.6, 0.8]);
          ScrollTrigger.create({ trigger: hingeEl, start: "top 80%", end: "bottom 45%", onUpdate: (st) => step(st.progress) });
        }
      }
    }, el);
    return () => ctx.revert();
  }, [reduce, mobile, accept]);

  const doneCount = done.filter(Boolean).length;
  const reached = [true, accepted, accepted, accepted && doneCount === o.tasks.length];

  return (
    <section id="ofertas" data-dock="ofertas" className={`section ${s.section}`} aria-labelledby="ofertas-title" data-trace="5">
      <div className="wrap">
        <SectionHead id="ofertas-title" tag={{ label: "Ofertar e incorporar", step: 7, tone: 4 }} title={o.title} body={o.body} align="split" />
      </div>

      <div ref={runway} className={s.runway} data-static={reduce ? "" : undefined}>
        <div className={s.stick}>
          <div className={`wrap ${s.stage}`}>
            <ol className={s.steps} role="list" aria-label={o.progress}>
              {o.steps.map((st, i) => (
                <li key={st} data-on={reached[i] ? "" : undefined} style={{ ["--c" as string]: STAGE[i] }}>
                  <i aria-hidden="true" />
                  <span>{st}</span>
                  {reached[i] && <span className="sr-only">, {o.done.toLowerCase()}</span>}
                </li>
              ))}
            </ol>

            <div className={s.scene}>
              <div ref={portal} className={s.portal} data-accepted={accepted ? "" : undefined}>
                <header className={s.bar}>
                  <p className={s.portalName}>{o.portal}</p>
                  <p className={s.portalWho}>
                    {o.candidate}
                    <span className={s.avatar} aria-hidden="true">
                      {o.candidate.charAt(0)}
                    </span>
                  </p>
                </header>

                <div className={s.papers}>
                  <article ref={doc} className={s.doc} aria-labelledby="oferta-role">
                    <div className={s.docTop}>
                      <span className={s.chip}>{o.offer.label}</span>
                      <span className={s.rev}>{o.revision}</span>
                    </div>
                    <h3 id="oferta-role" className={s.role}>
                      {o.offer.role}
                    </h3>
                    <p className={s.company}>{o.offer.company}</p>
                    <p className={s.message}>{o.message}</p>
                    <dl className={s.terms}>
                      {o.offer.terms.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className={s.respond}>
                      {accepted ? (
                        <div className={s.acceptedBox}>
                          <p className={s.acceptedPill}>
                            <Check className={s.acceptedCheck} />
                            {o.offer.accepted}
                          </p>
                          <p className={s.response}>{o.response}</p>
                        </div>
                      ) : (
                        <Button onClick={accept} className={s.accept}>
                          {o.offer.accept}
                        </Button>
                      )}
                    </div>
                  </article>

                  <div ref={hinge} className={s.hinge}>
                    {!accepted && <p className={s.hint}>{reduce ? o.hintStatic : o.hint}</p>}
                    <section className={s.fold} data-open={accepted ? "" : undefined} aria-labelledby="oferta-tasks" inert={!accepted}>
                      <div className={s.foldHead}>
                        <h3 id="oferta-tasks" className={s.foldTitle}>
                          {o.tasksTitle}
                        </h3>
                        <p className={s.template}>{o.template}</p>
                        <p className={s.count}>
                          <span className="num">
                            {doneCount} {o.of} {o.tasks.length}
                          </span>{" "}
                          {o.doneCount}
                          <span className={s.countBar} aria-hidden="true">
                            <i style={{ transform: `scaleX(${doneCount / o.tasks.length})` }} />
                          </span>
                        </p>
                      </div>
                      <ul className={s.tasks} role="list">
                        {o.tasks.map((task, i) => (
                          <li key={task} style={{ ["--k" as string]: i }} data-done={done[i] ? "" : undefined}>
                            <label className={s.task}>
                              <input type="checkbox" className="sr-only" checked={done[i]} onChange={(e) => setTask(i, e.target.checked)} />
                              <span className={s.box} aria-hidden="true">
                                <Check className={s.boxCheck} />
                              </span>
                              <span className={s.taskText}>
                                <span className={s.taskName}>{task}</span>
                                <span className={s.owner}>
                                  {o.owners[i]}, {done[i] ? o.done.toLowerCase() : o.open.toLowerCase()}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      <button type="button" className={s.reset} onClick={reset}>
                        {o.reset}
                      </button>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {live}
      </p>

      <div className={`wrap ${s.after}`}>
        <ul className={s.notes} role="list">
          {o.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="demo-note">{o.demo}</p>
      </div>
    </section>
  );
}
