import { useRef, type PointerEvent } from "react";
import { useCopy } from "@/content/i18n";
import { useActiveSection } from "@/motion/activeSection";
import { usePath } from "@/app/router";
import { useReducedMotion } from "@/lib/media";
import { DockIcon } from "./icons";
import { Link } from "./Link";
import s from "./Dock.module.css";

/**
 * Vertical Liquid Glass Dock (desktop ≥1100px). Spring magnification follows
 * the pointer's distance to each item; the active marker is a small chevron
 * that glides to the current section. Plain links: Tab / Enter work, and the
 * tooltip also appears on keyboard focus.
 */
export function Dock() {
  const t = useCopy().nav;
  const current = useActiveSection();
  const path = usePath();
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);

  const onMove = (e: PointerEvent) => {
    if (reduce || !listRef.current) return;
    for (const li of Array.from(listRef.current.children) as HTMLElement[]) {
      const r = li.getBoundingClientRect();
      const d = Math.abs(e.clientY - (r.top + r.height / 2));
      const m = Math.max(0, 1 - d / 120);
      li.style.setProperty("--m", (m * m).toFixed(3));
    }
  };
  const onLeave = () => {
    listRef.current?.querySelectorAll("li").forEach((li) => li.style.setProperty("--m", "0"));
  };

  const activeIndex = path === "/" ? Math.max(0, t.items.findIndex((i) => i.id === current)) : -1;

  return (
    <nav className={s.dockWrap} aria-label={t.dock}>
      <div className={`glass glass--panel ${s.dock}`} onPointerMove={onMove} onPointerLeave={onLeave}>
        {activeIndex >= 0 && <span className={s.marker} style={{ ["--i" as string]: activeIndex }} aria-hidden="true" />}
        <ul ref={listRef} role="list" className={s.list}>
          {t.items.map((item) => {
            const isActive = path === "/" && item.id === current;
            return (
              <li key={item.id}>
                <Link
                  href={path === "/" ? `#${item.id}` : `/#${item.id}`}
                  className={s.item}
                  aria-current={isActive ? "location" : undefined}
                  data-cursor="dock"
                >
                  <DockIcon id={item.id} />
                  <span className={s.tip}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
