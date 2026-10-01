import type { ReactNode } from "react";
import { useCopy } from "@/content/i18n";
import { Button } from "@/ui/Button";
import s from "./Pages.module.css";

/** Subpage opening: an h1 and a lede, clear of the fixed header. */
export function PageHero({ title, lede, children }: { title: string; lede: string; children?: ReactNode }) {
  return (
    <header className={s.hero}>
      <div className="wrap">
        <h1 className={`display ${s.heroTitle}`}>{title}</h1>
        <p className={`lede ${s.heroLede}`}>{lede}</p>
        {children}
      </div>
    </header>
  );
}

/** Closing call to action shared by the subpages. */
export function PageCta({ title, body }: { title: string; body: string }) {
  const t = useCopy();
  return (
    <section className={`section ${s.cta}`} aria-labelledby="page-cta-title">
      <div className={`wrap ${s.ctaInner}`}>
        <h2 id="page-cta-title" className={`h2 ${s.ctaTitle}`}>
          {title}
        </h2>
        <div className={s.ctaSide}>
          <p className="body">{body}</p>
          <Button href="/contacto" size="lg">
            {t.nav.demo}
          </Button>
        </div>
      </div>
    </section>
  );
}
