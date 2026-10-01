import { useState } from "react";
import { useCopy } from "@/content/i18n";
import { SectionHead } from "@/ui/SectionHead";
import { ProductShot } from "@/ui/ProductShot";
import s from "./WhatIs.module.css";

/**
 * Hover Expand: the five modules as panels. Hover, focus or tap opens one;
 * the open panel shows the real product screen and one plain sentence.
 * Each header is a real button (aria-expanded), so keyboard and screen
 * readers get the same content as the pointer.
 */
export function WhatIs() {
  const t = useCopy().whatIs;
  const [open, setOpen] = useState(0);
  return (
    <section id="que-es" data-dock="inicio" className={`section ${s.section}`} aria-labelledby="que-es-title">
      <div className="wrap">
        <SectionHead id="que-es-title" title={t.title} body={t.body} align="split">
          <p className="small">{t.hint}</p>
        </SectionHead>
        <ul role="list" className={s.panels}>
          {t.modules.map((m, i) => {
            const isOpen = open === i;
            return (
              <li key={m.id} className={s.panel} data-open={isOpen || undefined} style={{ ["--k" as string]: i }} onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}>
                <h3 className={s.panelHead}>
                  <button type="button" className={s.trigger} aria-expanded={isOpen} aria-controls={`mod-${m.id}`} onClick={() => setOpen(i)} onFocus={() => setOpen(i)}>
                    <span className={s.index} aria-hidden="true">
                      <i />
                    </span>
                    <span className={s.name}>{m.name}</span>
                  </button>
                </h3>
                <div id={`mod-${m.id}`} className={s.content} hidden={!isOpen}>
                  <p className={s.text}>{m.text}</p>
                  <ProductShot name={m.shot} alt={m.name} className={s.shot} sizes="(min-width: 1100px) 50vw, 100vw" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
