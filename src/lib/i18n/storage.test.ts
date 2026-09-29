import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LOCALE_KEY, parseStoredLocale, readStoredLocale, writeStoredLocale } from "./storage.ts";

describe("locale storage", () => {
  it("parses only en/es", () => {
    assert.equal(parseStoredLocale("es"), "es");
    assert.equal(parseStoredLocale("en"), "en");
    assert.equal(parseStoredLocale("fr"), null);
    assert.equal(parseStoredLocale(null), null);
  });

  it("prefers localStorage over cookie and defaults to en", () => {
    const storage = {
      getItem(key: string) {
        return key === LOCALE_KEY ? "es" : null;
      },
    };
    assert.equal(readStoredLocale(storage, "recruit4us-locale=en"), "es");
    assert.equal(readStoredLocale(null, "recruit4us-locale=es; path=/"), "es");
    assert.equal(readStoredLocale(null, ""), "en");
  });

  it("writes localStorage and cookie together", () => {
    const saved: Record<string, string> = {};
    let cookie = "";
    writeStoredLocale(
      "es",
      {
        setItem(key: string, value: string) {
          saved[key] = value;
        },
      },
      (value) => {
        cookie = value;
      },
    );
    assert.equal(saved[LOCALE_KEY], "es");
    assert.match(cookie, /^recruit4us-locale=es;/);
  });
});
