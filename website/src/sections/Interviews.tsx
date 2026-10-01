import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useCopy } from "@/content/i18n";
import { useFinePointer, useReducedMotion } from "@/lib/media";
import { useSlider } from "@/motion/useSlider";
import { SectionHead } from "@/ui/SectionHead";
import { AgendaSlide } from "./interviews/AgendaSlide";
import { RoomSlide } from "./interviews/RoomSlide";
import { ScorecardSlide } from "./interviews/ScorecardSlide";
import { DecisionSlide } from "./interviews/DecisionSlide";
import { ChevronLeft, ChevronRight } from "./interviews/glyphs";
import s from "./Interviews.module.css";

const STAGE = ["var(--stage-1)", "var(--stage-2)", "var(--stage-3)", "var(--stage-4)"];

/**
 * Entrevistas: one interview told in four steps (agenda, live room,
 * scorecard, decision) inside a context-specific slider. The scorecard the
 * visitor submits on step 3 feeds the ranking on step 4.
 */
export function Interviews() {
  const t = useCopy();
  const c = t.interview;
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const slider = useSlider(c.tabs.length);
  const { index, offset, dragging } = slider;
  const [myRec, setMyRec] = useState<number | null>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, [role='tab'], [role='radio'], [contenteditable='true']")) return;
    slider.handlers.onKeyDown(e);
  };

  const total = c.tabs.length;
  const illustrations: ReactNode[] = [
    <AgendaSlide key="a" />,
    <RoomSlide key="r" active={index === 1} />,
    <ScorecardSlide key="s" onSubmitted={setMyRec} />,
    <DecisionSlide key="d" myRec={myRec} />,
  ];

  const trackStyle: CSSProperties = {
    transform: `translate3d(calc(${-index * 100}% - ${index} * var(--gap) + ${offset}px), 0, 0)`,
    transition: dragging || reduce ? "none" : undefined,
  };

  return (
    <section id="entrevistas" data-dock="entrevistas" className={`section ${s.section}`} aria-labelledby="entrevistas-title" data-trace="4">
      <div className="wrap">
        <SectionHead
          id="entrevistas-title"
          tag={{ label: "Entrevistar", step: 5, tone: 3 }}
          title={c.title}
          body={c.body}
          align="split"
        />

        <div
          className={s.slider}
          role="region"
          aria-roledescription={c.slider.roledesc}
          aria-label={c.slider.label}
          onKeyDown={onKeyDown}
          style={{ ["--active" as string]: STAGE[index] }}
        >
          <div className={s.bar}>
            <div className={s.progress}>
              <ol className={s.chevrons} role="list">
                {c.tabs.map((tab, i) => (
                  <li key={tab.name}>
                    <button
                      type="button"
                      className={s.chev}
                      data-on={i <= index ? "" : undefined}
                      style={{ ["--c" as string]: STAGE[i] }}
                      aria-label={`${c.slider.goTo} ${tab.name}, ${i + 1} ${c.slider.of} ${total}`}
                      aria-current={i === index ? "step" : undefined}
                      onClick={() => slider.goTo(i)}
                    >
                      <i />
                    </button>
                  </li>
                ))}
              </ol>
              <p className={s.current} aria-hidden="true">
                <span key={index} className={s.currentName}>
                  {c.tabs[index].name}
                </span>
                <span className={s.count}>
                  {index + 1} {c.slider.of} {total}
                </span>
              </p>
            </div>
            <div className={s.arrows}>
              <button type="button" className={`glass glass-press ${s.arrow}`} onClick={slider.prev} disabled={!slider.canPrev} aria-label={c.slider.prev}>
                <ChevronLeft />
              </button>
              <button type="button" className={`glass glass-press ${s.arrow}`} onClick={slider.next} disabled={!slider.canNext} aria-label={c.slider.next}>
                <ChevronRight />
              </button>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {c.tabs[index].name}, {index + 1} {c.slider.of} {total}
          </p>

          <div
            className={s.viewport}
            data-cursor={fine ? "drag" : undefined}
            data-dragging={dragging ? "" : undefined}
            onPointerDown={slider.handlers.onPointerDown}
            onPointerMove={slider.handlers.onPointerMove}
            onPointerUp={slider.handlers.onPointerUp}
            onPointerCancel={slider.handlers.onPointerCancel}
          >
            <div className={s.track} style={trackStyle}>
              {c.tabs.map((tab, i) => (
                <div
                  key={tab.name}
                  className={s.slide}
                  role="group"
                  aria-roledescription={c.slider.slide}
                  aria-label={`${i + 1} ${c.slider.of} ${total}`}
                  data-active={i === index ? "" : undefined}
                  inert={i !== index}
                  style={{ ["--c" as string]: STAGE[i] }}
                >
                  <div className={s.copy}>
                    <p className={s.step}>
                      {c.slider.step} {i + 1}
                    </p>
                    <h3 className={`h3 ${s.name}`}>{tab.name}</h3>
                    <p className={`body ${s.text}`}>{tab.text}</p>
                  </div>
                  <div className={s.stage}>{illustrations[i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={s.foot}>
            <p className="demo-note">{c.demoNote}</p>
            <p className={`small ${s.hint}`}>{c.slider.hint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
