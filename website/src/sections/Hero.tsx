import { useCopy } from "@/content/i18n";
import { SceneSlot } from "@/three/SceneSlot";
import { Button } from "@/ui/Button";
import { MarkSvg } from "@/ui/MarkSvg";
import s from "./Hero.module.css";

export function Hero() {
  const t = useCopy();
  const h = t.hero;
  return (
    <section id="inicio" data-dock="inicio" className={s.hero} aria-labelledby="hero-title">
      <SceneSlot id="hero" className={s.scene} label={h.sceneLabel} fallback={<MarkSvg className={s.fallback} />} />
      <div className={`wrap ${s.inner}`}>
        <h1 id="hero-title" className={`display stepped over-canvas ${s.title}`}>
          {h.lines.map((line, i) => (
            <span key={line} style={{ ["--i" as string]: i }}>
              <span className={s.line}>{line}</span>
            </span>
          ))}
        </h1>
        <p className={`lede over-canvas ${s.lede}`}>{h.lede}</p>
        <div className={`over-canvas ${s.actions}`}>
          <Button href="/contacto" size="lg">
            {t.nav.demo}
          </Button>
          <Button href="#recorrido" size="lg" variant="glass">
            {t.nav.how}
          </Button>
        </div>
      </div>
      <ol className={`over-canvas ${s.rail}`} aria-label={t.journey.title}>
        {h.stages.map((st, i) => (
          <li key={st} style={{ ["--k" as string]: i }}>
            {st}
          </li>
        ))}
      </ol>
    </section>
  );
}
