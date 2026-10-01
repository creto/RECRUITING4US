import { createStore } from "@/lib/store";

/** DOM → WebGL bridges for interactive sections. */
export const cvHighlight = createStore<boolean[]>([false, false, false, false, false, false]);
export const assessStep = createStore(0);
/** Sourcing flow progress 0..1 (scroll position, or the step a visitor picked). */
export const sourcingProgress = createStore(0);
