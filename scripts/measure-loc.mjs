#!/usr/bin/env node
/**
 * Handwritten line count for RECRUIT4US.
 * Counts nonblank lines that are not comment-only.
 * Excludes node_modules, build output, lockfiles, and generated route trees.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const groups = {
  application: [
    "src/domain/rules.ts",
    "src/domain/exclusive.ts",
    "src/domain/completion.ts",
    "src/server",
    "src/components/talent",
    "src/routes",
    "src/styles.css",
  ],
  tests: [
    "src/domain/rules.test.ts",
    "src/domain/schema.invariants.test.ts",
    "src/domain/completion.test.ts",
  ],
  migrations: [
    "migrations/0002_talentflow.sql",
    "migrations/0003_outbox_and_question_types.sql",
    "migrations/0004_completion.sql",
  ],
  scripts: ["scripts/measure-loc.mjs", "scripts/copy-pglite-assets.mjs", "scripts/outbox-worker.mjs"],
};

function skip(path) {
  return path.endsWith("routeTree.gen.ts") || path.includes("/api/auth/");
}

async function filesIn(entry) {
  const full = join(root, entry);
  const info = await stat(full);
  if (info.isFile()) return [full];
  const out = [];
  for (const name of await readdir(full, { withFileTypes: true })) {
    if (name.name === "node_modules" || name.name.startsWith(".")) continue;
    const child = join(full, name.name);
    if (name.isDirectory()) out.push(...(await filesIn(relative(root, child))));
    else out.push(child);
  }
  return out;
}

function countable(line) {
  const text = line.trim();
  if (!text) return false;
  if (text.startsWith("//") || text.startsWith("*") || text.startsWith("/*") || text.startsWith("*/")) return false;
  if (text.startsWith("--")) return false;
  return true;
}

const report = {};
let total = 0;
for (const [group, entries] of Object.entries(groups)) {
  let lines = 0;
  const seen = new Set();
  for (const entry of entries) {
    for (const file of await filesIn(entry)) {
      const rel = relative(root, file);
      if (skip(rel) || seen.has(rel)) continue;
      if (!/\.(ts|tsx|mjs|sql|css)$/.test(rel)) continue;
      seen.add(rel);
      const body = await readFile(file, "utf8");
      lines += body.split("\n").filter(countable).length;
    }
  }
  report[group] = lines;
  total += lines;
}

const payload = {
  product: "RECRUIT4US",
  measuredAt: new Date().toISOString(),
  definition: "nonblank, non-comment-only lines; excludes node_modules, lockfiles, generated route tree, and platform auth routes",
  groups: report,
  total,
};
console.log(JSON.stringify(payload, null, 2));
