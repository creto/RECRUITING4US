import { useCopy } from "@/content/i18n";
import { Button } from "@/ui/Button";
import s from "./Pages.module.css";

/** Four chevrons of the journey; the third step is missing: this page. */
function LostTrail() {
  const d = "M2 2h9l12 18-12 18H2l12-18z";
  return (
    <svg className={s.trail} viewBox="0 0 150 40" aria-hidden="true">
      <path d={d} fill="var(--stage-1)" />
      <path d={d} transform="translate(34 0)" fill="var(--stage-2)" />
      <path d={d} transform="translate(68 0)" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" strokeDasharray="3 3" strokeLinejoin="round" />
      <path d={d} transform="translate(102 0)" fill="var(--stage-4)" opacity="0.35" />
    </svg>
  );
}

export function NotFound() {
  const t = useCopy().pages.notFound;
  return (
    <section className={s.notFound} aria-labelledby="nf-title">
      <div className={`wrap ${s.nfInner}`}>
        <LostTrail />
        <h1 id="nf-title" className={`display ${s.nfTitle}`}>
          {t.title}
        </h1>
        <p className="lede">{t.body}</p>
        <Button href="/" size="lg">
          {t.cta}
        </Button>
      </div>
    </section>
  );
}
