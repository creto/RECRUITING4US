#!/usr/bin/env node
/**
 * Render smoke test for every public route, desktop and mobile.
 * Checks: the page has a visible h1 and real text in <main>, no uncaught
 * errors or console errors, no failed same-origin requests (4xx/5xx, wrong
 * MIME for module scripts), no horizontal overflow on mobile.
 * Usage: node scripts/smoke.mjs [--base http://127.0.0.1:5190]
 * Prints a JSON verdict; exits 1 on any failure.
 */
import { chromium } from "playwright";

const i = process.argv.indexOf("--base");
const base = i > -1 ? process.argv[i + 1] : "http://127.0.0.1:5190";
const ROUTES = ["/", "/seguridad", "/integraciones", "/contacto", "/no-existe"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const results = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const problems = [];
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
    page.on("response", (r) => {
      const url = r.url();
      if (!url.startsWith(base)) return;
      const status = r.status();
      const isNotFoundPage = route === "/no-existe" && r.request().resourceType() === "document";
      if (status >= 400 && !isNotFoundPage) problems.push(`http ${status}: ${url.slice(base.length)}`);
      const type = r.headers()["content-type"] ?? "";
      if (r.request().resourceType() === "script" && type.includes("text/html")) problems.push(`script served as HTML: ${url.slice(base.length)}`);
    });
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const r = h1?.getBoundingClientRect();
      return {
        h1: h1?.textContent?.trim().slice(0, 80) ?? "",
        h1Visible: !!r && r.width > 0 && r.height > 0 && getComputedStyle(h1).visibility !== "hidden",
        textLength: document.querySelector("main")?.innerText.trim().length ?? 0,
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        title: document.title,
      };
    });
    if (!info.h1Visible) problems.push("no visible h1");
    const minText = route === "/no-existe" ? 60 : 200; // the 404 page is short by design
    if (info.textLength < minText) problems.push(`main has little text (${info.textLength})`);
    if (vp.name === "mobile" && info.overflowX > 1) problems.push(`horizontal overflow ${info.overflowX}px`);
    results.push({ viewport: vp.name, route, ok: problems.length === 0, title: info.title, h1: info.h1, problems });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
const ok = results.every((r) => r.ok);
console.log(JSON.stringify({ base, ok, results }, null, 2));
process.exit(ok ? 0 : 1);
