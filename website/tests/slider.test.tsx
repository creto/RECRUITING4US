import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useSlider } from "@/motion/useSlider";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Slider({ count, loop }: { count: number; loop: boolean }) {
  const s = useSlider(count, { loop });
  return (
    <div tabIndex={0} data-testid="slider" data-index={s.index} data-prev={String(s.canPrev)} data-next={String(s.canNext)} onKeyDown={s.handlers.onKeyDown} />
  );
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(count: number, loop: boolean) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<Slider count={count} loop={loop} />));
  const el = host.querySelector<HTMLDivElement>('[data-testid="slider"]')!;
  return {
    el,
    index: () => Number(el.dataset.index),
    press: (key: string) => {
      const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      act(() => {
        el.dispatchEvent(ev);
      });
      return ev.defaultPrevented;
    },
  };
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("useSlider keyboard", () => {
  it("moves with ArrowRight / ArrowLeft and jumps with Home / End", () => {
    const s = mount(5, false);
    expect(s.index()).toBe(0);
    expect(s.press("ArrowRight")).toBe(true);
    expect(s.index()).toBe(1);
    s.press("ArrowRight");
    expect(s.index()).toBe(2);
    s.press("ArrowLeft");
    expect(s.index()).toBe(1);
    s.press("End");
    expect(s.index()).toBe(4);
    s.press("Home");
    expect(s.index()).toBe(0);
  });

  it("clamps at both ends when loop is false", () => {
    const s = mount(3, false);
    s.press("ArrowLeft");
    expect(s.index()).toBe(0);
    expect(s.el.dataset.prev).toBe("false");
    s.press("End");
    s.press("ArrowRight");
    s.press("ArrowRight");
    expect(s.index()).toBe(2);
    expect(s.el.dataset.next).toBe("false");
  });

  it("wraps around when loop is true", () => {
    const s = mount(3, true);
    s.press("ArrowLeft");
    expect(s.index()).toBe(2);
    s.press("ArrowRight");
    expect(s.index()).toBe(0);
    s.press("End");
    s.press("ArrowRight");
    expect(s.index()).toBe(0);
    expect(s.el.dataset.prev).toBe("true");
    expect(s.el.dataset.next).toBe("true");
  });

  it("ignores other keys", () => {
    const s = mount(3, false);
    expect(s.press("a")).toBe(false);
    expect(s.index()).toBe(0);
  });
});
