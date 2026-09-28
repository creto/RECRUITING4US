import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applicationForm, compileBoolean, compileSearch, knockoutResult, parseResumeProfile } from "./cv-index.ts";

describe("cv index", () => {
  it("pulls titles, skills, and years out of the text and keeps a miss out of search", () => {
    const profile = parseResumeProfile(
      "Amina Okonkwo. Software engineer. Skills: TypeScript, SQL. I shipped production services for six years. Based in Lagos.",
    );
    assert.equal(profile.titles.length > 0, true);
    assert.equal(profile.skills.includes("TypeScript") || profile.skills.includes("typescript"), true);
    assert.equal(profile.years, 6);
    assert.equal(profile.history.length > 0, true);
    assert.equal(profile.locations[0]?.toLowerCase().includes("lagos"), true);
    assert.match(profile.note, /original file is unchanged/);

    const hit = compileBoolean("typescript AND (sql OR python) NOT retail");
    assert.equal("match" in hit, true);
    if ("match" in hit) {
      assert.equal(hit.match(profile.indexedText), true);
      assert.equal(hit.match("retail supervisor with spreadsheets"), false);
    }
    const broken = compileBoolean("(typescript");
    assert.equal("error" in broken, true);
    const plain = compileSearch("typescript sql");
    assert.equal(plain != null && "match" in plain && plain.match(profile.indexedText), true);
    const miss = compileSearch("typescript retail");
    assert.equal(miss != null && "match" in miss && miss.match(profile.indexedText), false);
    assert.equal(compileSearch("   "), null);
  });

  it("closes only on the employer's knockout answer", () => {
    const fields = applicationForm({ minYears: 3, requireAuthorization: true }) as {
      id: string;
      label: string;
      knockout?: { min?: number; fail?: string[] };
    }[];
    assert.equal(knockoutResult(fields, { years: "2", work_auth: "Yes" }).closed, true);
    assert.equal(knockoutResult(fields, { years: "4", work_auth: "No" }).closed, true);
    const passed = knockoutResult(fields, { years: "4", work_auth: "Yes" });
    assert.equal(passed.closed, false);
    assert.equal(passed.reason, null);
  });
});
