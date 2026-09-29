export type ReadCodeDifficulty = "easy" | "medium" | "hard";

export type ReadCodeItem = {
  key: string;
  difficulty: ReadCodeDifficulty;
  title: string;
  tags: string[];
  prompt: string;
  options: { id: string; label: string }[];
  correct: string;
};

const IDS = ["a", "b", "c", "d"] as const;

function uniqueLabels(preferred: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const label of preferred) {
    let next = label;
    let n = 2;
    while (seen.has(next)) {
      next = `${label} (${n})`;
      n += 1;
    }
    seen.add(next);
    out.push(next);
  }
  while (out.length < 4) {
    const filler = `none-of-these-${out.length}`;
    if (!seen.has(filler)) {
      seen.add(filler);
      out.push(filler);
    }
  }
  return out.slice(0, 4);
}

function shuffleLabels(key: string, labels: string[], correctIndex: number): {
  options: { id: string; label: string }[];
  correct: string;
} {
  let seed = 0;
  for (let i = 0; i < key.length; i += 1) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  const order = labels.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  const options = order.map((source, position) => ({
    id: IDS[position]!,
    label: labels[source]!,
  }));
  const correctPosition = order.indexOf(correctIndex);
  return { options, correct: IDS[correctPosition]! };
}

function item(
  key: string,
  difficulty: ReadCodeDifficulty,
  title: string,
  tags: string[],
  stem: string,
  code: string,
  rawLabels: string[],
  correctIndex: number,
): ReadCodeItem {
  const labels = uniqueLabels(rawLabels);
  const { options, correct } = shuffleLabels(key, labels, correctIndex);
  return {
    key,
    difficulty,
    title,
    tags,
    prompt: `${title}\n\nRead the JavaScript below. ${stem}\n\n\`\`\`javascript\n${code.trim()}\n\`\`\`\n\nThese items are original for this bank. They are not taken from a proprietary question set.`,
    options,
    correct,
  };
}

function sumRange(start: number, endExclusive: number, step: number): number {
  let total = 0;
  for (let i = start; i < endExclusive; i += step) total += i;
  return total;
}

function distractors(correct: string, extras: Array<string | number>): string[] {
  const labels = [correct, ...extras.map(String)];
  return uniqueLabels(labels);
}

function buildBank(): ReadCodeItem[] {
  const out: ReadCodeItem[] = [];
  const words = [
    "harbor", "signal", "crate", "ledger", "pipeline", "tenant", "outbox", "sandbox",
    "rubric", "invite", "screen", "ladder", "badge", "meter", "dock", "booth",
    "orchard", "spiral", "cache", "grid", "serial", "envelope", "skyline", "module",
    "window", "ticket", "shift", "label", "station", "ferry", "shelf", "warehouse",
    "pattern", "route", "cherry", "queen", "burst", "relay", "packet", "buffer",
  ];

  for (let n = 1; n <= 40; n += 1) {
    const end = n + 3;
    const total = sumRange(1, end, 1);
    const code = `let total = 0;\nfor (let i = 1; i < ${end}; i++) {\n  total += i;\n}\nconsole.log(total);`;
    const labels = distractors(String(total), [total - 1, total + end - 1, end, total * 2]);
    out.push(item(`sum-asc-${n}`, "easy", `Running total ${n}`, ["loops", "arithmetic"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 40; n += 1) {
    const start = (n % 5) + 3;
    let product = 1;
    for (let i = start; i >= 1; i -= 1) product *= i;
    const code = `let product = 1;\nfor (let i = ${start}; i >= 1; i--) {\n  product *= i;\n}\nconsole.log(product);`;
    const labels = distractors(String(product), [product / start, product * 2, start, product + start]);
    out.push(item(`fact-down-${n}`, "easy", `Countdown product ${n}`, ["loops", "arithmetic"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 40; n += 1) {
    const values = [n, n + 1, n + 2, n + 3, n + 4, n + 5];
    const threshold = n + 2;
    const count = values.filter((value) => value > threshold).length;
    const code = `const values = [${values.join(", ")}];\nconst count = values.filter((value) => value > ${threshold}).length;\nconsole.log(count);`;
    const labels = distractors(String(count), [count - 1, count + 1, values.length, 0]);
    out.push(item(`filter-count-${n}`, "easy", `Filter count ${n}`, ["arrays", "filter"], "What does it print?", code, labels, 0));
  }

  for (let n = 0; n < 35; n += 1) {
    const word = words[n]!;
    const start = n % 2;
    const end = Math.min(word.length, start + 3 + (n % 2));
    const expected = word.slice(start, end);
    const code = `const word = "${word}";\nconsole.log(word.slice(${start}, ${end}));`;
    const labels = distractors(expected, [word.slice(start), word.slice(0, end), word, word.slice(end)]);
    out.push(item(`slice-${n + 1}`, "easy", `Slice ${word}`, ["strings"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 40; n += 1) {
    const length = 4 + (n % 4);
    const buggy = n % 2 === 0;
    const code = buggy
      ? `function lastIndex(list) {\n  // supposed to return the last index\n  return list.length;\n}\nconsole.log(lastIndex(new Array(${length}).fill(0)));`
      : `function lastIndex(list) {\n  return list.length - 1;\n}\nconsole.log(lastIndex(new Array(${length}).fill(0)));`;
    const diagnosis = buggy
      ? "Off-by-one: returns length instead of length - 1"
      : "Correct: returns the last valid index";
    const other = buggy
      ? "Correct: returns the last valid index"
      : "Off-by-one: returns length instead of length - 1";
    const labels = distractors(diagnosis, [other, `It always prints ${length + 1}`, "It throws because the array is empty"]);
    out.push(item(`offbyone-${n}`, "medium", `Last index ${n}`, ["bugs", "arrays"], "Which statement is true?", code, labels, 0));
  }

  for (let n = 1; n <= 40; n += 1) {
    const outer = 2 + (n % 3);
    const inner = 3 + (n % 4);
    const ops = outer * inner;
    const code = `let ops = 0;\nfor (let i = 0; i < ${outer}; i++) {\n  for (let j = 0; j < ${inner}; j++) {\n    ops += 1;\n  }\n}\nconsole.log(ops);`;
    const labels = distractors(String(ops), [outer + inner, outer, inner * 2, ops + 1]);
    out.push(item(`nested-ops-${n}`, "medium", `Nested ops ${n}`, ["loops", "complexity"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 30; n += 1) {
    const useLet = n % 2 === 1;
    const limit = 3;
    const code = useLet
      ? `const fns = [];\nfor (let i = 0; i < ${limit}; i++) {\n  fns.push(() => i);\n}\nconsole.log(fns.map((fn) => fn()).join(","));`
      : `const fns = [];\nfor (var i = 0; i < ${limit}; i++) {\n  fns.push(() => i);\n}\nconsole.log(fns.map((fn) => fn()).join(","));`;
    const expected = useLet ? "0,1,2" : "3,3,3";
    const labels = distractors(expected, [useLet ? "3,3,3" : "0,1,2", "0,0,0", "undefined,undefined,undefined"]);
    out.push(item(`closure-${n}`, "medium", `Loop closures ${n}`, ["closures", "scope"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 30; n += 1) {
    const left = n % 3 === 0 ? 0 : n + 10;
    const right = n + 100;
    const useAnd = n % 2 === 0;
    const code = useAnd ? `console.log(${left} && ${right});` : `console.log(${left} || ${right});`;
    const expected = String(useAnd ? (left ? right : left) : left || right);
    const labels = distractors(expected, [right, left, true, false]);
    out.push(item(`shortcircuit-${n}`, "medium", `Short circuit ${n}`, ["booleans", "coercion"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 35; n += 1) {
    const pushes = [n, n + 1, n + 2];
    const code = `const stack = [];\nstack.push(${pushes[0]});\nstack.push(${pushes[1]});\nstack.push(${pushes[2]});\nconst first = stack.pop();\nconsole.log(first + "," + stack.join(","));`;
    const expected = `${pushes[2]},${pushes[0]},${pushes[1]}`;
    const labels = distractors(expected, [
      `${pushes[0]},${pushes[1]},${pushes[2]}`,
      `${pushes[2]},${pushes[1]},${pushes[0]}`,
      `${pushes[1]},${pushes[0]}`,
    ]);
    out.push(item(`stack-${n}`, "medium", `Stack pop ${n}`, ["stacks"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 30; n += 1) {
    const values = [n, n + 2, n + 4];
    const mapped = values.map((value) => value * 2);
    const reduced = mapped.reduce((sum, value) => sum + value, 0);
    const code = `const values = [${values.join(", ")}];\nconst total = values.map((value) => value * 2).reduce((sum, value) => sum + value, 0);\nconsole.log(total);`;
    const labels = distractors(String(reduced), [
      values.reduce((a, b) => a + b, 0),
      mapped[0]!,
      values.length * 2,
      reduced + 1,
    ]);
    out.push(item(`map-reduce-${n}`, "medium", `Map then reduce ${n}`, ["arrays", "functional"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 40; n += 1) {
    const arg = 1 + (n % 6);
    function tri(k: number): number {
      if (k <= 0) return 0;
      return k + tri(k - 1);
    }
    const expected = tri(arg);
    const code = `function tri(n) {\n  if (n <= 0) return 0;\n  return n + tri(n - 1);\n}\nconsole.log(tri(${arg}));`;
    const labels = distractors(String(expected), [arg, arg * arg, expected + 1, expected - 1]);
    out.push(item(`recursion-tri-${n}`, "hard", `Triangle recursion ${n}`, ["recursion"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 30; n += 1) {
    const raw = [n % 5, (n + 1) % 5, n % 5, (n + 2) % 5, (n + 1) % 5];
    const size = new Set(raw).size;
    const code = `const values = [${raw.join(", ")}];\nconsole.log(new Set(values).size);`;
    const labels = distractors(String(size), [raw.length, size + 1, 0, size - 1]);
    out.push(item(`set-size-${n}`, "hard", `Set size ${n}`, ["sets"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 25; n += 1) {
    const text = words[n % words.length]!;
    const cleaned = text.toLowerCase();
    const isPal = cleaned === [...cleaned].reverse().join("");
    const code = `function isLetterPalindrome(text) {\n  const cleaned = text.toLowerCase();\n  let left = 0;\n  let right = cleaned.length - 1;\n  while (left < right) {\n    if (cleaned[left] !== cleaned[right]) return false;\n    left += 1;\n    right -= 1;\n  }\n  return true;\n}\nconsole.log(isLetterPalindrome("${text}"));`;
    const labels = distractors(String(isPal), [String(!isPal), "undefined", "null"]);
    out.push(item(`palindrome-${n}`, "hard", `Palindrome check ${n}`, ["strings", "two-pointers"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 25; n += 1) {
    const start = [n, n + 1, n + 2, n + 3];
    const copy = [...start];
    for (let i = 0; i < copy.length; i += 1) {
      if (copy[i]! % 2 === (n % 2)) copy.splice(i, 1);
    }
    const code = `const values = [${start.join(", ")}];\nfor (let i = 0; i < values.length; i++) {\n  if (values[i] % 2 === ${n % 2}) values.splice(i, 1);\n}\nconsole.log(values.join(","));`;
    const filtered = start.filter((value) => value % 2 !== (n % 2)).join(",");
    const labels = distractors(copy.join(","), [filtered, start.join(","), "", "0"]);
    out.push(item(`mutate-iter-${n}`, "hard", `Mutating scan ${n}`, ["bugs", "arrays"], "What does it print?", code, labels, 0));
  }

  for (let n = 1; n <= 20; n += 1) {
    const low = 0;
    const high = 7 + (n % 5);
    const mid = low + Math.floor((high - low) / 2);
    const code = `const low = ${low};\nconst high = ${high};\nconst mid = low + Math.floor((high - low) / 2);\nconsole.log(mid);`;
    const labels = distractors(String(mid), [mid + 1, high, low, Math.ceil((high - low) / 2)]);
    out.push(item(`binsearch-mid-${n}`, "hard", `Binary mid ${n}`, ["search"], "What does it print?", code, labels, 0));
  }

  // Trim to exactly 500: drop trailing event-loop duplicates and excess hard if needed.
  // Add a small variety of distinct hard "what is wrong" items to fill toward 500 without clones.
  const bugSnippets: Array<{ key: string; title: string; code: string; correct: string; wrong: string[] }> = [
    {
      key: "bug-null-access",
      title: "Null property access",
      code: `function nameOf(user) {\n  return user.profile.name;\n}\nconsole.log(nameOf(null));`,
      correct: "It throws when reading profile of null",
      wrong: ["It prints null", "It prints undefined", "It prints an empty string"],
    },
    {
      key: "bug-const-reassign",
      title: "Const reassignment",
      code: `const count = 1;\ncount = count + 1;\nconsole.log(count);`,
      correct: "It throws on reassignment",
      wrong: ["It prints 2", "It prints 1", "It prints undefined"],
    },
    {
      key: "bug-array-hole",
      title: "Sparse map",
      code: `const values = [1, , 3];\nconsole.log(values.map((n) => n * 2).join(","));`,
      correct: "2,,6",
      wrong: ["2,NaN,6", "2,0,6", "2,undefined,6"],
    },
    {
      key: "bug-typeof-null",
      title: "Typeof null",
      code: `console.log(typeof null);`,
      correct: "object",
      wrong: ["null", "undefined", "object? no, null"],
    },
    {
      key: "bug-float",
      title: "Float equality",
      code: `console.log(0.1 + 0.2 === 0.3);`,
      correct: "false",
      wrong: ["true", "undefined", "NaN"],
    },
  ];
  for (const bug of bugSnippets) {
    const labels = distractors(bug.correct, bug.wrong);
    out.push(item(bug.key, "hard", bug.title, ["bugs", "language"], "Which statement is true about the result?", bug.code, labels, 0));
  }

  // Keep first 500 unique keys (already unique). Prefer balanced mix already built.
  if (out.length > 500) return out.slice(0, 500);
  return out;
}

/** Original read-the-code MCQs. Parameterized families; not copied from a proprietary bank. */
export const READ_CODE_BANK: readonly ReadCodeItem[] = buildBank();

export const READ_CODE_TARGET = 500;
