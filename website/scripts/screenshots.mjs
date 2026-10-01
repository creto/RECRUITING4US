#!/usr/bin/env node
/**
 * Visual QA capture. Usage:
 *   node scripts/screenshots.mjs [--base http://127.0.0.1:5190] [--path /] [--widths 1440,390]
 *        [--themes light,dark] [--at 0,1200,2400 | --sections inicio,pipeline] [--wait 4500] [--out artifacts/qa]
 * Prints console errors per page and exits 1 if any uncaught error occurred.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => (v.startsWith("--") ? [...acc, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "1"]] : acc), []),
);
const base = args.base ?? "http://127.0.0.1:5190";
const path = args.path ?? "/";
const widths = (args.widths ?? "1440,390").split(",").map(Number);
const themes = (args.themes ?? "light").split(",");
const at = args.at ? args.at.split(",").map(Number) : null;
const sections = args.sections ? args.sections.split(",") : null;
const wait = Number(args.wait ?? 4500);
const out = args.out ?? "artifacts/qa";
const full = args.full === "1";
const reduce = args.reduce === "1";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let failed = false;
for (const w of widths) {
  for (const theme of themes) {
    const h = w < 600 ? 844 : w < 1100 ? 1024 : 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: reduce ? "reduce" : "no-preference", colorScheme: theme === "dark" ? "dark" : "light" });
    await ctx.addInitScript((t) => localStorage.setItem("r4-theme", t), theme);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(wait);
    const tag = `${path.replace(/\W+/g, "_") || "home"}-${w}-${theme}${reduce ? "-rm" : ""}`;
    if (full) {
      await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });
    }
    const stops = sections ?? at ?? [0];
    for (const stop of stops) {
      if (typeof stop === "number") await page.evaluate((y) => window.scrollTo(0, y), stop);
      else await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "start" }), stop);
      await page.waitForTimeout(Number(args.settle ?? 1500));
      await page.screenshot({ path: `${out}/${tag}-${stop}.png` });
    }
    if (errors.length) {
      failed = true;
      console.log(`[${tag}] errors:\n  ` + errors.join("\n  "));
    } else console.log(`[${tag}] ok`);
    await ctx.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
