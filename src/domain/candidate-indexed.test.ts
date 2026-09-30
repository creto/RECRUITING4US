import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Mirrors listCandidates: search may omit indexed_text, but is_indexed stays. */
function candidateIndexed(row: { is_indexed: boolean; indexed_text: string | null }) {
  return Boolean(row.is_indexed);
}

describe("Candidates UI indexed flag", () => {
  it("shows indexed when profile has text even if search omitted indexed_text", () => {
    assert.equal(
      candidateIndexed({ is_indexed: true, indexed_text: null }),
      true,
      "default Candidates list must not look like 'No indexed CV yet'",
    );
  });

  it("keeps not-indexed when the profile has no text", () => {
    assert.equal(candidateIndexed({ is_indexed: false, indexed_text: null }), false);
  });

  it("regression: old Boolean(indexed_text) lied on the default list", () => {
    const searching = false;
    const profileText = "Juan David Cortes\nSkills: python, sql, excel";
    const indexed_text = searching ? profileText : null;
    assert.equal(Boolean(indexed_text), false, "pre-fix bug: always false when not searching");
    assert.equal(candidateIndexed({ is_indexed: profileText.trim() !== "", indexed_text }), true);
  });
});
