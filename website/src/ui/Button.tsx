import { useRef, type ReactNode } from "react";
import { Link } from "./Link";
import { useSpecular } from "./useSpecular";
import s from "./Button.module.css";

type Props = {
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "glass" | "quiet";
  size?: "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

/**
 * Buttons advance, they do not grow: on hover the four stage ticks light up
 * left to right (the mark's progression) and the arrow steps forward; press
 * compresses the surface and release springs back.
 */
export function Button({ href, onClick, variant = "solid", size = "md", type = "button", disabled, children, className, ariaLabel }: Props) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  useSpecular(ref);
  const cls = [s.btn, s[variant], s[size], variant === "glass" ? "glass glass-press" : "", className].filter(Boolean).join(" ");
  const inner = (
    <>
      <span className={s.label}>{children}</span>
      <span className={s.ticks} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <svg className={s.arrow} viewBox="0 0 16 16" aria-hidden="true">
        <path d="M5 3.5 9.5 8 5 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
  if (href) {
    const external = href.startsWith("/login") || /^https?:|^mailto:/.test(href);
    if (external) {
      return (
        <a ref={ref} href={href} className={cls} aria-label={ariaLabel}>
          {inner}
        </a>
      );
    }
    return (
      <Link ref={ref} href={href} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} onClick={onClick} className={cls} disabled={disabled} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
