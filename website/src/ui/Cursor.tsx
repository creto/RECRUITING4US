import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/media";
import s from "./Cursor.module.css";

/**
 * Minimal cursor: a thin ring that trails the native pointer (the native
 * cursor stays visible). Over controls it tightens and fills slightly; over
 * draggable sliders it shows a horizontal grip. No trail, no blob, no glow.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fine || reduce) return;
    const el = ref.current!;
    let x = -100,
      y = -100,
      tx = -100,
      ty = -100,
      raf = 0;
    const loop = () => {
      x += (tx - x) * 0.28;
      y += (ty - y) * 0.28;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target as Element | null;
      const drag = target?.closest?.("[data-cursor='drag']");
      const hot = target?.closest?.("a,button,[role='button'],[role='tab'],[role='switch'],label,summary,input,select,textarea");
      el.dataset.mode = drag ? "drag" : hot ? "hot" : "";
    };
    const onLeave = () => (el.dataset.mode = "out");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduce]);

  if (!fine || reduce) return null;
  return (
    <div ref={ref} className={s.cursor} aria-hidden="true">
      <span className={s.ring} />
      <span className={s.grip}>
        <i />
        <i />
      </span>
    </div>
  );
}
