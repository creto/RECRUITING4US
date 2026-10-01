import { useRef, type MouseEvent } from "react";
import { setTheme, useTheme } from "@/theme/theme";
import { useCopy } from "@/content/i18n";
import { useSpecular } from "./useSpecular";
import s from "./ThemeToggle.module.css";

/**
 * Day / night switch. The knob is a disc that a second disc slides over to
 * become a crescent; the track shows a horizon of the four stage colours that
 * dims at night. The change itself is a circular reveal from the knob.
 */
export function ThemeToggle() {
  const theme = useTheme();
  const t = useCopy().nav;
  const ref = useRef<HTMLButtonElement>(null);
  useSpecular(ref);
  const dark = theme === "dark";
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const knobX = dark ? r.left + 18 : r.right - 18;
    setTheme(dark ? "light" : "dark", { x: knobX, y: r.top + r.height / 2 });
  };
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t.themeNight}
      title={dark ? t.themeLabelDark : t.themeLabel}
      className={`glass glass-press ${s.toggle}`}
      data-dark={dark || undefined}
      onClick={onClick}
    >
      <span className={s.horizon} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={s.knob} aria-hidden="true">
        <span className={s.shade} />
      </span>
    </button>
  );
}
