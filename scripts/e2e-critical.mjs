import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const port = 8091;
const base = `http://127.0.0.1:${port}`;
const stamp = Date.now().toString(36);
const person = "Dev User";
const interviewTitle = `E2E screen ${stamp}`;
const cvPath = "/tmp/e2e-cv.txt";

writeFileSync(
  cvPath,
  `${person}\nSoftware engineer. Six years of TypeScript, SQL, and PostgreSQL. I design schemas and ship internal React tools.\n`,
);

function waitForLive(child) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      if (Date.now() - started > 90_000) {
        clearInterval(timer);
        reject(new Error("The app did not open /api/health/live."));
      }
      try {
        const response = await fetch(`${base}/api/health/live`);
        if (response.ok) {
          clearInterval(timer);
          resolve();
        }
      } catch {
        if (child.exitCode != null) {
          clearInterval(timer);
          reject(new Error("The app process exited before it was ready."));
        }
      }
    }, 500);
  });
}

async function answerMiniTest(page) {
  const values = ["80", "25", "120", "25"];
  for (let index = 0; index < values.length; index += 1) {
    const input = page.getByRole("textbox", { name: "Your answer" });
    await input.waitFor();
    await input.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(values[index], { delay: 20 });
    const value = await input.inputValue();
    if (value !== values[index]) throw new Error(`Typed ${values[index]} but the field shows "${value}".`);
    if (index < values.length - 1) {
      const jump = page.locator("[aria-label='Questions']").getByRole("button", { name: String(index + 2), exact: true });
      await page.waitForFunction((label) => {
        const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.trim() === label);
        return button instanceof HTMLButtonElement && !button.disabled;
      }, String(index + 2));
      await jump.click();
      const moved = await page.getByText(`${index + 2} / ${values.length}`).waitFor({ timeout: 4_000 }).then(() => true).catch(() => false);
      if (!moved) {
        const body = await page.locator("body").innerText();
        throw new Error(`Did not reach question ${index + 2}.\n${body.slice(0, 500)}`);
      }
    }
  }
  await page.locator("button.min-h-11", { hasText: "Submit" }).click();
  await page.getByRole("heading", { name: "Submission receipt" }).waitFor();
}

async function run() {
  const child = spawn(
    "node",
    ["scripts/with-app-env.mjs", "vite", "dev", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: "/workspace",
      env: {
        ...process.env,
        VITE_AUTH_ENABLED: "false",
        PATH: `/workspace/node_modules/.bin:${process.env.PATH ?? ""}`,
      },
      stdio: "inherit",
    },
  );
  let browser;
  try {
    await waitForLive(child);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(30_000);
    page.on("pageerror", (error) => console.error("PAGE", error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("CONSOLE", msg.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) console.error("HTTP", response.status(), response.url().slice(0, 180));
    });
    const posts = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await page.goto(`${base}/app`, { waitUntil: "networkidle" });
    let posted = false;
    for (let attempt = 0; attempt < 6 && !posted; attempt += 1) {
      await page.getByRole("button", { name: "Open Northstar Labs" }).click();
      posted = await page.waitForRequest((request) => request.method() === "POST", { timeout: 3_000 }).then(() => true).catch(() => false);
    }
    if (!posted) {
      console.error("POSTS", posts.join("\n") || "(none)");
      throw new Error("The demo button did not call the server.");
    }
    await page.waitForURL(/\/app\/northstar-/, { timeout: 180_000 });
    const slug = new URL(page.url()).pathname.split("/")[2];

    await page.goto(`${base}/careers/${slug}`);
    await page.locator("a", { hasText: "Senior Software Engineer — Platform" }).first().click();
    await page.locator('input[type="file"]').setInputFiles(cvPath);
    await page.waitForTimeout(600);
    const submit = page.getByRole("button", { name: "Submit application" });
    const receipt = page.getByRole("heading", { name: /Form complete|already has an application/ });
    await submit.click();
    const started = await receipt.waitFor({ timeout: 2_000 }).then(() => true).catch(() => false);
    if (!started && await submit.isEnabled()) await submit.click();
    await receipt.waitFor({ timeout: 40_000 });

    await page.goto(`${base}/app/${slug}/jobs`);
    await page.locator("a", { hasText: "Senior Software Engineer — Platform" }).first().click();
    await page.getByRole("link", { name: "Pipeline" }).click();
    await page.locator("a", { hasText: person }).last().click();

    await page.getByRole("tab", { name: "Assessments" }).click();
    await page.getByLabel("Assign a published assessment").selectOption({ label: "Numerical reasoning mini-test" });
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await page.getByRole("heading", { name: "Numerical reasoning mini-test" }).waitFor();

    await page.goto(`${base}/candidate`);
    await page.locator("a", { hasText: "Senior Software Engineer — Platform" }).first().click();
    const exam = page.locator("article", { hasText: "Numerical reasoning mini-test" });
    await exam.getByRole("button", { name: "Start assessment" }).first().click();
    await page.waitForURL(/\/candidate\/attempts\//);
    await answerMiniTest(page);

    await page.goto(`${base}/app/${slug}/jobs`);
    await page.locator("a", { hasText: "Senior Software Engineer — Platform" }).first().click();
    await page.getByRole("link", { name: "Pipeline" }).click();
    await page.locator("a", { hasText: person }).last().click();
    await page.getByRole("tab", { name: "Interviews" }).click();
    await page.getByLabel("Title").fill(interviewTitle);
    await page.getByLabel("Local start").fill("2027-08-19T14:00");
    await page.getByLabel("Local end").fill("2027-08-19T15:00");
    await page.getByRole("button", { name: "Schedule" }).click();
    const scheduled = await page.getByRole("heading", { name: interviewTitle }).waitFor({ timeout: 8_000 }).then(() => true).catch(() => false);
    if (!scheduled) {
      const alert = await page.locator("[role='alert']").allInnerTexts();
      throw new Error(`Interview was not scheduled. ${alert.join(" | ")}`);
    }

    await page.goto(`${base}/app/${slug}/interviews`);
    const card = page.locator("li", { has: page.getByRole("heading", { name: interviewTitle }) });
    await card.getByText("Overall recommendation").waitFor({ timeout: 15_000 });
    const groups = card.locator("fieldset");
    const count = await groups.count();
    if (count < 2) {
      const text = await card.innerText();
      throw new Error(`The scorecard did not show a focus rating and an overall recommendation.\n${text.slice(0, 800)}`);
    }
    for (let index = 0; index < count; index += 1) {
      await groups.nth(index).getByRole("button", { name: "Yes", exact: true }).click();
    }
    await card.getByLabel("Written feedback").fill("Clear numerical work and a complete CV.");
    await card.getByRole("button", { name: "Submit scorecard" }).click();
    await card.getByText("This scorecard cannot be edited.").waitFor();

    await page.goto(`${base}/app/${slug}/jobs`);
    await page.locator("a", { hasText: "Senior Software Engineer — Platform" }).first().click();
    await page.getByRole("link", { name: "Pipeline" }).click();
    await page.locator("a", { hasText: person }).last().click();
    await page.getByRole("tab", { name: "Offers" }).click();
    await page.getByLabel("Annual salary (USD)").fill("180000");
    await page.getByLabel("Start date").fill("2026-12-01");
    await page.getByRole("button", { name: "Create offer for approval" }).click();
    await page.getByText("PENDING_APPROVAL").waitFor();
    await page.getByRole("button", { name: "Approve this revision" }).click();
    await page.getByText("APPROVED").waitFor();
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const sent = await page.getByText("SENT").waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
    if (!sent) {
      const alert = await page.locator("[role='alert']").allInnerTexts();
      throw new Error(`Offer was not sent. ${alert.join(" | ")}`);
    }

    await page.goto(`${base}/candidate`);
    await page.locator("a", { hasText: "Senior Software Engineer — Platform" }).first().click();
    await page.getByRole("link", { name: "Review offer" }).waitFor();
    console.log(JSON.stringify({ ok: true, slug, person, interviewTitle }));
  } catch (error) {
    if (browser) {
      mkdirSync("/workspace/artifacts", { recursive: true });
      const pages = browser.contexts().flatMap((context) => context.pages());
      if (pages[0]) {
        console.error(await pages[0].locator("body").innerText().catch(() => ""));
        await pages[0].screenshot({ path: "/workspace/artifacts/e2e-critical.png", fullPage: true }).catch(() => undefined);
      }
    }
    throw error;
  } finally {
    await browser?.close();
    child.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
