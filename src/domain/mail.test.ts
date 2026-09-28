import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCc, renderMail } from "./mail.ts";

describe("mail suite", () => {
  it("fills known tokens and leaves unknown ones", () => {
    const text = renderMail("Hello {{candidate_name}} at {{company_name}}. {{unknown}}", {
      candidate_name: "Amina",
      company_name: "Northstar",
    });
    assert.equal(text, "Hello Amina at Northstar. {{unknown}}");
  });

  it("rejects a bad copy address and keeps three", () => {
    assert.equal("error" in parseCc("not-an-email"), true);
    const parsed = parseCc("a@firm.example, B@firm.example");
    assert.deepEqual("emails" in parsed ? parsed.emails : [], ["a@firm.example", "b@firm.example"]);
  });
});
