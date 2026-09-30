import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCc, parseRecipient, renderMail } from "./mail.ts";

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

  it("accepts an outside inbox that is not the account email", () => {
    const plain = parseRecipient("oscar@gmail.com");
    assert.equal("email" in plain ? plain.email : "", "oscar@gmail.com");
    const named = parseRecipient("Oscar Alvarez <Oscar@gmail.com>");
    assert.equal("email" in named ? named.email : "", "oscar@gmail.com");
    assert.equal("error" in parseRecipient("not-an-email"), true);
  });
});
