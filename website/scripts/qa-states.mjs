#!/usr/bin/env node
/**
 * Capture one section at several scroll offsets and/or after clicking
 * controls. Usage:
 *   node scripts/qa-states.mjs --id sourcing [--offsets -200,0,400] [--click "#sourcing button"]
 *        [--width 1440] [--theme light] [--out artifacts/qa/states] [--reduce 1]
 * --offsets are pixels relative to the section top reaching the viewport top.
 * --click captures one frame per matching element, after clicking it.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => (v.startsWith("--") ? [...acc, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "1"]] : acc), []),
);
const base = args.base ?? "http://127.0.0.1:5190";
const id = args.id ?? "inicio";
const width = Number(args.width ?? 1440);
const theme = args.theme ?? "light";
const out = args.out ?? "artifacts/qa/states";
const offsets = args.offsets ? args.offsets.split(",").map(Number) : [0];
const settle = Number(args.settle ?? 1600);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const height = width < 600 ? 844 : width < 1100 ? 1024 : 900;
const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: args.reduce === "1" ? "reduce" : "no-preference", colorScheme: theme === "dark" ? "dark" : "light" });
await ctx.addInitScript((t) => localStorage.setItem("r4-theme", t), theme);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
await page.goto(base + (args.path ?? "/"), { waitUntil: "networkidle" });
await page.waitForTimeout(Number(args.wait ?? 2500));

const top = await page.evaluate((sid) => {
  const el = document.getElementById(sid);
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
}, id);
const tag = `${id}-${width}-${theme}${args.reduce === "1" ? "-rm" : ""}`;
for (const off of offsets) {
  await page.evaluate((y) => window.scrollTo(0, y), top + off);
  await page.waitForTimeout(settle);
  await page.screenshot({ path: `${out}/${tag}-at${off}.png` });
}
if (args.click) {
  const n = await page.locator(args.click).count();
  for (let i = 0; i < n; i++) {
    await page.locator(args.click).nth(i).click();
    await page.waitForTimeout(settle);
    await page.screenshot({ path: `${out}/${tag}-click${i}.png` });
  }
}
console.log(errors.length ? `[${tag}] errors:\n  ${errors.join("\n  ")}` : `[${tag}] ok`);
await browser.close();
process.exit(errors.length ? 1 : 0);
