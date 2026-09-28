import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankTopHalf } from "./half.ts";

describe("top half", () => {
  it("keeps one of two, and keeps every person tied on the cutoff", () => {
    const pair = rankTopHalf([
      { id: "a", score: 40 },
      { id: "b", score: 10 },
    ]);
    assert.equal(pair.byId.get("a")?.advanced, true);
    assert.equal(pair.byId.get("b")?.advanced, false);
    assert.equal(pair.byId.get("a")?.rank, 1);

    const tied = rankTopHalf([
      { id: "c", score: 10 },
      { id: "a", score: 8 },
      { id: "b", score: 8 },
    ]);
    assert.equal(tied.cutoff, 8);
    assert.equal(tied.byId.get("c")?.advanced, true);
    assert.equal(tied.byId.get("a")?.advanced, true);
    assert.equal(tied.byId.get("b")?.advanced, true);
    assert.match(tied.note, /tied/);
  });
});
