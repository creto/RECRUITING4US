#!/usr/bin/env node
/**
 * Renders the Spanish share card, public/og-es.jpg (1200×630), with Playwright.
 * Usage: npm run og
 *
 * Composition: the official mark (public/brand/mark.png, used as-is, never
 * redrawn), the RECRUIT4US wordmark in Bricolage Grotesque, the headline, and
 * the candidate journey as a thin path with eight stage nodes coloured through
 * the four brand greens, over forest black with the four-colour horizon bar.
 * No candidate data appears on the card.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "public", "og-es.jpg");
const W = 1200;
const H = 630;

const b64 = (p) => readFileSync(join(ROOT, p)).toString("base64");
const mark = `data:image/png;base64,${b64("public/brand/mark.png")}`;
const bricolage = `data:font/woff2;base64,${b64("node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2")}`;

const GREENS = ["#036145", "#04A764", "#78DD55", "#D0FA8E"];
const STAGES = ["Descubrir", "Postular", "Filtrar", "Evaluar", "Entrevistar", "Revisar", "Ofertar", "Incorporar"];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(t) {
  const seg = Math.min(GREENS.length - 2, Math.floor(t * (GREENS.length - 1)));
  const local = t * (GREENS.length - 1) - seg;
  const a = hex(GREENS[seg]);
  const b = hex(GREENS[seg + 1]);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * local)).join(",")})`;
}

// Journey path: a long, shallow rise from left to right (the candidate moves forward and up).
const X0 = 96;
const X1 = W - 96;
const Y = (x) => {
  const u = (x - X0) / (X1 - X0);
  return 496 - 34 * u + 9 * Math.sin(u * Math.PI * 2.2);
};
const pts = [];
for (let x = X0 - 40; x <= X1 + 40; x += 4) pts.push(`${x.toFixed(1)},${Y(x).toFixed(1)}`);
const nodes = STAGES.map((name, i) => {
  const t = i / (STAGES.length - 1);
  const x = X0 + t * (X1 - X0);
  return { name, i, t, x, y: Y(x), color: mix(t) };
});

const nodeSvg = nodes
  .map(
    (n) => `
    <g>
      <circle cx="${n.x}" cy="${n.y}" r="15" fill="${n.color}" opacity="0.12"/>
      <circle cx="${n.x}" cy="${n.y}" r="6.5" fill="#020d09" stroke="${n.color}" stroke-width="2"/>
      <circle cx="${n.x}" cy="${n.y}" r="2.6" fill="${n.color}"/>
      <line x1="${n.x}" y1="${n.y + 16}" x2="${n.x}" y2="${n.y + 30}" stroke="${n.color}" stroke-opacity="0.45" stroke-width="1"/>
    </g>`,
  )
  .join("");

const labels = nodes
  .map(
    (n) => `
    <div class="stage" style="left:${n.x}px; top:${n.y + 38}px; --c:${n.color}">
      <span class="num">${String(n.i + 1).padStart(2, "0")}</span>
      <span class="name">${n.name}</span>
    </div>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<style>
  @font-face { font-family: "Bricolage"; src: url(${bricolage}) format("woff2"); font-weight: 200 800; font-stretch: 75% 100%; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; background: #020d09; overflow: hidden; }
  body { position: relative; font-family: "Bricolage", sans-serif; color: #eef5ea; -webkit-font-smoothing: antialiased; }
  .glow { position: absolute; inset: 0;
    background:
      radial-gradient(640px 420px at 92% 108%, rgba(120,221,85,0.16), transparent 70%),
      radial-gradient(760px 520px at -6% 120%, rgba(3,97,69,0.55), transparent 70%),
      radial-gradient(520px 320px at 78% -18%, rgba(4,167,100,0.10), transparent 70%); }
  .grid { position: absolute; inset: 0; opacity: 0.5;
    background-image: linear-gradient(to right, rgba(208,250,142,0.045) 1px, transparent 1px);
    background-size: 120px 100%; background-position: 96px 0;
    mask-image: linear-gradient(to bottom, transparent 0%, black 45%, black 80%, transparent 100%); }
  .grain { position: absolute; inset: 0; opacity: 0.16; mix-blend-mode: overlay; }
  header { position: absolute; left: 96px; right: 96px; top: 64px; display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand img { width: 56px; height: auto; display: block; }
  .word { font-weight: 760; font-size: 30px; font-stretch: 80%; letter-spacing: 0.012em; color: #f4f9ef; }
  h1 { position: absolute; left: 92px; top: 150px; width: 1060px; font-weight: 760; font-size: 80px; line-height: 0.96; letter-spacing: -0.035em; font-stretch: 78%; color: #eef5ea; }
  h1 span { display: block; padding-left: calc(var(--i) * 0.55em); }
  .lede { position: absolute; left: 96px; top: 336px; width: 760px; font-size: 21px; line-height: 1.4; font-weight: 400; font-stretch: 100%; color: rgba(238,245,234,0.62); }
  svg.path { position: absolute; left: 0; top: 0; }
  .stage { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; white-space: nowrap; }
  .stage .num { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--c); opacity: 0.9; }
  .stage .name { font-size: 17px; font-weight: 600; font-stretch: 90%; color: rgba(238,245,234,0.82); }
  .horizon { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; display: flex; }
  .horizon i { flex: 1; display: block; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="grid"></div>
  <svg class="grain" width="${W}" height="${H}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>

  <header>
    <div class="brand"><img src="${mark}" alt="" /><span class="word">RECRUIT4US</span></div>
  </header>

  <h1><span style="--i:0">Cada paso de la contratación,</span><span style="--i:1">con evidencia a la vista.</span></h1>
  <p class="lede">Vacantes, postulaciones, evaluaciones, entrevistas y ofertas en un solo espacio. El sistema reúne la evidencia; las personas deciden.</p>

  <svg class="path" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="g" x1="${X0 - 40}" y1="0" x2="${X1 + 40}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${GREENS[0]}" stop-opacity="0"/>
        <stop offset="0.05" stop-color="${GREENS[0]}"/>
        <stop offset="0.36" stop-color="${GREENS[1]}"/>
        <stop offset="0.68" stop-color="${GREENS[2]}"/>
        <stop offset="0.95" stop-color="${GREENS[3]}"/>
        <stop offset="1" stop-color="${GREENS[3]}" stop-opacity="0"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <polyline points="${pts.join(" ")}" fill="none" stroke="url(#g)" stroke-width="6" opacity="0.35" filter="url(#blur)"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="url(#g)" stroke-width="1.6" stroke-linecap="round"/>
    ${nodeSvg}
  </svg>
  ${labels}

  <div class="horizon">${GREENS.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].map((f) => `${f.family}:${f.status}`));
  if (loaded.some((s) => !s.endsWith(":loaded"))) throw new Error(`make-og: font failed to load: ${loaded.join(", ")}`);
  await page.screenshot({ path: OUT, type: "jpeg", quality: 90, clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`make-og: wrote ${OUT}`);
} finally {
  await browser.close();
}
