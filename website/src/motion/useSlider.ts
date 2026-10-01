import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Headless slider behaviour shared by every slider on the site; each slider
 * draws its own visuals. Supports:
 *   - drag (mouse, pen, touch) with velocity-aware release: a quick flick
 *     advances even if the drag distance is short
 *   - keyboard: ← → Home End on the focused region
 *   - explicit prev / next / goTo for buttons and tabs
 * The consumer renders `offset` (live drag px) and `index`; CSS springs the
 * snap (transition with --ease-spring), which reduced motion disables.
 */
export function useSlider(count: number, opts: { loop?: boolean; threshold?: number; onChange?: (i: number) => void } = {}) {
  const { loop = false, threshold = 0.18, onChange } = opts;
  const [index, setIndexState] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0, t: 0, lastX: 0, lastT: 0, v: 0, width: 1, active: false, locked: false as false | "x" | "y" });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const goTo = useCallback(
    (i: number) => {
      const next = loop ? (i + count) % count : Math.max(0, Math.min(count - 1, i));
      setIndexState(next);
      onChangeRef.current?.(next);
    },
    [count, loop],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-no-drag]")) return;
    const d = drag.current;
    d.x = d.lastX = e.clientX;
    d.y = e.clientY;
    d.t = d.lastT = performance.now();
    d.v = 0;
    d.width = e.currentTarget.getBoundingClientRect().width || 1;
    d.active = true;
    d.locked = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.locked === "x") {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (d.locked !== "x") return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = now;
    // Rubber-band at the ends.
    const atStart = !loop && index === 0 && dx > 0;
    const atEnd = !loop && index === count - 1 && dx < 0;
    setOffset(atStart || atEnd ? dx * 0.3 : dx);
  };

  const end = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.locked === "x") {
      const frac = offset / d.width;
      const flick = Math.abs(d.v) > 0.45;
      if (frac < -threshold || (flick && d.v < 0)) goTo(index + 1);
      else if (frac > threshold || (flick && d.v > 0)) goTo(index - 1);
    }
    setOffset(0);
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(count - 1);
    }
  };

  useEffect(() => {
    if (index > count - 1) setIndexState(Math.max(0, count - 1));
  }, [count, index]);

  return {
    index,
    offset,
    dragging,
    goTo,
    next,
    prev,
    canPrev: loop || index > 0,
    canNext: loop || index < count - 1,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onKeyDown },
  };
}
