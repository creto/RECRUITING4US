#!/usr/bin/env node
/**
 * Forbidden-claims scanner (npm run claims).
 *
 * Rules come from the "Forbidden claims (scanner list)" table in
 * docs/marketing-claims.md (see scripts/claims-lib.mjs). Scans every .ts,
 * .tsx and .css file under src/ plus index.html, line by line, skipping
 * comment-only lines (// or * or /*). Prints file:line, rule and match.
 *
 * Exit 1 on any "block" match; "warn" matches are printed only.
 * Owner-approved exceptions live in scripts/claims-allowlist.json as
 * { id, file, contains, reason }: a hit is allowed when the rule id and
 * file match and the matched text contains (or is contained in) `contains`,
 * case-insensitively.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { findClaims, isCommentLine, loadRules } from "./claims-lib.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ALLOWLIST = join(ROOT, "scripts", "claims-allowlist.json");
const EXT = /\.(ts|tsx|css)$/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p).split(sep).join("/");

const rules = loadRules();
const allow = existsSync(ALLOWLIST) ? JSON.parse(readFileSync(ALLOWLIST, "utf8")) : [];
for (const a of allow) {
  if (!a.id || !a.file || !a.contains || !a.reason) {
    console.error(`claims: allowlist entry needs id, file, contains and reason: ${JSON.stringify(a)}`);
    process.exit(2);
  }
}
const allowUsed = new Set();

function allowed(file, hit) {
  const m = hit.match.toLowerCase();
  const i = allow.findIndex((a) => {
    if (a.id !== hit.id || a.file !== file) return false;
    const c = a.contains.toLowerCase();
    return m.includes(c) || c.includes(m);
  });
  if (i >= 0) allowUsed.add(i);
  return i >= 0;
}

const files = [...walk(join(ROOT, "src")), join(ROOT, "index.html")].filter(existsSync);
let blocks = 0;
let warns = 0;
let allowedCount = 0;

for (const abs of files) {
  const file = rel(abs);
  const lines = readFileSync(abs, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (isCommentLine(line)) return;
    for (const hit of findClaims(line, rules)) {
      if (allowed(file, hit)) {
        allowedCount++;
        continue;
      }
      const tag = hit.level === "block" ? "BLOCK" : "warn ";
      console.log(`${tag} ${file}:${i + 1}  ${hit.id} (${hit.topic})  "${hit.match}"`);
      if (hit.level === "block") blocks++;
      else warns++;
    }
  });
}

allow.forEach((a, i) => {
  if (!allowUsed.has(i)) console.log(`note  allowlist entry unused: ${a.id} ${a.file} "${a.contains}"`);
});

console.log(
  `\nclaims: ${rules.length} rules, ${files.length} files. ${blocks} block, ${warns} warn, ${allowedCount} allowlisted.`,
);
process.exit(blocks > 0 ? 1 : 0);
