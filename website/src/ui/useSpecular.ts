import { useEffect, type RefObject } from "react";

/**
 * Pointer-responsive specular light for Liquid Glass surfaces. Writes
 * --gx / --gy (highlight position) and --ga (border-reflection angle) on the
 * element; glass.css turns them into light. Fine pointers only, rAF-batched.
 */
export function useSpecular(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--gx", `${x.toFixed(1)}%`);
        el.style.setProperty("--gy", `${y.toFixed(1)}%`);
        const a = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90;
        el.style.setProperty("--ga", a.toFixed(0));
      });
    };
    const onLeave = () => {
      el.style.removeProperty("--gx");
      el.style.removeProperty("--gy");
      el.style.removeProperty("--ga");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref]);
}
