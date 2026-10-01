#!/usr/bin/env node
/**
 * Post-build SEO pass (runs after `vite build`, see package.json "build").
 *
 * For each public route writes dist/<route>/index.html: a copy of
 * dist/index.html with that route's <title>, meta description, canonical,
 * og:url, og:title and og:description, so crawlers and link previews see
 * the right page before JavaScript runs. Also writes dist/404.html (noindex),
 * dist/sitemap.xml and dist/robots.txt.
 *
 * Titles and descriptions mirror src/app/meta.ts (useDocumentMeta), read from
 * src/content/es.ts. es.ts is plain data, so it is transpiled with Vite's oxc
 * transform and imported directly; if that ever fails (es.ts gains imports,
 * the transform API moves) the FALLBACK table below is used and a warning is
 * printed. Keep FALLBACK in sync with meta.ts by hand in that case.
 *
 * Origin: VITE_SITE_ORIGIN (process env or .env files), else the default
 * below (same default as src/lib/env.ts).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, transformWithOxc } from "vite";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const DEFAULT_ORIGIN = "https://recruit.tiglobal.com.co";
const HOME_TITLE = "RECRUIT4US: cada paso de la contratación, con evidencia a la vista";

/** Mirrors src/app/meta.ts. Used only if es.ts cannot be loaded. */
const FALLBACK = {
  "/": {
    title: HOME_TITLE,
    description:
      "RECRUIT4US es el espacio de contratación de tu empresa: vacantes, postulaciones, pipeline, evaluaciones, entrevistas y ofertas. El sistema reúne la evidencia; las personas deciden.",
  },
  "/seguridad": {
    title: "Seguridad y privacidad | RECRUIT4US",
    description: "Cómo RECRUIT4US separa los datos de cada empresa, protege al candidato y deja registro de las decisiones.",
  },
  "/integraciones": {
    title: "Integraciones | RECRUIT4US",
    description: "Qué viene incluido, qué se activa al configurarlo y qué no está conectado hoy.",
  },
  "/contacto": {
    title: "Solicitar demo | RECRUIT4US",
    description: "Una demostración con tus vacantes, tu equipo y el recorrido que quieres ver.",
  },
  404: {
    title: "Esta página no está en el recorrido. | RECRUIT4US",
    description: "La dirección no existe o cambió. Vuelve al inicio para seguir.",
  },
};

async function loadCopy() {
  const src = readFileSync(join(ROOT, "src/content/es.ts"), "utf8");
  const { code } = await transformWithOxc(src, "es.ts", { lang: "ts" });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  return mod.es;
}

async function routeMeta() {
  try {
    const t = await loadCopy();
    const table = {
      "/": { title: HOME_TITLE, description: t.meta.description },
      "/seguridad": { title: `${t.pages.security.title} | RECRUIT4US`, description: t.pages.security.lede },
      "/integraciones": { title: `${t.pages.integrations.title} | RECRUIT4US`, description: t.pages.integrations.lede },
      "/contacto": { title: `${t.pages.contact.title} | RECRUIT4US`, description: t.pages.contact.lede },
      404: { title: `${t.pages.notFound.title} | RECRUIT4US`, description: t.pages.notFound.body },
    };
    for (const [k, v] of Object.entries(table)) {
      if (typeof v.title !== "string" || typeof v.description !== "string" || !v.description) {
        throw new Error(`missing copy for ${k}`);
      }
    }
    return table;
  } catch (e) {
    console.warn(`seo-routes: could not read src/content/es.ts (${e.message}); using the FALLBACK table.`);
    return FALLBACK;
  }
}

const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Replace the content/href attribute of one head tag; fail loudly if the tag is gone from index.html. */
function setTag(html, selector, attr, value) {
  const re = new RegExp(`(<${selector}[^>]*\\s${attr}=")[^"]*(")`, "i");
  if (!re.test(html)) throw new Error(`seo-routes: tag not found in dist/index.html: <${selector} ${attr}>`);
  return html.replace(re, `$1${escAttr(value)}$2`);
}

function render(base, { title, description, url }) {
  let html = base.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(title)}</title>`);
  html = setTag(html, 'meta\\s+name="description"', "content", description);
  html = setTag(html, 'meta\\s+property="og:title"', "content", title);
  html = setTag(html, 'meta\\s+property="og:description"', "content", description);
  if (url) {
    html = setTag(html, 'link\\s+rel="canonical"', "href", url);
    html = setTag(html, 'meta\\s+property="og:url"', "content", url);
  }
  return html;
}

const env = { ...loadEnv("production", ROOT, "VITE_"), ...process.env };
const ORIGIN = (env.VITE_SITE_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
const ROUTES = ["/", "/seguridad", "/integraciones", "/contacto"];

const indexPath = join(DIST, "index.html");
if (!existsSync(indexPath)) {
  console.error("seo-routes: dist/index.html not found; run `vite build` first.");
  process.exit(1);
}
// index.html hard-codes the default origin (canonical, og:image, JSON-LD); rebase it if configured.
const base = readFileSync(indexPath, "utf8").split(DEFAULT_ORIGIN).join(ORIGIN);
const meta = await routeMeta();

for (const route of ROUTES) {
  const url = route === "/" ? `${ORIGIN}/` : `${ORIGIN}${route}`;
  const html = render(base, { ...meta[route], url });
  const dir = route === "/" ? DIST : join(DIST, route.slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  console.log(`seo-routes: ${route === "/" ? "dist/index.html" : `dist${route}/index.html`}  "${meta[route].title}"`);
}

// 404: noindex, no canonical / og:url (the page has no address of its own).
let notFound = render(base, meta[404]);
notFound = notFound
  .replace(/\s*<link\s+rel="canonical"[^>]*>/i, "")
  .replace(/\s*<meta\s+property="og:url"[^>]*>/i, "")
  .replace(/<\/title>/i, '</title>\n    <meta name="robots" content="noindex" />');
writeFileSync(join(DIST, "404.html"), notFound);
console.log("seo-routes: dist/404.html (noindex)");

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  (r) => `  <url>
    <loc>${ORIGIN}${r === "/" ? "/" : r}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${r === "/" ? "1.0" : "0.7"}</priority>
  </url>`,
).join("\n")}
</urlset>
`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`seo-routes: dist/sitemap.xml, dist/robots.txt (origin ${ORIGIN})`);
