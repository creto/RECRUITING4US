import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_EMBED_THEME, companyCssVars, contrastRatio, embedCssVars, embedTheme } from "./embed-theme.ts";

describe("embed theme", () => {
  it("defaults to a white apply box", () => {
    const theme = embedTheme(null);
    assert.equal(theme.background, "#ffffff");
    assert.equal(theme.ink, DEFAULT_EMBED_THEME.ink);
    assert.equal(theme.accent, "#cefa90");
    assert.equal(embedCssVars(undefined)["--color-bg"], "#ffffff");
  });

  it("keeps a company palette and rejects anything that is not a color", () => {
    const theme = embedTheme({
      background: "#112233",
      ink: "#F4F8EE",
      accent: "red",
      accentInk: "#ffffff",
    });
    assert.equal(theme.background, "#112233");
    assert.equal(theme.ink, "#f4f8ee");
    assert.equal(theme.accent, DEFAULT_EMBED_THEME.accent);
    assert.match(theme.muted, /^#[0-9a-f]{6}$/);
    assert.notEqual(theme.line, theme.background);
  });

  it("paints the company page without touching an invalid color", () => {
    const vars = companyCssVars({ background: "#112233", ink: "#f4f8ee", accent: "#78dd55", accentInk: "#04140c" });
    assert.equal(vars["--color-bg"], "#112233");
    assert.equal(vars["--color-accent"], "#78dd55");
    assert.notEqual(vars["--color-sidebar"], vars["--color-bg"]);
    assert.ok(contrastRatio("#000000", "#ffffff") > 4.5);
    assert.ok(contrastRatio("#777777", "#767676") < 4.5);
  });
});
