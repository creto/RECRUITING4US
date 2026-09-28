export type CorpusCase = {
  name: string;
  visibility: "SAMPLE" | "HIDDEN";
  args: unknown[];
  expected: unknown;
  weight: number;
};

export type CorpusQuestion = {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  prompt: string;
  starter: string;
  entry: "solve";
  explanation: string;
  cases: CorpusCase[];
};

const starter = `function solve() {\n  return null;\n}\n`;

export const QUESTION_CORPUS: CorpusQuestion[] = [
  {
    slug: "add-two",
    title: "Add two integers",
    difficulty: "EASY",
    tags: ["arithmetic"],
    prompt: "Write solve(a, b) that returns the sum of two integers. Do not read files or the network.",
    starter: "function solve(a, b) {\n  return a + b;\n}\n",
    entry: "solve",
    explanation: "Return a + b. Watch the sign.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [2, 3], expected: 5, weight: 1 },
      { name: "negatives", visibility: "HIDDEN", args: [-4, 1], expected: -3, weight: 1 },
      { name: "zero", visibility: "HIDDEN", args: [0, 0], expected: 0, weight: 1 },
    ],
  },
  {
    slug: "reverse-words",
    title: "Reverse the words",
    difficulty: "EASY",
    tags: ["strings"],
    prompt: "Write solve(text) that reverses the order of words separated by single spaces. Keep the words themselves intact.",
    starter,
    entry: "solve",
    explanation: "Split on spaces, reverse the list, and join.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: ["red green blue"], expected: "blue green red", weight: 1 },
      { name: "one", visibility: "HIDDEN", args: ["only"], expected: "only", weight: 1 },
      { name: "two", visibility: "HIDDEN", args: ["left right"], expected: "right left", weight: 1 },
    ],
  },
  {
    slug: "fizzbuzz-n",
    title: "Fizz buzz up to n",
    difficulty: "EASY",
    tags: ["loops"],
    prompt: "Write solve(n) that returns an array of strings from 1 through n. Multiples of 3 are Fizz, of 5 are Buzz, of both are FizzBuzz. Otherwise the decimal number.",
    starter,
    entry: "solve",
    explanation: "Check 15 before 3 or 5.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"], weight: 2 },
      { name: "fifteen", visibility: "HIDDEN", args: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"], weight: 2 },
    ],
  },
  {
    slug: "palindrome",
    title: "Letter palindrome",
    difficulty: "EASY",
    tags: ["strings"],
    prompt: "Write solve(text) that returns true when the letters and digits, ignoring case and other characters, read the same forward and backward.",
    starter,
    entry: "solve",
    explanation: "Keep [A-Za-z0-9], lowercase, and compare to the reverse.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: ["A man, a plan, a canal: Panama"], expected: true, weight: 1 },
      { name: "no", visibility: "HIDDEN", args: ["race a car"], expected: false, weight: 1 },
      { name: "digits", visibility: "HIDDEN", args: ["12 21"], expected: true, weight: 1 },
    ],
  },
  {
    slug: "max-of-list",
    title: "Maximum value",
    difficulty: "EASY",
    tags: ["arrays"],
    prompt: "Write solve(values) that returns the largest number in a non-empty array of integers.",
    starter,
    entry: "solve",
    explanation: "Track the max. Do not assume the first value is positive.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[1, 4, 2]], expected: 4, weight: 1 },
      { name: "neg", visibility: "HIDDEN", args: [[-8, -3, -9]], expected: -3, weight: 1 },
    ],
  },
  {
    slug: "unique-count",
    title: "Count unique numbers",
    difficulty: "EASY",
    tags: ["sets"],
    prompt: "Write solve(values) that returns how many distinct integers are in the array.",
    starter,
    entry: "solve",
    explanation: "A set removes duplicates.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[1, 1, 2, 3]], expected: 3, weight: 1 },
      { name: "empty", visibility: "HIDDEN", args: [[]], expected: 0, weight: 1 },
    ],
  },
  {
    slug: "anagram",
    title: "Are these anagrams",
    difficulty: "EASY",
    tags: ["strings"],
    prompt: "Write solve(left, right) that returns true when both strings use the same letters the same number of times, ignoring case and spaces.",
    starter,
    entry: "solve",
    explanation: "Sort the kept letters of each side.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: ["Listen", "Silent"], expected: true, weight: 1 },
      { name: "no", visibility: "HIDDEN", args: ["hello", "world"], expected: false, weight: 1 },
      { name: "space", visibility: "HIDDEN", args: ["a gentleman", "elegant man"], expected: true, weight: 1 },
    ],
  },
  {
    slug: "two-sum-indices",
    title: "Two sum indices",
    difficulty: "MEDIUM",
    tags: ["arrays", "maps"],
    prompt: "Write solve(values, target) that returns the indices of two different numbers that add to target, as a two-element array in ascending index order. Assume exactly one answer.",
    starter,
    entry: "solve",
    explanation: "A map from value to index finds the complement in one pass.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[2, 7, 11, 15], 9], expected: [0, 1], weight: 2 },
      { name: "later", visibility: "HIDDEN", args: [[3, 2, 4], 6], expected: [1, 2], weight: 2 },
      { name: "dup", visibility: "HIDDEN", args: [[3, 3], 6], expected: [0, 1], weight: 2 },
    ],
  },
  {
    slug: "valid-parens",
    title: "Balanced brackets",
    difficulty: "MEDIUM",
    tags: ["stacks"],
    prompt: "Write solve(text) that returns true when (), [], and {} are balanced and properly nested.",
    starter,
    entry: "solve",
    explanation: "Push opening brackets. A closing bracket must match the top.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: ["()[]{}"], expected: true, weight: 2 },
      { name: "bad", visibility: "HIDDEN", args: ["(]"], expected: false, weight: 2 },
      { name: "nested", visibility: "HIDDEN", args: ["{[]()}"], expected: true, weight: 1 },
      { name: "open", visibility: "HIDDEN", args: ["("], expected: false, weight: 1 },
    ],
  },
  {
    slug: "merge-intervals",
    title: "Merge overlapping intervals",
    difficulty: "MEDIUM",
    tags: ["intervals"],
    prompt: "Write solve(intervals) that merges overlapping inclusive ranges. Each range is [start, end]. Return the merged ranges sorted by start.",
    starter,
    entry: "solve",
    explanation: "Sort by start, then extend the last range when the next start is inside it.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[[1, 3], [2, 6], [8, 10]]], expected: [[1, 6], [8, 10]], weight: 2 },
      { name: "touch", visibility: "HIDDEN", args: [[[1, 4], [4, 5]]], expected: [[1, 5]], weight: 2 },
      { name: "none", visibility: "HIDDEN", args: [[[1, 2], [3, 4]]], expected: [[1, 2], [3, 4]], weight: 1 },
    ],
  },
  {
    slug: "binary-search",
    title: "Index in a sorted list",
    difficulty: "MEDIUM",
    tags: ["search"],
    prompt: "Write solve(values, target) that returns the index of target in a sorted array of numbers, or -1 if it is absent.",
    starter,
    entry: "solve",
    explanation: "Keep a low and high index. This is not a linear scan requirement, but a linear scan can still be correct.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[1, 3, 5, 7], 5], expected: 2, weight: 1 },
      { name: "miss", visibility: "HIDDEN", args: [[1, 3, 5], 4], expected: -1, weight: 1 },
      { name: "ends", visibility: "HIDDEN", args: [[2, 4, 6], 6], expected: 2, weight: 1 },
    ],
  },
  {
    slug: "climbing-ways",
    title: "Stair steps",
    difficulty: "MEDIUM",
    tags: ["dynamic"],
    prompt: "Write solve(n) that returns how many ways to climb n stairs taking 1 or 2 steps at a time. Order matters. n is between 1 and 30.",
    starter,
    entry: "solve",
    explanation: "This is the Fibonacci recurrence: ways(n) = ways(n-1) + ways(n-2).",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [3], expected: 3, weight: 2 },
      { name: "one", visibility: "HIDDEN", args: [1], expected: 1, weight: 1 },
      { name: "five", visibility: "HIDDEN", args: [5], expected: 8, weight: 2 },
    ],
  },
  {
    slug: "group-anagrams",
    title: "Group anagrams",
    difficulty: "MEDIUM",
    tags: ["maps"],
    prompt: "Write solve(words) that groups anagrams. Return groups sorted by their first word, and sort words inside each group.",
    starter,
    entry: "solve",
    explanation: "Key each word by its sorted letters.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [["eat", "tea", "tan", "ate", "nat", "bat"]], expected: [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]], weight: 3 },
    ],
  },
  {
    slug: "longest-unique",
    title: "Longest stretch without a repeat",
    difficulty: "MEDIUM",
    tags: ["strings"],
    prompt: "Write solve(text) that returns the length of the longest substring without a repeated character.",
    starter,
    entry: "solve",
    explanation: "Move a window and remember the last index of each character.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: ["abcabcbb"], expected: 3, weight: 2 },
      { name: "same", visibility: "HIDDEN", args: ["bbbb"], expected: 1, weight: 1 },
      { name: "empty", visibility: "HIDDEN", args: [""], expected: 0, weight: 1 },
    ],
  },
  {
    slug: "product-except-self",
    title: "Product except self",
    difficulty: "HARD",
    tags: ["arrays"],
    prompt: "Write solve(values) that returns an array where each position is the product of every other number. Do not use division. The input has at least two numbers.",
    starter,
    entry: "solve",
    explanation: "Prefix products from the left, then multiply suffix products from the right.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6], weight: 3 },
      { name: "zero", visibility: "HIDDEN", args: [[0, 2, 3]], expected: [6, 0, 0], weight: 2 },
    ],
  },
  {
    slug: "course-order",
    title: "Course order",
    difficulty: "HARD",
    tags: ["graphs"],
    prompt: "Write solve(n, prerequisites) where prerequisites are [course, required] pairs. Return one valid order of courses 0..n-1, or an empty array if there is a cycle. Prefer the smallest available course number when several are ready.",
    starter,
    entry: "solve",
    explanation: "Kahn's algorithm with a stable choice of the smallest ready course.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [2, [[1, 0]]], expected: [0, 1], weight: 3 },
      { name: "cycle", visibility: "HIDDEN", args: [2, [[1, 0], [0, 1]]], expected: [], weight: 3 },
      { name: "three", visibility: "HIDDEN", args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: [0, 1, 2, 3], weight: 3 },
    ],
  },
  {
    slug: "median-two",
    title: "Median of two sorted lists",
    difficulty: "HARD",
    tags: ["search"],
    prompt: "Write solve(left, right) that returns the median of two sorted number arrays as a number. If the combined length is even, return the average of the two middle values.",
    starter,
    entry: "solve",
    explanation: "Merging is acceptable for these sizes. A binary partition is also correct.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[1, 3], [2]], expected: 2, weight: 2 },
      { name: "even", visibility: "HIDDEN", args: [[1, 2], [3, 4]], expected: 2.5, weight: 3 },
    ],
  },
  {
    slug: "trap-rain",
    title: "Trapped rain",
    difficulty: "HARD",
    tags: ["arrays"],
    prompt: "Write solve(heights) that returns how many units of water can sit between bars of those heights.",
    starter,
    entry: "solve",
    explanation: "Water at i is min(leftMax, rightMax) - height, when that is positive.",
    cases: [
      { name: "sample", visibility: "SAMPLE", args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6, weight: 3 },
      { name: "flat", visibility: "HIDDEN", args: [[4, 2, 3]], expected: 1, weight: 2 },
    ],
  },
];
