import { useEffect, useMemo, useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { SceneSlot } from "@/three/SceneSlot";
import { cvHighlight } from "@/three/stores";
import { compile, evaluate, termPresent } from "@/lib/booleanSearch";
import { FIELD_ORDER, RESUMES, type Resume } from "@/content/resumes";
import s from "./CvSearch.module.css";

const PRESETS = ['"machine learning" AND Python NOT intern', "(React OR Vue) AND TypeScript", "SQL Python", '"data engineer" OR "ml engineer"'];

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const hit = terms.some((t) => termPresent(text, t));
  return hit ? <mark>{text}</mark> : <>{text}</>;
}

/**
 * Resume index + Boolean search. The 3D scene separates a CV into the six
 * indexed fields; the search box runs a real Boolean parser over three
 * synthetic CVs and lights the fields where the query's terms were found.
 */
export function CvSearch() {
  const t = useCopy().cv;
  const [query, setQuery] = useState(PRESETS[0]);
  const compiled = useMemo(() => compile(query), [query]);

  const results = useMemo(() => {
    if ("error" in compiled) return [];
    return RESUMES.map((r) => {
      const hay = FIELD_ORDER.map((f) => r.fields[f].join(" \n ")).join(" \n ");
      const ok = evaluate(compiled.tree, hay);
      const fieldHits = FIELD_ORDER.map((f) => compiled.terms.some((term) => r.fields[f].some((line) => termPresent(line, term))));
      return { r, ok, fieldHits };
    });
  }, [compiled]);

  const matches = results.filter((x) => x.ok);

  useEffect(() => {
    const first = matches[0];
    cvHighlight.set(first ? first.fieldHits : [false, false, false, false, false, false]);
  }, [matches]);

  const terms = "error" in compiled ? [] : compiled.terms;

  return (
    <section id="cv" data-dock="pipeline" className={`section ${s.section}`} aria-labelledby="cv-title" data-trace="2">
      <div className="wrap">
        <SectionHead id="cv-title" tag={{ label: "Filtrar", step: 3, tone: 2 }} title={t.title} body={t.body} align="split">
          <p className="small">{t.limits}</p>
        </SectionHead>

        <div className={s.grid}>
          <div className={s.visual}>
            <SceneSlot id="resume" className={s.scene} label={`${t.title} ${t.fields.join(", ")}.`} />
            <ol className={`over-canvas ${s.fields}`} aria-label={t.title}>
              {t.fields.map((f, i) => (
                <li key={f} data-hit={matches[0]?.fieldHits[i] || undefined}>
                  {f}
                </li>
              ))}
            </ol>
          </div>

          <div className={s.search}>
            <h3 className="h3">{t.searchTitle}</h3>
            <p className="body">{t.searchBody}</p>
            <label className={s.inputWrap}>
              <span className="sr-only">{t.searchLabel}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" className={s.icon}>
                <path d="M3 5l3 5-3 5M8 5l3 5-3 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                className={s.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-describedby="cv-status"
                aria-invalid={"error" in compiled || undefined}
              />
            </label>
            <div className={s.presets} role="group" aria-label={t.presets}>
              {PRESETS.map((p) => (
                <button key={p} type="button" className={`glass glass-press ${s.preset}`} aria-pressed={p === query} onClick={() => setQuery(p)}>
                  <code>{p}</code>
                </button>
              ))}
            </div>

            <p id="cv-status" className={s.status} aria-live="polite">
              {"error" in compiled ? (
                <span className={s.error}>{compiled.error}</span>
              ) : matches.length ? (
                <>
                  <b className="num">{matches.length}</b> {t.results} <span className={s.of}>/ {RESUMES.length} {t.sample}</span>
                </>
              ) : (
                t.none
              )}
            </p>

            <ul role="list" className={s.results}>
              {results.map(({ r, ok }) => (
                <ResumeRow key={r.id} r={r} ok={ok} terms={terms} fieldNames={t.fields} />
              ))}
            </ul>
          </div>
        </div>

        <aside className={s.callout}>
          <h3 className={s.calloutTitle}>{t.screenTitle}</h3>
          <p className="body">{t.screenBody}</p>
        </aside>
      </div>
    </section>
  );
}

function ResumeRow({ r, ok, terms, fieldNames }: { r: Resume; ok: boolean; terms: string[]; fieldNames: string[] }) {
  return (
    <li className={s.row} data-ok={ok || undefined}>
      <div className={s.rowHead}>
        <span className={s.rowLabel}>{r.label}</span>
        <span className={s.rowState}>{ok ? "Coincide" : "No coincide"}</span>
      </div>
      <dl className={s.rowFields}>
        {FIELD_ORDER.slice(0, 3).map((f, i) => (
          <div key={f}>
            <dt>{fieldNames[i]}</dt>
            <dd>
              {r.fields[f].map((v, k) => (
                <span key={v}>
                  {k > 0 && ", "}
                  <Highlight text={v} terms={terms} />
                </span>
              ))}
            </dd>
          </div>
        ))}
        <div>
          <dt>{fieldNames[5]}</dt>
          <dd>
            {r.fields.history.map((v, k) => (
              <span key={v}>
                {k > 0 && "; "}
                <Highlight text={v} terms={terms} />
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </li>
  );
}
