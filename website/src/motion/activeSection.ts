import { useEffect, useSyncExternalStore } from "react";

/**
 * Which Dock destination is "current". Sections declare their Dock group via
 * data-dock="pipeline" etc.; the section crossing the viewport's middle band
 * wins. One IntersectionObserver for the page.
 */
let active = "inicio";
const listeners = new Set<() => void>();

export function useActiveSection() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => active,
    () => "inicio",
  );
}

export function useTrackSections(deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-dock]"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const next = (e.target as HTMLElement).dataset.dock ?? "inicio";
            if (next !== active) {
              active = next;
              listeners.forEach((l) => l());
            }
          }
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
