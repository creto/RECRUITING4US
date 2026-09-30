import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { JUDGE0_LANGUAGE_IDS, wrapSampleSource } from "./judge0.server.ts";
import { CODING_LANGUAGE_IDS } from "../../domain/coding-languages.ts";

describe("judge0 sample wraps", () => {
  it("maps every catalog language to a Judge0 id", () => {
    for (const id of CODING_LANGUAGE_IDS) {
      assert.equal(typeof JUDGE0_LANGUAGE_IDS[id], "number");
      assert.ok(JUDGE0_LANGUAGE_IDS[id] > 0);
    }
  });

  it("adds a main entry for compiled starters without one", () => {
    assert.match(wrapSampleSource("java", "class Solution { public Object solve() { return null; } }"), /class Main/);
    assert.match(wrapSampleSource("go", "package main\n\nfunc solve() interface{} { return nil }\n"), /func main/);
    assert.match(wrapSampleSource("rust", "fn solve() {}"), /fn main/);
    assert.match(wrapSampleSource("cpp", "auto solve() { return 0; }"), /int main/);
    assert.match(wrapSampleSource("csharp", "public class Solution { public object solve() { return null; } }"), /static void Main/);
    assert.match(wrapSampleSource("kotlin", "class Solution { fun solve(): Any? = null }"), /fun main/);
  });

  it("does not double-wrap when main already exists", () => {
    const java = "public class Main { public static void main(String[] a) {} }";
    assert.equal(wrapSampleSource("java", java), java);
    const go = "package main\nfunc main() {}";
    assert.equal(wrapSampleSource("go", go), go);
  });

  it("leaves script languages unchanged aside from trailing trim", () => {
    const py = "def solve(*args):\n    return None";
    assert.equal(wrapSampleSource("python", py), py);
  });
});
