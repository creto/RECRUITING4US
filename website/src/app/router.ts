import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "@/lib/media";
import { scrollToId, scrollToTop, ScrollTrigger } from "@/motion/scroll";

/**
 * Tiny history router: four public routes do not need a routing library.
 * Route changes run inside a View Transition (chevron wipe, see
 * src/theme/transitions.css) when available and motion is allowed.
 */
export const ROUTES = ["/", "/seguridad", "/integraciones", "/contacto"] as const;
export type RoutePath = (typeof ROUTES)[number] | "404";

const listeners = new Set<() => void>();

function normalise(pathname: string): RoutePath {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (ROUTES as readonly string[]).includes(p) ? (p as RoutePath) : "404";
}

let current: RoutePath = typeof window === "undefined" ? "/" : normalise(window.location.pathname);

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    current = normalise(window.location.pathname);
    emit();
  });
}

export function usePath(): RoutePath {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => "/",
  );
}

/** Navigate to "/path", "/path#id" or "#id". */
export function navigate(to: string) {
  const url = new URL(to, window.location.href);
  const nextPath = normalise(url.pathname);
  const hash = url.hash.slice(1);

  if (nextPath === current) {
    if (hash) {
      history.pushState(null, "", `${url.pathname}${url.hash}`);
      scrollToId(hash);
    } else {
      history.pushState(null, "", url.pathname);
      if (!scrollToId("inicio")) scrollToTop();
    }
    return;
  }

  const commit = () => {
    history.pushState(null, "", `${url.pathname}${url.hash}`);
    current = nextPath;
    flushSync(emit);
    if (hash) requestAnimationFrame(() => scrollToId(hash, true));
    else scrollToTop();
  };

  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (doc.startViewTransition && !prefersReducedMotion()) {
    document.documentElement.dataset.routeSwitching = "";
    const vt = doc.startViewTransition(commit);
    vt.finished.finally(() => {
      delete document.documentElement.dataset.routeSwitching;
      ScrollTrigger.refresh();
    });
  } else {
    commit();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}

export function isInternal(href: string) {
  return href.startsWith("/") || href.startsWith("#");
}
