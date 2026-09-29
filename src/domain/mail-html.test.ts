import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contactBlockHtml,
  editorIsEmpty,
  htmlToPlain,
  looksLikeHtml,
  plainToEditorHtml,
  prepareMailBody,
  sanitizeMailHtml,
} from "./mail-html.ts";
import { buildRfc822 } from "./platform/smtp.ts";

describe("mail-html", () => {
  it("strips scripts and non-https images, keeps basic tags", () => {
    const dirty = `<p>Hi <b>Ada</b></p><script>alert(1)</script><img src="http://evil/x.png"><img src="https://cdn.example/x.png" onerror="alert(1)"><a href="javascript:alert(1)">x</a><a href="https://ok.example">ok</a>`;
    const clean = sanitizeMailHtml(dirty);
    assert.match(clean, /<b>Ada<\/b>/);
    assert.doesNotMatch(clean, /script/i);
    assert.doesNotMatch(clean, /http:\/\/evil/);
    assert.match(clean, /https:\/\/cdn\.example\/x\.png/);
    assert.doesNotMatch(clean, /javascript:/i);
    assert.match(clean, /href="https:\/\/ok\.example"/);
  });

  it("converts html to plain and seeds the editor from plain text", () => {
    assert.equal(htmlToPlain("<p>Hello<br>World</p>"), "Hello\nWorld");
    assert.equal(plainToEditorHtml("A\nB"), "A<br>B");
    assert.equal(editorIsEmpty("<div><br></div>"), true);
    assert.equal(editorIsEmpty("<p>Hi</p>"), false);
    assert.equal(looksLikeHtml("<p>x</p>"), true);
    assert.equal(looksLikeHtml("plain"), false);
  });

  it("builds a contact block and prepares outbound bodies", () => {
    const block = contactBlockHtml({ name: "Sam", email: "sam@example.com", phone: "+1 555", company: "Acme" });
    assert.match(block, /Sam/);
    assert.match(block, /sam@example.com/);
    assert.equal(prepareMailBody("Just text"), "Just text");
    assert.match(prepareMailBody("<p>Hi<script>x</script></p>"), /Hi/);
    assert.doesNotMatch(prepareMailBody("<p>Hi<script>x</script></p>"), /script/i);
  });

  it("sends multipart when the body is HTML and plain when it is not", () => {
    const htmlMsg = buildRfc822({
      from: "jobs@example.com",
      to: "ada@example.com",
      cc: "",
      subject: "Hello",
      body: "<p>Hi <b>Ada</b></p>",
      messageId: "m1@recruit4us",
    });
    assert.match(htmlMsg, /multipart\/alternative/);
    assert.match(htmlMsg, /text\/plain/);
    assert.match(htmlMsg, /text\/html/);
    assert.match(htmlMsg, /Hi Ada/);
    assert.match(htmlMsg, /<b>Ada<\/b>/);

    const plainMsg = buildRfc822({
      from: "jobs@example.com",
      to: "ada@example.com",
      cc: "",
      subject: "Hello",
      body: "Plain body",
      messageId: "m2@recruit4us",
    });
    assert.match(plainMsg, /Content-Type: text\/plain/);
    assert.doesNotMatch(plainMsg, /multipart\/alternative/);
    assert.match(plainMsg, /Plain body/);
  });
});
