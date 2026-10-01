import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/media";
import s from "./CandidateTrace.module.css";

type Tip = { x: number; y: number; kind: number };
type Geo = { d: string; deco: string; strand: string; h: number; w: number; stops: { o: number; tone: string }[]; tips: Tip[] };
/** data-trace 1..5: invitation, submission, evidence, conversation, completion. */
const TONES = ["var(--stage-1)", "var(--stage-2)", "var(--stage-3)", "var(--stage-4)", "var(--stage-4)"];

/**
 * CANDIDATE TRACE: the site's signature motion primitive. One line follows
 * an applicant down the page. At each stage section ([data-trace="1..5"])
 * it steps out into a chevron (the mark's shape), takes that stage's colour
 * and changes meaning:
 *   1 invitation    careers, sourcing      open ring
 *   2 submission    pipeline, CV           filled square (the receipt)
 *   3 evidence      assessments, code      diamond; the line collects ticks
 *   4 conversation  interviews, schedule   two rings; a second strand joins
 *   5 completion    offer, portal          check
 * It draws itself as the page scrolls. Desktop runs in the gutter beside the
 * Dock; narrow screens get a thinner line with shallow chevrons and smaller
 * marks. Decorative (aria-hidden): each section says the same thing in text.
 */
export function CandidateTrace() {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  // Build geometry from real page layout.
  useEffect(() => {
    const main = document.getElementById("contenido");
    if (!main) return;
    let raf = 0;
    const build = () => {
      raf = 0;
      const mRect = main.getBoundingClientRect();
      const top0 = mRect.top + window.scrollY;
      const W = main.clientWidth;
      const H = main.scrollHeight;
      const wide = window.innerWidth >= 1100;
      const wrap = main.querySelector(".wrap");
      const contentLeft = wrap ? wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft) : 160;
      const x0 = wide ? Math.max(104, contentLeft - 58) : 7;
      const depth = wide ? 30 : 7;
      const half = wide ? 34 : 12;
      const anchors = Array.from(main.querySelectorAll<HTMLElement>("[data-trace]"));
      const hero = document.getElementById("inicio");
      const startY = hero ? hero.offsetHeight * 0.92 : 400;
      let d = `M${x0} ${startY}`;
      const tips: Tip[] = [];
      const stops: Geo["stops"] = [{ o: 0, tone: TONES[0] }];
      for (const a of anchors) {
        const tag = a.querySelector(".stage-tag") ?? a;
        const r = tag.getBoundingClientRect();
        const y = r.top + window.scrollY - top0 + r.height / 2;
        if (y < startY + half) continue;
        d += ` L${x0} ${y - half} L${x0 + depth} ${y} L${x0} ${y + half}`;
        const kind = Math.max(1, Math.min(5, Number(a.dataset.trace) || 1));
        tips.push({ x: x0 + depth, y, kind });
        stops.push({ o: y / H, tone: TONES[kind - 1] });
      }
      const endY = H - 40;
      d += ` L${x0} ${endY}`;
      stops.push({ o: 1, tone: TONES[4] });

      // Stage semantics along the straight runs between chevrons: evidence
      // collects ticks, conversation gains a second strand.
      let deco = "";
      let strand = "";
      const tick = wide ? 5 : 3;
      const gap = wide ? 6 : 4;
      tips.forEach((tp, i) => {
        const from = tp.y + half + 10;
        const to = (tips[i + 1]?.y ?? tp.y + 700) - half - 10;
        if (to <= from) return;
        if (tp.kind === 3) for (let y = from + 8; y < to; y += 24) deco += `M${x0 - tick} ${y.toFixed(1)}h${tick * 2}`;
        if (tp.kind === 4) strand += `M${x0 + gap} ${from.toFixed(1)}V${to.toFixed(1)}`;
      });
      setGeo({ d, deco, strand, h: H, w: W, stops, tips });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(build);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(main);
    window.addEventListener("resize", schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Draw with scroll: the head sits at 62% of the viewport.
  useEffect(() => {
    const path = pathRef.current;
    const svg = ref.current;
    if (!geo || !path || !svg) return;
    const len = path.getTotalLength();
    // y → length lookup (the path only moves downward)
    const step = 6;
    const ys: number[] = [];
    const ls: number[] = [];
    for (let l = 0; l <= len; l += step) {
      ys.push(path.getPointAtLength(l).y);
      ls.push(l);
    }
    const lengthAtY = (y: number) => {
      let lo = 0,
        hi = ys.length - 1;
      if (y <= ys[0]) return 0;
      if (y >= ys[hi]) return len;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < y) lo = mid;
        else hi = mid;
      }
      return ls[lo];
    };
    path.style.strokeDasharray = `${len}`;
    let raf = 0;
    const tips = Array.from(svg.querySelectorAll<SVGGElement>("[data-tip]"));
    const reveal = svg.querySelector<SVGRectElement>("[data-reveal]");
    const update = () => {
      raf = 0;
      const top = svg.getBoundingClientRect().top + window.scrollY;
      const headY = reduce ? geo.h : window.scrollY + window.innerHeight * 0.62 - top;
      const l = lengthAtY(headY);
      path.style.strokeDashoffset = `${len - l}`;
      const p = path.getPointAtLength(l);
      headRef.current?.setAttribute("cx", `${p.x}`);
      headRef.current?.setAttribute("cy", `${p.y}`);
      tips.forEach((t, i) => t.toggleAttribute("data-on", geo.tips[i].y <= headY));
      reveal?.setAttribute("height", `${Math.max(0, p.y)}`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [geo, reduce]);

  if (!geo) return null;
  return (
    <svg ref={ref} className={s.trace} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="trace-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={geo.h}>
          {geo.stops.map((st, i) => (
            <stop key={i} offset={st.o} style={{ stopColor: st.tone }} />
          ))}
        </linearGradient>
        <clipPath id="trace-reveal">
          <rect data-reveal x="0" y="0" width={geo.w} height="0" />
        </clipPath>
      </defs>
      <path d={geo.d} className={s.base} />
      <path ref={pathRef} d={geo.d} className={s.live} stroke="url(#trace-grad)" />
      <g clipPath="url(#trace-reveal)">
        {geo.deco && <path d={geo.deco} className={s.ticks} stroke="url(#trace-grad)" />}
        {geo.strand && <path d={geo.strand} className={s.strand} stroke="url(#trace-grad)" />}
      </g>
      {geo.tips.map((t, i) => (
        <g key={i} data-tip data-kind={t.kind} className={s.tip} transform={`translate(${t.x} ${t.y})`}>
          <TipGlyph kind={t.kind} />
        </g>
      ))}
      <circle ref={headRef} r={5} className={s.head} />
    </svg>
  );
}

/** Stop marks, centred on 0,0. Shapes carry the stage meaning, not only colour. */
function TipGlyph({ kind }: { kind: number }) {
  switch (kind) {
    case 2:
      return <rect x={-4} y={-4} width={8} height={8} rx={2} />;
    case 3:
      return <path d="M0 -5.5 L5.5 0 L0 5.5 L-5.5 0 Z" />;
    case 4:
      return (
        <>
          <circle cx={-2.5} r={3.6} />
          <circle cx={3} r={3.6} />
        </>
      );
    case 5:
      return (
        <>
          <circle r={6} />
          <path d="M-2.6 0.2 L-0.6 2.2 L2.8 -1.8" className={s.check} />
        </>
      );
    default:
      return <circle r={4.5} />;
  }
}
