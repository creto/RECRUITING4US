import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { useReducedMotion } from "@/lib/media";
import { ScrollTrigger } from "@/motion/scroll";
import s from "./Careers.module.css";

type Brand = { background: string; text: string; button: string };
const PRESETS: { name: string; brand: Brand }[] = [
  { name: "Papel", brand: { background: "#ffffff", text: "#0f1f18", button: "#04a764" } },
  { name: "Noche", brand: { background: "#0e1b2c", text: "#e9f0f7", button: "#f2b134" } },
  { name: "Arena", brand: { background: "#f6efe4", text: "#2b2118", button: "#b5462c" } },
];

/**
 * Careers + application. The embedded form evolves brand → vacancy →
 * application → receipt. Scrolling through the section advances the steps
 * (until the visitor takes over with the step buttons). The colour inputs
 * are the same three the product lets an employer set: background, text
 * and button.
 */
export function Careers() {
  const t = useCopy().careers;
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState<Brand>(PRESETS[0].brand);
  const [copied, setCopied] = useState(false);
  const touched = useRef(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduce || !ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 55%",
      end: "bottom 70%",
      onUpdate: (self) => {
        if (touched.current) return;
        setStep(Math.min(3, Math.floor(self.progress * 4.2)));
      },
    });
    return () => st.kill();
  }, [reduce]);

  const choose = (i: number) => {
    touched.current = true;
    setStep(i);
  };

  const snippet = `<iframe src="https://tu-dominio/embed/northstar-labs/analista-de-datos" title="Postular" width="100%" height="900" style="border:0;max-width:40rem"></iframe>`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the snippet stays selectable */
    }
  };

  const f = t.form;
  return (
    <section id="vacantes" data-dock="vacantes" ref={ref} className={`section ${s.section}`} aria-labelledby="vacantes-title" data-trace="1">
      <div className="wrap">
        <SectionHead id="vacantes-title" tag={{ label: "Descubrir y postular", step: 1, tone: 1 }} title={t.title} body={t.body} align="split" />

        <div className={s.studio}>
          <div className={s.controls}>
            <div role="tablist" aria-label={t.title} className={s.steps}>
              {t.steps.map((name, i) => (
                <button
                  key={name}
                  role="tab"
                  type="button"
                  id={`careers-tab-${i}`}
                  aria-selected={step === i}
                  aria-controls="careers-preview"
                  className={`glass glass-press ${s.step}`}
                  data-on={step === i || undefined}
                  data-past={i < step || undefined}
                  onClick={() => choose(i)}
                >
                  <span className={s.stepMark} aria-hidden="true" />
                  {name}
                </button>
              ))}
            </div>

            <fieldset className={s.brand}>
              <legend className={s.legend}>{t.brandTitle}</legend>
              <p className="small">{t.brandBody}</p>
              <div className={s.swatches}>
                {(["background", "text", "button"] as const).map((k) => (
                  <label key={k} className={s.swatch}>
                    <input
                      type="color"
                      value={brand[k]}
                      onChange={(e) => setBrand((b) => ({ ...b, [k]: e.target.value }))}
                      aria-label={t.swatches[k]}
                    />
                    <span>{t.swatches[k]}</span>
                    <code>{brand[k]}</code>
                  </label>
                ))}
              </div>
              <div className={s.presets} role="group" aria-label={t.presets}>
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`glass glass-press ${s.preset}`}
                    aria-pressed={brand.background === p.brand.background && brand.button === p.brand.button}
                    onClick={() => setBrand(p.brand)}
                  >
                    <span className={s.presetDots} aria-hidden="true">
                      <i style={{ background: p.brand.background }} />
                      <i style={{ background: p.brand.text }} />
                      <i style={{ background: p.brand.button }} />
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className={s.host}>
            <div className={s.hostBar} aria-hidden="true">
              <span className={s.hostDots}>
                <i />
                <i />
                <i />
              </span>
              <span className={s.hostUrl}>northstar-labs.example/empleo</span>
            </div>
            <div
              id="careers-preview"
              role="tabpanel"
              aria-labelledby={`careers-tab-${step}`}
              aria-live="polite"
              className={s.form}
              style={{ ["--fb" as string]: brand.background, ["--ft" as string]: brand.text, ["--fbtn" as string]: brand.button }}
              data-step={step}
            >
              <div className={s.company}>
                <span className={s.monogram} aria-hidden="true">
                  N
                </span>
                <span>{f.company}</span>
              </div>

              <div className={s.stage} data-show={step === 0 || undefined}>
                <p className={s.kicker}>Trabaja con nosotros</p>
                <p className={s.big}>Construimos herramientas de datos para equipos de salud.</p>
                <p className={s.muted}>3 vacantes abiertas</p>
              </div>

              <div className={s.stage} data-show={step === 1 || undefined}>
                <p className={s.big}>{f.role}</p>
                <p className={s.muted}>{f.meta}</p>
                <ul className={s.reqs}>
                  <li>SQL y modelado de datos</li>
                  <li>Python para análisis</li>
                  <li>Comunicar hallazgos a equipos no técnicos</li>
                </ul>
                <span className={s.fakeBtn}>Postular</span>
              </div>

              <div className={s.stage} data-show={step === 2 || undefined}>
                <p className={s.formTitle}>{f.role}</p>
                <div className={s.field}>
                  <span>{f.name}</span>
                  <b>Mariana Gómez</b>
                </div>
                <div className={s.field}>
                  <span>{f.email}</span>
                  <b>mariana@correo.example</b>
                </div>
                <div className={s.field}>
                  <span>{f.essay}</span>
                  <b className={s.typing}>Unifiqué tres fuentes de citas médicas y reduje los duplicados…</b>
                </div>
                <div className={`${s.field} ${s.file}`}>
                  <span>{f.cv}</span>
                  <b>cv-mariana-gomez.pdf</b>
                </div>
                <span className={s.fakeBtn}>{f.submit}</span>
              </div>

              <div className={s.stage} data-show={step === 3 || undefined}>
                <svg className={s.check} viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M14 24.5l7 7 13-14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className={s.big}>{f.receiptTitle}</p>
                <p className={s.muted}>{f.receiptBody}</p>
              </div>
            </div>
            <p className={`demo-note ${s.note}`}>{t.illustration}</p>
          </div>
        </div>

        <div className={s.lower}>
          <div className={s.embed}>
            <h3 className="h3">{t.embedTitle}</h3>
            <p className="body">{t.embedBody}</p>
            <div className={s.snippet}>
              <code>{snippet}</code>
              <button type="button" className={`glass glass-press ${s.copyBtn}`} onClick={copy}>
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <div className={s.knockout}>
            <h3 className="h3">{t.knockoutTitle}</h3>
            <p className="body">{t.knockoutBody}</p>
            <dl className={s.rules}>
              <div>
                <dt>Años mínimos de experiencia</dt>
                <dd className="num">2</dd>
              </div>
              <div>
                <dt>Autorización de trabajo en Colombia</dt>
                <dd>Requerida</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
