import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { describe, it } from "node:test";
import { extractResumeText, parseTerms, screenResume, termPresent } from "./screen.ts";

const REQUIRED = ["TypeScript", "SQL", "PostgreSQL"];
const GOOD = "I have shipped production services in TypeScript for six years. I write SQL and operate PostgreSQL.";

describe("CV screen", () => {
  it("sends only when every must-have skill is present and an assessment is selected", () => {
    const sent = screenResume({
      text: `${GOOD} I also use React.`,
      readable: true,
      scanState: "CLEAN",
      required: REQUIRED,
      preferred: ["React"],
      hasAssessment: true,
    });
    assert.equal(sent.fit, "GOOD");
    assert.equal(sent.action, "SEND");
    assert.deepEqual(sent.missingRequired, []);
    assert.deepEqual(sent.matchedPreferred, ["React"]);

    const held = screenResume({
      text: GOOD,
      readable: true,
      scanState: "CLEAN",
      required: REQUIRED,
      preferred: [],
      hasAssessment: false,
    });
    assert.equal(held.fit, "GOOD");
    assert.equal(held.action, "DO_NOT_SEND");
  });

  it("does not send when a must-have skill is missing", () => {
    const result = screenResume({
      text: "I have shipped production services in TypeScript for six years and I operate PostgreSQL.",
      readable: true,
      scanState: "CLEAN",
      required: REQUIRED,
      preferred: ["React"],
      hasAssessment: true,
    });
    assert.equal(result.fit, "NOT_A_FIT");
    assert.equal(result.action, "DO_NOT_SEND");
    assert.deepEqual(result.missingRequired, ["SQL"]);
  });

  it("does not treat a longer word as the skill", () => {
    assert.equal(termPresent("I use JavaScript and PostgreSQL in production systems.", "Java"), false);
    assert.equal(termPresent("I use JavaScript and PostgreSQL in production systems.", "SQL"), false);
    assert.equal(termPresent("I write SQL for the warehouse every week.", "SQL"), true);
    assert.equal(termPresent("I know the relational   database that the team runs.", "relational database"), true);
  });

  it("does not send when the file cannot be used", () => {
    for (const scanState of ["MISSING", "QUARANTINE", "INFECTED"] as const) {
      const result = screenResume({
        text: GOOD,
        readable: true,
        scanState,
        required: REQUIRED,
        preferred: [],
        hasAssessment: true,
      });
      assert.equal(result.action, "DO_NOT_SEND");
      assert.equal(result.fit, "NEEDS_A_PERSON");
    }
    const empty = screenResume({
      text: null,
      readable: false,
      scanState: "CLEAN",
      required: [],
      preferred: [],
      hasAssessment: true,
    });
    assert.equal(empty.action, "DO_NOT_SEND");
  });

  it("reads plain text and PDF literals, including a compressed stream", () => {
    const plain = extractResumeText("text/plain", new TextEncoder().encode(GOOD));
    assert.equal(plain.readable, true);
    assert.equal(plain.text.includes("TypeScript"), true);

    const short = extractResumeText("text/plain", new TextEncoder().encode("Too short"));
    assert.equal(short.readable, false);

    const pdf = Buffer.from(
      `%PDF-1.1\n1 0 obj\n<< /Length 80 >>\nstream\nBT (${GOOD}) Tj ET\nendstream\nendobj\n`,
      "latin1",
    );
    const read = extractResumeText("application/pdf", pdf);
    assert.equal(read.readable, true);
    assert.equal(read.text.includes("PostgreSQL"), true);

    const body = deflateSync(Buffer.from(`BT (${GOOD}) Tj ET`));
    const packed = Buffer.concat([
      Buffer.from("%PDF-1.4\n1 0 obj\n<< /Filter /FlateDecode /Length "),
      Buffer.from(String(body.length)),
      Buffer.from(" >>\nstream\n"),
      body,
      Buffer.from("\nendstream\nendobj\n"),
    ]);
    const inflated = extractResumeText("application/pdf", packed);
    assert.equal(inflated.readable, true);
    assert.equal(screenResume({
      text: inflated.text,
      readable: inflated.readable,
      scanState: "CLEAN",
      required: REQUIRED,
      preferred: [],
      hasAssessment: true,
    }).action, "SEND");
  });

  it("keeps at most twelve distinct skills", () => {
    const terms = parseTerms("a, TypeScript, typescript, SQL, , PostgreSQL");
    assert.deepEqual(terms, ["TypeScript", "SQL", "PostgreSQL"]);
  });
});
