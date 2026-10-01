import { useSyncExternalStore } from "react";

/**
 * Theme store. A module-level store (not React context) so the same value is
 * readable from DOM components, the WebGL scenes (which render through a
 * portal into the shared canvas) and imperative GSAP code.
 *
 * The initial value is applied before first paint by the inline script in
 * index.html, which reads the same storage key. No flash.
 */
export type Theme = "light" | "dark";
export const THEME_KEY = "r4-theme";

type Listener = () => void;
const listeners = new Set<Listener>();

function readInitial(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.dataset.theme;
  return attr === "dark" ? "dark" : "light";
}

let current: Theme = readInitial();

export function getTheme(): Theme {
  return current;
}

function apply(next: Theme) {
  current = next;
  document.documentElement.dataset.theme = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#020d09" : "#f1f4ee");
  listeners.forEach((l) => l());
}

/**
 * Switch theme. When the View Transition API exists and motion is allowed,
 * the new theme is revealed as a circle growing from `origin` (the toggle),
 * so page, glass, WebGL clear colour and the Candidate Trace change together.
 */
export function setTheme(next: Theme, origin?: { x: number; y: number }) {
  if (next === current) return;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode: preference simply is not persisted */
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };
  if (!doc.startViewTransition || reduce || !origin) {
    apply(next);
    return;
  }
  const { x, y } = origin;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.documentElement.dataset.themeSwitching = "";
  const vt = doc.startViewTransition(() => apply(next));
  vt.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 620, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => undefined)
    .finally(() => {
      setTimeout(() => delete document.documentElement.dataset.themeSwitching, 700);
    });
}

export function subscribeTheme(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => "light");
}

/** Follow the OS preference until the visitor picks a theme explicitly. */
export function watchSystemTheme() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      /* ignore */
    }
    if (!stored) apply(mq.matches ? "dark" : "light");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
