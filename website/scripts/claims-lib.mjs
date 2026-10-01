/**
 * Shared parser for the forbidden-claims table in docs/marketing-claims.md.
 * Used by scripts/check-claims.mjs (npm run claims) and tests/copy.test.ts.
 *
 * The table lives in the first fenced block after "## Forbidden claims".
 * Columns: ID | LEVEL | TOPIC | REGEX. The regex itself contains "|", so
 * columns 4+ are joined back with "|". Flags are always "iu".
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Pass the string, not `new URL(...)`: under vitest + jsdom the global URL is
// jsdom's, which node:url's fileURLToPath rejects.
const HERE = dirname(fileURLToPath(import.meta.url));
export const CLAIMS_DOC = resolve(HERE, "../docs/marketing-claims.md");

/** Parse the rule table out of the markdown source. Throws if the block is missing or empty. */
export function parseRules(markdown) {
  const start = markdown.search(/^##\s+Forbidden claims/m);
  if (start < 0) throw new Error('claims: "## Forbidden claims" heading not found');
  const rest = markdown.slice(start);
  const fence = rest.match(/```[^\n]*\n([\s\S]*?)\n```/);
  if (!fence) throw new Error("claims: fenced rule block not found after the heading");

  const rules = [];
  for (const raw of fence[1].split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const cols = line.split("|");
    if (cols.length < 4) continue;
    const id = cols[0].trim();
    const level = cols[1].trim().toLowerCase();
    if (id.toUpperCase() === "ID") continue; // header row
    if (level !== "block" && level !== "warn") throw new Error(`claims: rule ${id} has unknown level "${level}"`);
    const topic = cols[2].trim();
    const source = cols.slice(3).join("|").trim();
    let re;
    try {
      re = new RegExp(source, "iu");
    } catch (e) {
      throw new Error(`claims: rule ${id} has an invalid regex: ${e.message}`, { cause: e });
    }
    rules.push({ id, level, topic, source, re });
  }
  if (rules.length === 0) throw new Error("claims: no rules parsed");
  return rules;
}

/** Read and parse docs/marketing-claims.md. */
export function loadRules(docPath = CLAIMS_DOC) {
  return parseRules(readFileSync(docPath, "utf8"));
}

/** Every match of every rule in one piece of text (line-oriented rules; pass one line at a time). */
export function findClaims(text, rules) {
  const hits = [];
  for (const rule of rules) {
    const global = new RegExp(rule.source, "giu");
    for (const m of text.matchAll(global)) {
      if (m[0] === "") continue;
      hits.push({ id: rule.id, level: rule.level, topic: rule.topic, match: m[0], index: m.index ?? 0 });
    }
  }
  return hits;
}

/** Comment-only lines (doc comments that explain the rules) are not shipped copy. */
export function isCommentLine(line) {
  const t = line.trimStart();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}
