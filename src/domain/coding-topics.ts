/** Canonical skill tags for write-code bank problems. Recruiters filter on these. */
export const CODING_SKILL_TAGS = [
  "arrays",
  "lists",
  "strings",
  "hashing",
  "two-pointers",
  "sliding-window",
  "stacks",
  "queues",
  "trees",
  "graphs",
  "dp",
  "recursion",
  "binary-search",
  "sorting",
  "greedy",
  "heaps",
  "math",
  "bits",
  "backtracking",
  "intervals",
  "prefix-sums",
  "bfs",
  "dfs",
  "union-find",
  "matrices",
  "linked-lists",
] as const;

export type CodingSkillTag = (typeof CODING_SKILL_TAGS)[number];

const ALIASES: Record<string, CodingSkillTag> = {
  array: "arrays",
  arrays: "arrays",
  list: "lists",
  lists: "lists",
  string: "strings",
  strings: "strings",
  hash: "hashing",
  hashing: "hashing",
  maps: "hashing",
  map: "hashing",
  "two pointers": "two-pointers",
  "two-pointers": "two-pointers",
  "sliding window": "sliding-window",
  "sliding-window": "sliding-window",
  stack: "stacks",
  stacks: "stacks",
  queue: "queues",
  queues: "queues",
  tree: "trees",
  trees: "trees",
  bst: "trees",
  graph: "graphs",
  graphs: "graphs",
  "dynamic programming": "dp",
  dp: "dp",
  knapsack: "dp",
  recursion: "recursion",
  "binary search": "binary-search",
  "binary-search": "binary-search",
  search: "binary-search",
  sorting: "sorting",
  sort: "sorting",
  greedy: "greedy",
  heap: "heaps",
  heaps: "heaps",
  math: "math",
  arithmetic: "math",
  combinatorics: "math",
  counting: "math",
  geometry: "math",
  bits: "bits",
  bit: "bits",
  backtracking: "backtracking",
  intervals: "intervals",
  "prefix sums": "prefix-sums",
  "prefix-sums": "prefix-sums",
  bfs: "bfs",
  dfs: "dfs",
  "union-find": "union-find",
  "union find": "union-find",
  matrix: "matrices",
  matrices: "matrices",
  grids: "matrices",
  grid: "matrices",
  "linked list": "linked-lists",
  "linked-lists": "linked-lists",
  "linked-list": "linked-lists",
  sets: "hashing",
  set: "hashing",
  functional: "arrays",
  bugs: "arrays",
  language: "strings",
  complexity: "math",
  closures: "recursion",
  scope: "recursion",
  booleans: "bits",
  coercion: "strings",
  voting: "arrays",
  simulation: "arrays",
  games: "math",
  "divide and conquer": "recursion",
  "topological sort": "graphs",
  "shortest paths": "graphs",
  dijkstra: "graphs",
  "floyd-warshall": "graphs",
  "bellman-ford": "graphs",
  "minimum spanning tree": "graphs",
  cycles: "graphs",
  "difference array": "prefix-sums",
};

const CANON = new Set<string>(CODING_SKILL_TAGS);

/** Normalize free-text topic labels into canonical filter tags. */
export function normalizeTopicTags(raw: string | string[] | null | undefined): CodingSkillTag[] {
  const parts = Array.isArray(raw)
    ? raw.map((part) => String(part).trim().toLowerCase()).filter(Boolean)
    : String(raw ?? "")
        .split(/[,;/|]+/)
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);
  const out: CodingSkillTag[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const resolved = ALIASES[part] ?? (CANON.has(part) ? (part as CodingSkillTag) : null);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(resolved);
  }
  return out;
}

/** Parse `Topic: a, b.` from a prompt body. */
export function tagsFromPrompt(prompt: string): CodingSkillTag[] {
  const match = prompt.match(/Topic:\s*([^.]+)\./i);
  return match ? normalizeTopicTags(match[1]) : [];
}

/** Persist bank tags on questions.tags while keeping the coding-bank: prefix filterable. */
export function codingBankTagField(difficulty: string, skillTags: string[]): string {
  const skills = normalizeTopicTags(skillTags);
  return [`coding-bank:${difficulty}`, ...skills].join(" ");
}

export function parseCodingBankSkills(tagsField: string): string[] {
  const parts = String(tagsField ?? "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.filter((part) => !part.startsWith("coding-bank:") && !part.startsWith("read-code:"));
}
