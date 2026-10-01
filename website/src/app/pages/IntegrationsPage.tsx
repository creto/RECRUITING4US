import { useCopy } from "@/content/i18n";
import { AutomationBlock, IntegrationsMatrix } from "@/sections/Integrations";
import { PageCta, PageHero } from "./PageParts";
import s from "./Pages.module.css";

export function IntegrationsPage() {
  const t = useCopy();
  const p = t.pages.integrations;
  const notes = [p.files, p.hr, p.code];
  return (
    <>
      <PageHero title={p.title} lede={p.lede} />

      <section className={`section ${s.matrixSection}`} aria-label={p.title}>
        <div className="wrap">
          <p className={`body ${s.intro}`}>{t.integrations.body}</p>
          <IntegrationsMatrix headingLevel={2} />
          <AutomationBlock headingLevel={2} />
        </div>
      </section>

      <section className={`section ${s.notes}`} aria-labelledby="notes-title">
        <div className="wrap">
          <header className={s.notesHead}>
            <h2 id="notes-title" className="h2">
              {p.notesTitle}
            </h2>
            <p className="body">{p.notesBody}</p>
          </header>

          <div className={s.mailBlock}>
            <div className={s.mailHead}>
              <h3 className="h3">{p.mail.title}</h3>
              <p className="body">{p.mail.body}</p>
            </div>
            <ol className={s.states} role="list">
              {p.mail.states.map((st, i) => (
                <li key={st.name} className={s.state} data-accent={i === 1 ? "accepted" : i === 2 ? "delivered" : undefined}>
                  <span className={s.stateName}>{st.name}</span>
                  <span className={s.stateText}>{st.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={s.noteGrid}>
            {notes.map((n) => (
              <article key={n.title} className={s.note}>
                <h3 className={s.noteTitle}>{n.title}</h3>
                <p className={s.noteBody}>{n.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PageCta title={p.ctaTitle} body={p.ctaBody} />
    </>
  );
}
