import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeAttemptSummary,
  buildAttemptLivePad,
  clipSignalText,
  describeLiveSignal,
  liveSignalKind,
  liveWatchPath,
} from "./live-watch.ts";

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

  it("builds a watch pad from an open attempt and points to /live/$token", () => {
    const pad = buildAttemptLivePad({
      assessmentName: "Coding screen",
      candidateName: "Ada Lovelace",
      jobTitle: "Platform engineer",
      items: [
        { position: 1, type: "code", prompt: "Write solve()", answer: { text: "function solve() { return 2 }\n" } },
        { position: 2, type: "single", prompt: "Pick one", answer: { optionId: "a" } },
        { position: 3, type: "code", prompt: "Harder", answer: null },
      ],
    });
    assert.equal(pad.activeFile, "q1.js");
    assert.match(pad.source, /return 2/);
    assert.equal(pad.files.some((file) => file.name === "progress.md"), true);
    assert.equal(pad.files.some((file) => file.name === "q3.js"), true);
    assert.match(pad.prompt, /Ada Lovelace/);
    assert.equal(liveWatchPath("11111111-1111-1111-1111-111111111111"), "/live/11111111-1111-1111-1111-111111111111");
    assert.equal(
      activeAttemptSummary({ candidateName: "Ada Lovelace", jobTitle: "Platform engineer", assessmentName: "Coding screen" }),
      "Ada Lovelace · Platform engineer · Coding screen",
    );
  });
});
