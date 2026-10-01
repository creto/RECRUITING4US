import { useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { SceneSlot } from "@/three/SceneSlot";
import s from "./Code.module.css";

const SOURCE = [
  ["kw", "function "],
  ["fn", "dedupe"],
  ["p", "(items) {\n  "],
  ["kw", "const "],
  ["p", "seen = "],
  ["kw", "new "],
  ["fn", "Set"],
  ["p", "();\n  "],
  ["kw", "return "],
  ["p", "items."],
  ["fn", "filter"],
  ["p", "((x) => {\n    "],
  ["kw", "if "],
  ["p", "(seen."],
  ["fn", "has"],
  ["p", "(x)) "],
  ["kw", "return "],
  ["n", "false"],
  ["p", ";\n    seen."],
  ["fn", "add"],
  ["p", "(x);\n    "],
  ["kw", "return "],
  ["n", "true"],
  ["p", ";\n  });\n}"],
] as const;

/**
 * Coding evidence. The editor shows the difference between a sample run
 * (the candidate trying an example) and the formal score (hidden cases,
 * JavaScript only). Ranking order and its limits sit beside it.
 */
export function Code() {
  const t = useCopy().code;
  const [tab, setTab] = useState<"sample" | "formal">("sample");
  return (
    <section id="codigo" data-dock="evaluaciones" className={`section band-dark ${s.section}`} aria-labelledby="code-title" data-trace="3">
      <SceneSlot id="liquid" className={s.bg} label="Ilustración: un campo de píxeles en los verdes de la marca, como fondo del laboratorio de código." />
      <div className="wrap over-canvas">
        <SectionHead id="code-title" tag={{ label: "Evaluar", step: 4, tone: 3 }} title={t.title} body={t.body} align="split" />

        <div className={s.grid}>
          <figure className={s.editor} aria-label={t.editorLabel}>
            <div className={s.editorBar}>
              <span className={s.file}>dedupe.js</span>
              <div role="tablist" aria-label={t.editorLabel} className={s.tabs}>
                <button role="tab" type="button" aria-selected={tab === "sample"} aria-controls="code-out" className={`glass glass-press ${s.tab}`} onClick={() => setTab("sample")}>
                  {t.sample}
                </button>
                <button role="tab" type="button" aria-selected={tab === "formal"} aria-controls="code-out" className={`glass glass-press ${s.tab}`} onClick={() => setTab("formal")}>
                  {t.score}
                </button>
              </div>
            </div>
            <pre className={s.src}>
              <code>
                {SOURCE.map(([k, v], i) => (
                  <span key={i} className={s[k]}>
                    {v}
                  </span>
                ))}
              </code>
            </pre>
            <div id="code-out" role="tabpanel" className={s.out} aria-live="polite" key={tab}>
              {tab === "sample" ? (
                <>
                  <p className={s.outTitle}>{t.sample}</p>
                  <pre className={s.stdout}>
                    <code>{"> dedupe([3, 1, 3, 2, 1])\n[3, 1, 2]"}</code>
                  </pre>
                  <p className={s.caveat}>Esto no es el puntaje: solo muestra lo que devuelve este ejemplo.</p>
                </>
              ) : (
                <>
                  <p className={s.outTitle}>{t.score}</p>
                  <ol className={s.cases}>
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n} data-pass={n !== 4 || undefined}>
                        <span className={s.lock} aria-hidden="true" />
                        {t.hidden} {n}
                        <b>{n !== 4 ? t.passed : "no superado"}</b>
                      </li>
                    ))}
                  </ol>
                  <dl className={s.metrics}>
                    <div>
                      <dt>Clase de tiempo estimada</dt>
                      <dd>O(n), heurística</dd>
                    </div>
                    <div>
                      <dt>Tiempo medido</dt>
                      <dd className="num">4 ms</dd>
                    </div>
                  </dl>
                  <p className={s.caveat}>El candidato no ve los resultados esperados.</p>
                </>
              )}
            </div>
          </figure>

          <div className={s.side}>
            <ul role="list" className={s.points}>
              {t.points.map((p) => (
                <li key={p.name}>
                  <h3 className={s.pointName}>{p.name}</h3>
                  <p>{p.text}</p>
                </li>
              ))}
            </ul>
            <div className={s.rank}>
              <h3 className={s.rankTitle}>{t.rankTitle}</h3>
              <ol className={s.rankList}>
                {t.rank.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
              <p className="small">{t.rankNote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
