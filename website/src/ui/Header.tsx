import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCopy } from "@/content/i18n";
import { appHref } from "@/lib/env";
import { navigate, usePath } from "@/app/router";
import { getLenis } from "@/motion/scroll";
import { Logo } from "./Logo";
import { Link } from "./Link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./Button";
import { useSpecular } from "./useSpecular";
import s from "./Header.module.css";

export function Header() {
  const t = useCopy().nav;
  const path = usePath();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  useSpecular(navRef);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      // Is a .band-dark section under the header bar?
      let dark = false;
      document.querySelectorAll(".band-dark").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 36 && r.bottom >= 36) dark = true;
      });
      setOverDark(dark);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile sheet: lock scroll, Escape closes, focus moves in and back out.
  useEffect(() => {
    if (!open) return;
    const btn = menuBtn.current;
    const lenis = getLenis();
    lenis?.stop();
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      btn?.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => setOpen(false), [path]);

  const homeHash = (id: string) => (path === "/" ? `#${id}` : `/#${id}`);

  // Close the sheet first (restores scrolling), then navigate.
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => navigate(href)));
  };

  return (
    <header className={s.header} data-scrolled={scrolled || undefined} data-over-dark={overDark || undefined}>
      <div className={s.bar}>
        <Logo />
        <nav ref={navRef} className={`glass ${s.nav}`} aria-label={t.primary}>
          <Link href={homeHash("recorrido")} className={s.navLink}>
            {t.how}
          </Link>
          {t.pages.slice(0, 2).map((p) => (
            <Link key={p.href} href={p.href} className={s.navLink} aria-current={path === p.href ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
        </nav>
        <div className={s.actions}>
          <ThemeToggle />
          <a href={appHref("/login")} className={s.signIn}>
            {t.signIn}
          </a>
          <Button href="/contacto" className={s.demoBtn}>
            {t.demo}
          </Button>
          <button
            ref={menuBtn}
            type="button"
            className={`glass glass-press ${s.menuBtn}`}
            aria-expanded={open}
            aria-controls="mobile-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t.close : t.menu}</span>
            <span className={s.burger} data-open={open || undefined} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <div id="mobile-sheet" ref={sheetRef} className={s.sheet} data-open={open || undefined} hidden={!open}>
        <nav aria-label={t.menu}>
          <ol role="list" className={s.sheetList}>
            {t.items.map((item, i) => (
              <li key={item.id} style={{ ["--d" as string]: `${i * 35}ms` }}>
                <Link href={homeHash(item.id)} className={s.sheetLink} onClick={(e) => go(e, homeHash(item.id))}>
                  <span className={s.sheetStep} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
          <ul role="list" className={s.sheetPages}>
            {t.pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} onClick={(e) => go(e, p.href)}>
                  {p.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={appHref("/login")}>{t.signIn}</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
