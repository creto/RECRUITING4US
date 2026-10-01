import { describe, expect, it } from "vitest";
import { es } from "@/content/es";
import { findClaims, loadRules } from "../scripts/claims-lib.mjs";

/** Every string in the copy tree, with its dotted path. */
function strings(node: unknown, path = "es"): Array<[string, string]> {
  if (typeof node === "string") return [[path, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (node && typeof node === "object") return Object.entries(node).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  return [];
}

const all = strings(es);

describe("es.ts copy", () => {
  it("has strings", () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it("has no empty strings", () => {
    expect(all.filter(([, s]) => s.trim() === "").map(([p]) => p)).toEqual([]);
  });

  it('never uses "→" or " · " as separators', () => {
    expect(all.filter(([, s]) => s.includes("→")).map(([p, s]) => `${p}: ${s}`)).toEqual([]);
    expect(all.filter(([, s]) => s.includes(" · ")).map(([p, s]) => `${p}: ${s}`)).toEqual([]);
  });

  it("hero has four lines", () => {
    expect(es.hero.lines).toHaveLength(4);
  });

  it("journey has seven stages", () => {
    expect(es.journey.stages).toHaveLength(7);
  });

  it("interview scale is the four-level recommendation", () => {
    expect(es.interview.scale).toEqual(["Definitivamente no", "No", "Sí", "Definitivamente sí"]);
  });

  it("matches no block-level forbidden claim (docs/marketing-claims.md)", () => {
    const rules = loadRules().filter((r) => r.level === "block");
    expect(rules.length).toBeGreaterThan(20);
    const hits = all.flatMap(([p, s]) => findClaims(s, rules).map((h) => `${p}: ${h.id} "${h.match}"`));
    expect(hits).toEqual([]);
  });
});
