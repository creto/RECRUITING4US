import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_EMBED_THEME, embedCssVars, embedTheme } from "./embed-theme.ts";

describe("embed theme", () => {
  it("defaults to a white apply box", () => {
    const theme = embedTheme(null);
    assert.equal(theme.background, "#ffffff");
    assert.equal(theme.ink, DEFAULT_EMBED_THEME.ink);
    assert.equal(theme.accent, "#036145");
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
});
