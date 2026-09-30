import assert from "node:assert/strict";
import test from "node:test";
import { companyBrandLogoUrl } from "./company-brand";

test("tiglobal uses the hosted green chevron GIF", () => {
  assert.equal(companyBrandLogoUrl("tiglobal"), "/companies/tiglobal-logo.gif");
  assert.equal(companyBrandLogoUrl("TIGLOBAL"), "/companies/tiglobal-logo.gif");
});

test("stored https URL wins over the hosted map", () => {
  assert.equal(
    companyBrandLogoUrl("tiglobal", "https://cdn.example/logo.png"),
    "https://cdn.example/logo.png",
  );
});

test("unknown companies have no default logo", () => {
  assert.equal(companyBrandLogoUrl("acme"), "");
});
