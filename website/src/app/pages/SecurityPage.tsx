import { useCopy } from "@/content/i18n";
import { Trust } from "@/sections/Trust";
import { StatusGlyph } from "@/sections/Integrations";
import { Link } from "@/ui/Link";
import { PageCta, PageHero } from "./PageParts";
import s from "./Pages.module.css";

export function SecurityPage() {
  const t = useCopy();
  const p = t.pages.security;
  return (
    <>
      <PageHero title={p.title} lede={p.lede}>
        <nav className={s.index} aria-label={p.indexLabel}>
          <ul role="list">
            {p.sections.map((sec) => (
              <li key={sec.id}>
                <Link href={`#${sec.id}`} className={`glass glass-press ${s.indexLink}`}>
                  {sec.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <Trust page />

      <section className={`section ${s.detail}`} aria-labelledby="security-detail">
        <div className="wrap">
          <h2 id="security-detail" className={`h2 ${s.detailTitle}`}>
            {p.detailTitle}
          </h2>
          <div className={s.articles}>
            {p.sections.map((sec, i) => (
              <article key={sec.id} id={sec.id} className={s.article} aria-labelledby={`${sec.id}-title`} style={{ ["--tone" as string]: `var(--stage-${(i % 4) + 1})` }}>
                <h3 id={`${sec.id}-title`} className={`h3 ${s.articleTitle}`}>
                  {sec.title}
                </h3>
                <div className={s.articleBody}>
                  <p className="body">{sec.body}</p>
                  {sec.points.length > 0 && (
                    <ul className={s.bullets} role="list">
                      {sec.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>

          <aside className={s.donts} aria-labelledby="security-donts">
            <h2 id="security-donts" className={`h3 ${s.dontsTitle}`}>
              {p.dontTitle}
            </h2>
            <ul role="list" className={s.dontList}>
              {p.donts.map((d) => (
                <li key={d}>
                  <StatusGlyph status="not-connected" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <PageCta title={p.ctaTitle} body={p.ctaBody} />
    </>
  );
}
