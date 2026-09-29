import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clipSignalText, describeLiveSignal, liveSignalKind } from "./live-watch.ts";

describe("live watch", () => {
  it("names screens, tab changes, and the copied text without keeping a novel", () => {
    assert.equal(liveSignalKind("COPY"), "COPY");
    assert.equal(liveSignalKind("camera"), null);
    assert.equal(describeLiveSignal("SCREENS", "2 screens connected."), "2 screens connected.");
    assert.equal(describeLiveSignal("LEFT_APP", ""), "Left the page or switched tabs.");
    assert.equal(describeLiveSignal("COPY", "function solve() { return 1 }"), "Copied: function solve() { return 1 }");
    assert.equal(describeLiveSignal("PASTE", ""), "Pasted, but the text was not available.");
    const long = clipSignalText(`${"a".repeat(300)}`);
    assert.equal(long.length, 241);
    assert.match(describeLiveSignal("COPY", long), /^Copied: a+…$/);
  });
});
