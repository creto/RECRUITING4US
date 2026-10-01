import { useEffect } from "react";
import { useCopy } from "@/content/i18n";
import { SITE_ORIGIN } from "@/lib/env";
import type { RoutePath } from "./router";

/** Per-route title, description and canonical (also baked into static HTML by scripts/seo-routes.mjs). */
export function useDocumentMeta(path: RoutePath) {
  const t = useCopy();
  useEffect(() => {
    const map: Record<string, { title: string; description: string }> = {
      "/": { title: "RECRUIT4US: cada paso de la contratación, con evidencia a la vista", description: t.meta.description },
      "/seguridad": { title: `${t.pages.security.title} | RECRUIT4US`, description: t.pages.security.lede },
      "/integraciones": { title: `${t.pages.integrations.title} | RECRUIT4US`, description: t.pages.integrations.lede },
      "/contacto": { title: `${t.pages.contact.title} | RECRUIT4US`, description: t.pages.contact.lede },
      "404": { title: `${t.pages.notFound.title} | RECRUIT4US`, description: t.pages.notFound.body },
    };
    const m = map[path] ?? map["404"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    const canonical = path === "404" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", m.title);
  }, [path, t]);
}
