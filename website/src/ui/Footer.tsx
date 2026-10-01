import { useCopy } from "@/content/i18n";
import { appHref } from "@/lib/env";
import { Link } from "./Link";
import s from "./Footer.module.css";

export function Footer() {
  const t = useCopy();
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className={`wrap ${s.grid}`}>
        <div className={s.brand}>
          <img src="/brand/mark-152.png" alt="" width={64} height={48} className={s.mark} loading="lazy" decoding="async" />
          <p className={s.word}>RECRUIT4US</p>
          <p className={s.tagline}>{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.footer.product} className={s.col}>
          <p className={s.colTitle}>{t.footer.product}</p>
          <ul role="list">
            {[...t.nav.items.slice(1, 7), ...t.footer.extra].map((i) => (
              <li key={i.id}>
                <Link href={`/#${i.id}`}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.footer.company} className={s.col}>
          <p className={s.colTitle}>{t.footer.company}</p>
          <ul role="list">
            {t.nav.pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href}>{p.label}</Link>
              </li>
            ))}
            <li>
              <a href={appHref("/login")}>{t.nav.signIn}</a>
            </li>
          </ul>
        </nav>
      </div>
      <div className={`wrap ${s.legal}`}>
        <p>
          © {year} TIGLOBAL. {t.footer.rights}
        </p>
        <p>{t.footer.honest}</p>
      </div>
      <div className={s.horizon} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
    </footer>
  );
}
