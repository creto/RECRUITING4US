import { createStore } from "@/lib/store";

/**
 * Scene registry. Every <SceneSlot> registers here with its visibility.
 * The shared canvas renders only while at least one slot is near the
 * viewport (frameloop "never" otherwise), so a scrolled-past scene costs
 * nothing, and scenes also skip their own per-frame work when hidden.
 */
export type SlotState = {
  id: string;
  el: HTMLElement | null;
  visible: boolean;
  reduced: boolean;
};

const slots = new Map<string, SlotState>();
export const activeSlots = createStore(0);
export const stageMounted = createStore(false);

export function registerSlot(state: SlotState) {
  slots.set(state.id, state);
  return () => {
    slots.delete(state.id);
    recount();
  };
}

export function setSlotVisible(id: string, visible: boolean) {
  const s = slots.get(id);
  if (!s || s.visible === visible) return;
  s.visible = visible;
  recount();
}

function recount() {
  let n = 0;
  slots.forEach((s) => (n += s.visible ? 1 : 0));
  activeSlots.set(n);
}

/** Shared pointer, normalised to -1..1, read by scenes for parallax. */
export const pointer = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}
