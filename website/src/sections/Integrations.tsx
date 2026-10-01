import { useCopy } from "@/content/i18n";
import { useIsMobile } from "@/lib/media";
import { Button } from "@/ui/Button";
import { SectionHead } from "@/ui/SectionHead";
import s from "./Integrations.module.css";

type Status = "included" | "configurable" | "not-connected";

/** Status glyph: solid chevron (included), outlined (when configured), dashed (not connected). */
export function StatusGlyph({ status, className }: { status: Status; className?: string }) {
  const d = "M1.2 1.2h5.6l7.6 10.8-7.6 10.8H1.2L8.4 12z";
  return (
    <svg className={`${s.glyph} ${className ?? ""}`} viewBox="0 0 16 24" aria-hidden="true" data-status={status}>
      {status === "included" ? (
        <path d={d} fill="currentColor" />
      ) : (
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeDasharray={status === "not-connected" ? "2.6 2.4" : undefined}
        />
      )}
    </svg>
  );
}

/**
 * The status matrix. Desktop reads as an editorial table: the group sits
 * in a sticky left column while its rows pass. Mobile collapses each group
 * into a native disclosure (the first one open).
 */
export function IntegrationsMatrix({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const it = useCopy().integrations;
  const mobile = useIsMobile();
  const H = `h${headingLevel}` as "h2" | "h3";

  return (
    <ul className={s.matrix} role="list">
      {it.groups.map((g, gi) => {
        const status = g.status as Status;
        const hint = it.statusHint[status];
        const items = (
          <ul className={s.items} role="list">
            {g.items.map((item) => (
              <li key={item.name} className={s.item}>
                <span className={s.itemName}>{item.name}</span>
                <span className={s.itemText}>{item.text}</span>
              </li>
            ))}
          </ul>
        );
        return (
          <li key={g.status} className={s.group} data-status={status}>
            {mobile ? (
              <details className={s.details} open={gi === 0}>
                <summary className={s.summary}>
                  <StatusGlyph status={status} />
                  <span className={s.summaryText}>
                    <H className={s.groupName}>{g.name}</H>
                    <span className={s.hint}>{hint}</span>
                  </span>
                  <span className={`num ${s.count}`}>{g.items.length}</span>
                  <svg className={s.caret} viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                {items}
              </details>
            ) : (
              <>
                <div className={s.groupHead}>
                  <div className={s.groupSticky}>
                    <StatusGlyph status={status} />
                    <H className={s.groupName}>{g.name}</H>
                    <p className={s.hint}>{hint}</p>
                  </div>
                </div>
                {items}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Rule runs: simulation first, captured mail, audit, anonymisation. And the SMTP truth. */
export function AutomationBlock({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const it = useCopy().integrations;
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <div className={s.automation}>
      <div className={s.autoHead}>
        <H className="h3">{it.automationTitle}</H>
        <p className="body">{it.automationBody}</p>
      </div>
      <ol className={s.flow} role="list">
        {it.automationSteps.map((st, i) => (
          <li key={st.name} className={s.flowStep} style={{ ["--tone" as string]: `var(--stage-${i + 1})` }}>
            <span className={s.flowMark} aria-hidden="true" />
            <span className={s.flowName}>{st.name}</span>
            <span className={s.flowText}>{st.text}</span>
          </li>
        ))}
      </ol>

      <figure className={s.mail}>
        <div className={s.mailTrack} aria-hidden="true">
          <span className={s.state}>{it.mailStates[0]}</span>
          <span className={s.link} />
          <span className={`${s.state} ${s.accepted}`}>
            {it.mailStates[1]}
            <small className="num">250</small>
          </span>
          <span className={`${s.link} ${s.gap}`}>
            <span className={s.gapLabel}>{it.mailGap}</span>
          </span>
          <span className={`${s.state} ${s.delivered}`}>{it.mailStates[2]}</span>
        </div>
        <figcaption className={s.mailNote}>{it.mailNote}</figcaption>
      </figure>
    </div>
  );
}

export function Integrations() {
  const t = useCopy();
  const it = t.integrations;
  return (
    <section id="integraciones" data-dock="confianza" className={`section ${s.integrations}`} aria-labelledby="integrations-title">
      <div className="wrap">
        <SectionHead id="integrations-title" tag={{ label: "Integraciones", tone: 2 }} title={it.title} body={it.body} align="split" />
        <IntegrationsMatrix />
        <AutomationBlock />
        <div className={s.more}>
          <Button href="/integraciones" variant="glass">
            {it.more}
          </Button>
        </div>
      </div>
    </section>
  );
}
