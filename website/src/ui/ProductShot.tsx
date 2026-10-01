import { useState } from "react";
import s from "./ProductShot.module.css";

/**
 * A real RECRUIT4US screen (public/product/*.webp, captured from the
 * synthetic Northstar Labs demo; see docs/authentic-ui-inventory.md), framed
 * as a window. If a capture is missing the frame collapses instead of
 * showing a broken image.
 */
export function ProductShot({ name, alt, className, eager = false, sizes = "(min-width: 1100px) 60vw, 100vw" }: { name: string; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <figure className={`${s.frame} ${className ?? ""}`}>
      <span className={s.bar} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <img
        src={`/product/${name}.webp`}
        srcSet={`/product/${name}-sm.webp 1200w, /product/${name}.webp 2400w`}
        sizes={sizes}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setOk(false)}
        className={s.img}
      />
    </figure>
  );
}
