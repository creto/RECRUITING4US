import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/media";
import { registerSlot, setSlotVisible, type SlotState } from "./registry";
import { webglSupported } from "./quality";
import type { SceneId } from "./scenes";

const ViewSlot = lazy(() => import("./ViewSlot"));

type Props = {
  id: SceneId;
  label: string;
  className?: string;
  /** Rendered instead of the scene when WebGL is unavailable. */
  fallback?: ReactNode;
  /** DOM overlay above the scene (labels, captions). */
  children?: ReactNode;
};

/**
 * A rectangle on the page that the shared canvas draws a scene into. The
 * scene module is only fetched when the slot first comes near the viewport.
 * Every scene is described by `label` and by real text elsewhere in its
 * section: no information lives only in WebGL.
 */
export function SceneSlot({ id, label, className, fallback, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [near, setNear] = useState(false);
  const [gl, setGl] = useState(true);
  const state = useRef<SlotState>({ id, el: null, visible: false, reduced });
  state.current.reduced = reduced;

  useEffect(() => {
    setGl(webglSupported());
    const el = ref.current!;
    state.current.el = el;
    const unregister = registerSlot(state.current);
    const io = new IntersectionObserver(
      ([e]) => {
        setSlotVisible(id, e.isIntersecting);
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unregister();
    };
  }, [id]);

  return (
    <div ref={ref} className={className} role="img" aria-label={label} data-scene={id}>
      {gl ? (
        near && (
          <Suspense fallback={null}>
            <ViewSlot id={id} slot={state.current} />
          </Suspense>
        )
      ) : (
        fallback
      )}
      {children}
    </div>
  );
}
