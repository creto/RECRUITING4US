#!/usr/bin/env node
/**
 * Interaction QA: theme toggle, Dock navigation, mobile menu, route change,
 * assessment slider keyboard, Boolean search. Screenshots → artifacts/qa/ix-*.
 * Usage: node scripts/qa-interactions.mjs [--base http://127.0.0.1:5190]
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const base = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "http://127.0.0.1:5190";
const out = "artifacts/qa";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);

// Desktop
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    check(`axe (${theme}) no serious/critical violations`, serious.length === 0, serious.map((v) => `${v.id}×${v.nodes.length} [${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}]`).join("; "));
  }
  await page.evaluate(() => (document.documentElement.dataset.theme = "light"));

  await page.click('button[role="switch"]');
  await page.waitForTimeout(900);
  const theme = await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("r4-theme")]);
  check("theme toggle switches and persists", theme[0] === "dark" && theme[1] === "dark", theme.join(","));
  await page.screenshot({ path: `${out}/ix-theme-dark.png` });

  await page.click('nav[aria-label="Recorrido de la página"] a[href="#evaluaciones"]');
  await page.waitForTimeout(2200);
  const top = await page.evaluate(() => Math.round(document.getElementById("evaluaciones").getBoundingClientRect().top));
  check("dock scrolls to section", Math.abs(top) < 120, `top=${top}`);
  const current = await page.getAttribute('nav[aria-label="Recorrido de la página"] a[aria-current]', "href");
  check("dock marks current section", current === "#evaluaciones", String(current));

  const region = page.locator('#evaluaciones [aria-roledescription="carrusel"]');
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(800);
  const selected = await page.locator('#evaluaciones [role="tab"][aria-selected="true"]').textContent();
  check("assessment slider keyboard", selected?.trim() === "Evidencia", String(selected));
  await page.screenshot({ path: `${out}/ix-assess-step.png` });

  await page.evaluate(() => document.getElementById("cv").scrollIntoView());
  await page.waitForTimeout(1200);
  const input = page.locator("#cv input");
  await input.fill("(React OR Vue) AND TypeScript");
  await page.waitForTimeout(400);
  const status = await page.locator("#cv-status").textContent();
  check("boolean search result", /1\s*coincidencias/.test(status ?? ""), String(status));
  await input.fill('"machine learning');
  await page.waitForTimeout(300);
  const err = await page.locator("#cv-status").textContent();
  check("boolean search error message", /comilla/.test(err ?? ""), String(err));

  await page.click('header a[href="/seguridad"]');
  await page.waitForTimeout(1500);
  check("route change to /seguridad", page.url().endsWith("/seguridad"), page.url());
  const title = await page.title();
  check("route title", /Seguridad/.test(title), title);
  await ctx.close();
}

// Mobile
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile no horizontal overflow", overflow <= 0, `overflow=${overflow}`);
  await page.click('button[aria-controls="mobile-sheet"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/ix-mobile-menu.png` });
  const open = await page.getAttribute('button[aria-controls="mobile-sheet"]', "aria-expanded");
  check("mobile menu opens", open === "true");
  await page.click('#mobile-sheet a[href="#pipeline"]');
  await page.waitForTimeout(2000);
  const top = await page.evaluate(() => Math.round(document.getElementById("pipeline").getBoundingClientRect().top));
  check("mobile menu navigates", Math.abs(top) < 140, `top=${top}`);
  await ctx.close();
}

// Reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const lenis = await page.evaluate(() => document.documentElement.classList.contains("lenis"));
  check("reduced motion disables Lenis", !lenis);
  await page.screenshot({ path: `${out}/ix-reduced-hero.png` });
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
if (errors.length) console.log("page errors:\n  " + errors.join("\n  "));
process.exit(results.some((r) => r.startsWith("FAIL")) || errors.length ? 1 : 0);
