import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODING_BANK } from "../../domain/coding-bank.ts";
import { PERSONALITY_ITEMS } from "../../domain/personality.ts";
import { MENTAL_MATH } from "../../domain/mental-math.ts";
import { translateText } from "./translate.ts";

describe("spanish", () => {
  it("translates the exam chrome and leaves english when asked", () => {
    assert.equal(translateText("Next", "es"), "Siguiente");
    assert.equal(translateText("Next", "en"), "Next");
    assert.equal(translateText("  Submit  ", "es"), "  Enviar  ");
  });

  it("translates mental math without changing the numbers", () => {
    for (const item of MENTAL_MATH) {
      const spanish = translateText(item.prompt, "es");
      assert.notEqual(spanish, item.prompt);
      assert.match(spanish, /Escribe solo los dígitos/);
    }
  });

  it("translates every personality statement and coding prompt", () => {
    for (const item of PERSONALITY_ITEMS) {
      assert.notEqual(translateText(item.prompt, "es"), item.prompt);
    }
    for (const item of CODING_BANK) {
      const spanish = translateText(item.prompt, "es");
      assert.notEqual(spanish, item.prompt, item.title);
      assert.match(spanish, /Escribe `/);
      assert.match(spanish, /Ejemplo/);
    }
  });
});
