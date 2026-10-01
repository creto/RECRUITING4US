import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { useCopy } from "@/content/i18n";
import { useSlider } from "@/motion/useSlider";
import { ProductShot } from "@/ui/ProductShot";
import { SectionHead } from "@/ui/SectionHead";
import s from "./Tour.module.css";

type Screen = { name: string; caption: string };

function loads(src: string) {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Keep only captures that exist (both sizes ProductShot may request), so a
 * missing file never leaves a gap in the slider. Probing starts when the
 * section comes near the viewport. The stage's height is reserved in CSS,
 * so the result never shifts the page.
 */
function useAvailableScreens(all: Screen[], ref: RefObject<HTMLElement | null>) {
  const [screens, setScreens] = useState<Screen[] | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        Promise.all(all.map(async (sc) => ((await loads(`/product/${sc.name}-sm.webp`)) && (await loads(`/product/${sc.name}.webp`)) ? sc : null))).then((res) => {
          if (!cancelled) setScreens(res.filter((x): x is Screen => x !== null));
        });
      },
      { rootMargin: "120% 0px 120% 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [all, ref]);
  return screens;
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={s.chev}>
      <path d={dir === "next" ? "M6 3.5 10.5 8 6 12.5" : "M10 3.5 5.5 8 10 12.5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Quiet frame shown while probing, or if no capture is published yet. Same size as a slide. */
function Placeholder({ text, busy }: { text: string; busy: boolean }) {
  return (
    <div className={s.placeholder} role="status" aria-busy={busy || undefined}>
      <span className={s.phBar} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className={s.phBody}>
        <span className={busy ? "sr-only" : s.phText}>{text}</span>
      </span>
    </div>
  );
}

function Carousel({ screens, loading }: { screens: Screen[]; loading: boolean }) {
  const t = useCopy().tour;
  const n = screens.length;
  const slider = useSlider(n);
  const { index, offset, dragging } = slider;
  const firstSlide = useRef<HTMLDivElement>(null);
  const [slideW, setSlideW] = useState(900);
  const downX = useRef(0);

  useLayoutEffect(() => {
    const el = firstSlide.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSlideW(el.offsetWidth || 900));
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    downX.current = e.clientX;
    slider.handlers.onPointerDown(e);
  };
  const clickSlide = (i: number) => (e: MouseEvent) => {
    if (Math.abs(e.clientX - downX.current) > 8 || i === index) return;
    slider.goTo(i);
  };

  const active = screens[index];
  const pos = n ? index + 1 : 0;
  const ready = n > 0;

  return (
    <div className={s.carousel} role="region" aria-roledescription="carrusel" aria-label={t.label}>
      <div
        className={s.viewport}
        tabIndex={ready ? 0 : -1}
        data-cursor={ready ? "drag" : undefined}
        data-dragging={dragging ? "" : undefined}
        aria-describedby={ready ? "tour-hint" : undefined}
        {...(ready ? slider.handlers : {})}
        onPointerDown={ready ? onPointerDown : undefined}
      >
        {ready ? (
          <div className={s.track}>
            {screens.map((sc, i) => {
              const d = i - index + offset / Math.max(1, slideW);
              const ad = Math.abs(d);
              const far = ad > 2.6;
              const style = {
                "--x": d,
                "--ry": `${Math.max(-1, Math.min(1, d)) * -26}deg`,
                "--sc": 1 - Math.min(ad, 2) * 0.1,
                "--dim": Math.min(ad, 1.5) / 1.5,
                "--z": 10 - Math.round(ad),
              } as CSSProperties;
              const isActive = i === index;
              return (
                <div
                  key={sc.name}
                  ref={i === 0 ? firstSlide : undefined}
                  className={s.slide}
                  style={style}
                  data-active={isActive ? "" : undefined}
                  data-far={far ? "" : undefined}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${i + 1} ${t.of} ${n}`}
                  aria-hidden={isActive ? undefined : true}
                  inert={!isActive}
                  onClick={clickSlide(i)}
                >
                  <div className={s.shotWrap}>
                    {!far && <ProductShot name={sc.name} alt={sc.caption} eager={ad < 1.5} sizes="(min-width: 1100px) 900px, 88vw" className={s.shot} />}
                    <span className={s.shade} aria-hidden="true" />
                  </div>
                  <p className={s.caption}>{sc.caption}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={s.track}>
            <div className={s.slide} style={{ "--x": 0, "--ry": "0deg", "--sc": 1, "--dim": 0, "--z": 1 } as CSSProperties}>
              <Placeholder text={loading ? t.loading : t.empty} busy={loading} />
            </div>
          </div>
        )}
      </div>

      <div className={`wrap ${s.controls}`} data-hidden={ready ? undefined : ""} aria-hidden={ready ? undefined : true}>
        <div className={s.buttons}>
          <button type="button" className={`glass glass-press ${s.navBtn}`} onClick={slider.prev} disabled={!ready || !slider.canPrev} aria-label={t.prev}>
            <Chevron dir="prev" />
          </button>
          <button type="button" className={`glass glass-press ${s.navBtn}`} onClick={slider.next} disabled={!ready || !slider.canNext} aria-label={t.next}>
            <Chevron dir="next" />
          </button>
        </div>
        <p className={`num ${s.counter}`} aria-hidden="true">
          <strong>{pos}</strong> {t.of} {n}
        </p>
        <span className={s.progress} aria-hidden="true">
          <span style={{ ["--p" as string]: n > 1 ? index / (n - 1) : 1 }} />
        </span>
        <p id="tour-hint" className={`small ${s.hint}`}>
          {t.drag}
        </p>
        <p className="sr-only" aria-live="polite">
          {active ? `${t.slide} ${pos} ${t.of} ${n}. ${active.caption}` : ""}
        </p>
      </div>
    </div>
  );
}

export function Tour() {
  const t = useCopy().tour;
  const ref = useRef<HTMLElement>(null);
  const screens = useAvailableScreens(t.screens, ref);

  return (
    <section ref={ref} id="tour" data-dock="demo" className={`section ${s.tour}`} aria-labelledby="tour-title">
      <div className="wrap">
        <SectionHead id="tour-title" title={t.title} body={t.body} align="split" />
      </div>
      <Carousel screens={screens ?? []} loading={screens === null} />
    </section>
  );
}
