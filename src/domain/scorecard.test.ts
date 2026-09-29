import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { focusAttributes, parseAttributes, rankScoreboard, submissionError } from "./scorecard.ts";

describe("scorecards", () => {
  it("keeps recruiter attributes and requires a focus", () => {
    const attributes = parseAttributes("System design, SQL, System design");
    assert.deepEqual(attributes.map((item) => item.id), ["system-design", "sql"]);
    const missing = focusAttributes(attributes, []);
    assert.equal("attributes" in missing && missing.attributes.length, 2);
    const unknown = focusAttributes(attributes, ["missing"]);
    assert.equal("error" in unknown, true);
    const focus = focusAttributes(attributes, ["sql"]);
    assert.equal("attributes" in focus && focus.attributes.length, 1);
  });

  it("requires every focus rating, a recommendation, and a note", () => {
    const attributes = [{ id: "sql", label: "SQL" }];
    assert.match(submissionError({ attributes, ratings: {}, recommendation: "yes", notes: "Clear SQL examples." }) ?? "", /focus attribute/);
    assert.equal(submissionError({
      attributes,
      ratings: { sql: "strong_yes" },
      recommendation: "strong_yes",
      notes: "Walked through an index choice.",
    }), null);
  });

  it("ranks by the average recommendation and shares a tie", () => {
    const ranked = rankScoreboard([
      { applicationId: "b", recommendations: ["yes"] },
      { applicationId: "a", recommendations: ["strong_yes", "strong_yes"] },
      { applicationId: "c", recommendations: [] },
      { applicationId: "d", recommendations: ["yes"] },
    ]);
    assert.equal(ranked[0]?.applicationId, "a");
    assert.equal(ranked[0]?.rank, 1);
    assert.equal(ranked[1]?.rank, 2);
    assert.equal(ranked[2]?.rank, 2);
    assert.equal(ranked[1]?.tied, true);
    assert.equal(ranked[3]?.rank, null);
    assert.equal(ranked[3]?.applicationId, "c");
  });
});
