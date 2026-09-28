import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applicantNotice, applicationReceipt, applicationSheetCsv, cvResultLabel } from "./sheet.ts";

describe("application sheet", () => {
  it("builds a receipt and a CSV row for the essay", () => {
    assert.equal(applicationReceipt("abc-1234-zzzz"), "R-ABC1234Z");
    const csv = applicationSheetCsv(
      [{ id: "why", label: "Why this role?" }],
      [{
        receipt: "R-ABC1234Z",
        submittedAt: "2026-09-28T12:00:00Z",
        name: "Ada, Lovelace",
        email: "ada@example.com",
        phone: "",
        cvName: "ada.pdf",
        cvResult: "good fit; assessment sent",
        answers: { why: "I ship TypeScript" },
      }],
    );
    assert.match(csv, /receipt,submitted_at,name,email,phone,cv_file,cv_result,Why this role\?/);
    assert.match(csv, /"Ada, Lovelace"/);
    assert.match(csv, /I ship TypeScript/);
    assert.equal(csv.includes("=cmd"), false);
  });

  it("neutralizes a spreadsheet formula in an answer", () => {
    const csv = applicationSheetCsv([], [{
      receipt: "R-1",
      submittedAt: "2026-09-28T12:00:00Z",
      name: "Ada",
      email: "ada@example.com",
      phone: "",
      cvName: "",
      cvResult: "no cv",
      answers: { why: "=1+1" },
    }]);
    assert.match(csv, /'=1\+1/);
  });

  it("does not tell the applicant which skill was missing, and does not claim an email was sent", () => {
    assert.equal(cvResultLabel("NOT_A_FIT", "DO_NOT_SEND", true), "not a fit; assessment not sent");
    assert.equal(cvResultLabel("GOOD", "SEND", true), "good fit; assessment sent");
    assert.equal(cvResultLabel(null, null, false), "no cv");
    const notice = applicantNotice({
      alreadyApplied: false,
      receipt: "R-ABC",
      cvResult: "not a fit; assessment not sent",
    });
    assert.equal(notice.title, "Form complete");
    assert.equal(notice.lines.some((line) => /SQL|missing/i.test(line)), false);
    assert.equal(notice.lines.some((line) => line.includes("not emailed")), true);
  });
});
