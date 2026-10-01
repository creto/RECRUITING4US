import { useSyncExternalStore } from "react";

function mediaStore(query: string) {
  const get = () => (typeof window === "undefined" ? false : window.matchMedia(query).matches);
  const sub = (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
  return { get, sub };
}

const reduced = mediaStore("(prefers-reduced-motion: reduce)");
const mobile = mediaStore("(max-width: 820px)");
const finePointer = mediaStore("(hover: hover) and (pointer: fine)");

export const prefersReducedMotion = reduced.get;
export const isMobileViewport = mobile.get;

export function useReducedMotion() {
  return useSyncExternalStore(reduced.sub, reduced.get, () => false);
}
export function useIsMobile() {
  return useSyncExternalStore(mobile.sub, mobile.get, () => false);
}
export function useFinePointer() {
  return useSyncExternalStore(finePointer.sub, finePointer.get, () => false);
}
