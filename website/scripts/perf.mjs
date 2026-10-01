#!/usr/bin/env node
/**
 * Performance probe against a running build (npm run build && npm run preview).
 * Reports LCP, CLS, transferred JS/CSS/font/image bytes on first load, long
 * tasks, and an rAF frame-rate sample while scrolling through the page.
 * Headless Chromium uses software GL (SwiftShader), so FPS here is a floor,
 * not a real-GPU number. Usage: node scripts/perf.mjs [--base http://127.0.0.1:5191] [--width 1440]
 */
import { chromium } from "playwright";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const base = arg("--base", "http://127.0.0.1:5191");
const width = Number(arg("--width", "1440"));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__perf = { lcp: 0, cls: 0, longTasks: 0 };
  new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__perf.lcp = e.startTime))).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__perf.cls += e.value; })).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => (window.__perf.longTasks += l.getEntries().length)).observe({ type: "longtask", buffered: true });
});
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(3000);
const initial = await page.evaluate(() => {
  const res = performance.getEntriesByType("resource");
  const sum = (re) => res.filter((r) => re.test(r.name)).reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0);
  return { js: sum(/\.js(\?|$)/), css: sum(/\.css(\?|$)/), font: sum(/\.woff2?(\?|$)/), img: sum(/\.(png|jpe?g|webp|avif|svg)(\?|$)/), ...window.__perf };
});
const fps = await page.evaluate(async () => {
  let frames = 0;
  const t0 = performance.now();
  const H = document.documentElement.scrollHeight;
  await new Promise((done) => {
    const tick = () => {
      frames++;
      const t = performance.now() - t0;
      window.scrollTo(0, (t / 8000) * H);
      if (t < 8000) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
  return frames / 8;
});
const final = await page.evaluate(() => window.__perf);
const kb = (b) => `${(b / 1024).toFixed(1)} kB`;
console.log(JSON.stringify({ width, lcpMs: Math.round(initial.lcp), cls: Number(final.cls.toFixed(4)), firstLoad: { js: kb(initial.js), css: kb(initial.css), fonts: kb(initial.font), images: kb(initial.img) }, longTasksDuringLoad: initial.longTasks, scrollFpsSoftwareGL: Math.round(fps) }, null, 2));
await browser.close();
