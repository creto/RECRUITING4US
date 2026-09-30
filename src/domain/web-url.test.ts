import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeWebsiteUrl, websiteHref } from "./web-url.ts";

describe("website urls", () => {
  it("keeps a full https link", () => {
    const result = normalizeWebsiteUrl("https://portfolio.example/ada");
    assert.equal("url" in result ? result.url : "", "https://portfolio.example/ada");
  });

  it("adds https when a webpage is pasted without a scheme", () => {
    const result = normalizeWebsiteUrl("www.oscar.dev/work");
    assert.equal("url" in result ? result.url : "", "https://www.oscar.dev/work");
  });

  it("pulls the link out of a pasted page title", () => {
    const result = normalizeWebsiteUrl("Oscar Alvarez — Portfolio\nhttps://oscar.example/site");
    assert.equal("url" in result ? result.url : "", "https://oscar.example/site");
  });

  it("reads an href from pasted html", () => {
    const result = normalizeWebsiteUrl('<a href="https://jobs.example/me">Portfolio</a>');
    assert.equal("url" in result ? result.url : "", "https://jobs.example/me");
  });

  it("rejects a non-web scheme", () => {
    const result = normalizeWebsiteUrl("javascript:alert(1)");
    assert.equal("error" in result, true);
  });

  it("links a stored website and ignores a sentence", () => {
    assert.equal(websiteHref("example.com/folio"), "https://example.com/folio");
    assert.equal(websiteHref("I built this last year at a company"), null);
  });
});
