import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { RoutePath } from "@/app/router";

type RouterModule = typeof import("@/app/router");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// normalise() is private; drive it the way the browser does (history + popstate)
// and read the result through usePath().
let router: RouterModule;
let seen: RoutePath | null = null;
function Probe() {
  seen = router.usePath();
  return null;
}

let root: Root;
let host: HTMLDivElement;

const PUBLIC = ["/", "/seguridad", "/integraciones", "/contacto"] as const;

beforeAll(async () => {
  // jsdom has no matchMedia; GSAP's ScrollTrigger (imported by the router) needs it at import time.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  router = await import("@/app/router");
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(Probe)));
});

afterAll(() => {
  act(() => root.unmount());
  host.remove();
});

function visit(pathname: string): RoutePath | null {
  act(() => {
    history.replaceState(null, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  return seen;
}

describe("router normalisation", () => {
  it("publishes exactly the four public routes", () => {
    expect([...router.ROUTES]).toEqual([...PUBLIC]);
  });

  it.each(PUBLIC.map((r) => [r]))("keeps %s", (route) => {
    expect(visit(route)).toBe(route);
  });

  it.each([
    ["/seguridad/", "/seguridad"],
    ["/integraciones//", "/integraciones"],
    ["/contacto/", "/contacto"],
    ["/seguridad///", "/seguridad"],
  ])("strips the trailing slash of %s", (input, expected) => {
    expect(visit(input)).toBe(expected);
  });

  it("keeps query and hash out of the route", () => {
    expect(visit("/contacto?utm_source=x#demo")).toBe("/contacto");
  });

  it.each(["/nope", "/seguridad/extra", "/Seguridad", "/index.html", "/contacto.html"])("maps %s to 404", (input) => {
    expect(visit(input)).toBe("404");
  });
});
