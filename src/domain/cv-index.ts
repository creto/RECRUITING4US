export type ResumeProfile = {
  titles: string[];
  skills: string[];
  education: string[];
  locations: string[];
  years: number | null;
  history: string[];
  indexedText: string;
  note: string;
};

const ROLE = /\b(engineer|developer|manager|designer|analyst|director|lead|intern|specialist|coordinator|scientist|recruiter|consultant|supervisor|associate|officer|assistant|administrator)\b/i;
const DEGREE = /\b(bachelor|master|phd|ph\.d|university|college|degree|b\.s|b\.a|m\.s|m\.a)\b/i;
const YEAR_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};
const SKILL_WORDS = [
  "typescript", "javascript", "python", "java", "sql", "postgresql", "react", "node",
  "aws", "kubernetes", "go", "rust", "excel", "spreadsheets", "sales", "recruiting",
];

/** Phrases found in the text. Not a model, and not a hiring decision. */
export function parseResumeProfile(text: string | null): ResumeProfile {
  const empty = (note: string): ResumeProfile => ({
    titles: [], skills: [], education: [], locations: [], years: null, history: [], indexedText: "", note,
  });
  if (!text?.trim()) return empty("No readable text, so nothing was indexed. The original file is unchanged.");
  const chunks = text
    .split(/\n+|(?<=\.)\s+/)
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .filter((chunk) => chunk.length > 1);
  const titles = unique(chunks.filter((chunk) => ROLE.test(chunk)).map(shorten), 6);
  const education = unique(chunks.filter((chunk) => DEGREE.test(chunk)).map(shorten), 4);
  const dated = unique(chunks.filter((chunk) => /\b(19|20)\d{2}\b/.test(chunk)).map(shorten), 6);
  const history = dated.length > 0 ? dated : titles;
  const locations: string[] = [];
  for (const match of text.matchAll(/\b(?:based in|located in|location:)\s+([A-Za-z][A-Za-z .'-]{1,40})/gi)) {
    const place = match[1]?.trim().replace(/[.,]$/, "");
    if (place) locations.push(place);
  }
  const skills = unique([
    ...skillLine(text),
    ...SKILL_WORDS.filter((word) => termPresent(text, word)),
  ], 16);
  const years = yearsMentioned(text);
  const indexedText = [text, ...titles, ...skills, ...education, ...locations, ...history].join("\n").slice(0, 20000);
  return {
    titles,
    skills,
    education,
    locations: unique(locations, 4),
    years,
    history,
    indexedText,
    note: "Indexed from the CV text. The original file is unchanged. A missing word only means a search will not list this person.",
  };
}

function termPresent(haystack: string, term: string): boolean {
  const needle = term.trim().toLowerCase().replace(/\s+/g, " ");
  if (needle.length < 2) return false;
  const flat = haystack.toLowerCase().replace(/\s+/g, " ");
  if (needle.includes(" ")) return flat.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(flat);
}

function skillLine(text: string): string[] {
  const match = text.match(/\bskills?:\s*([^\n.]{2,200})/i);
  if (!match?.[1]) return [];
  return match[1].split(/[,;/]/).map((part) => part.trim()).filter((part) => part.length >= 2 && part.length <= 40);
}

function yearsMentioned(text: string): number | null {
  let best = 0;
  const pattern = new RegExp(`\\b(\\d{1,2}|${Object.keys(YEAR_WORDS).join("|")})\\s*\\+?\\s*(?:years|yrs)\\b`, "gi");
  for (const match of text.matchAll(pattern)) {
    const raw = match[1]?.toLowerCase() ?? "";
    const value = /^\d+$/.test(raw) ? Number(raw) : YEAR_WORDS[raw] ?? 0;
    if (value > best) best = value;
  }
  return best > 0 ? Math.min(best, 40) : null;
}

function unique(values: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length === cap) break;
  }
  return out;
}

function shorten(value: string): string {
  return value.length > 140 ? `${value.slice(0, 140)}…` : value;
}

type BoolNode =
  | { op: "term"; text: string }
  | { op: "not"; node: BoolNode }
  | { op: "and" | "or"; nodes: BoolNode[] };

type Token = { kind: "term" | "and" | "or" | "not" | "(" | ")"; text: string };

/** Upper or lower AND / OR / NOT, quotes, and parentheses. Other words are terms. */
export function compileBoolean(query: string): { match: (haystack: string) => boolean } | { error: string } {
  const parsed = tokenize(query);
  if ("error" in parsed) return parsed;
  const list = parsed;
  if (list.length === 0) return { error: "Enter a search." };
  let index = 0;
  function peek() { return list[index]; }
  function take() { return list[index++]; }
  function parseOr(): BoolNode | { error: string } {
    const left = parseAnd();
    if ("error" in left) return left;
    const nodes = [left];
    while (peek()?.kind === "or") {
      take();
      const right = parseAnd();
      if ("error" in right) return right;
      nodes.push(right);
    }
    return nodes.length === 1 ? left : { op: "or", nodes };
  }
  function parseAnd(): BoolNode | { error: string } {
    const left = parseNot();
    if ("error" in left) return left;
    const nodes = [left];
    while (peek() && peek()?.kind !== "or" && peek()?.kind !== ")") {
      if (peek()?.kind === "and") take();
      const right = parseNot();
      if ("error" in right) return right;
      nodes.push(right);
    }
    return nodes.length === 1 ? left : { op: "and", nodes };
  }
  function parseNot(): BoolNode | { error: string } {
    if (peek()?.kind === "not") {
      take();
      const node = parseNot();
      if ("error" in node) return node;
      return { op: "not", node };
    }
    return parseTerm();
  }
  function parseTerm(): BoolNode | { error: string } {
    const token = take();
    if (!token) return { error: "The search ends on an operator." };
    if (token.kind === "(") {
      const node = parseOr();
      if ("error" in node) return node;
      if (take()?.kind !== ")") return { error: "A parenthesis is missing." };
      return node;
    }
    if (token.kind !== "term") return { error: "The search has an operator in the wrong place." };
    return { op: "term", text: token.text };
  }
  const tree = parseOr();
  if ("error" in tree) return tree;
  if (index < list.length) return { error: "A parenthesis is missing." };
  return { match: (haystack: string) => evaluate(tree, haystack.toLowerCase()) };
}

/** Blank matches everyone. Operators use Boolean search. Other words must all appear. */
export function compileSearch(query: string): { match: (haystack: string) => boolean } | { error: string } | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (isBooleanQuery(trimmed)) return compileBoolean(trimmed);
  const words = trimmed.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*/g) ?? [];
  if (words.length === 0) return { error: "Enter a search." };
  return { match: (haystack: string) => words.every((word) => termPresent(haystack, word)) };
}

export function isBooleanQuery(query: string): boolean {
  return /\b(?:and|or|not)\b|[()"]/i.test(query);
}

function tokenize(query: string): Token[] | { error: string } {
  const tokens: Token[] = [];
  const pattern = /"([^"]+)"|\(|\)|[A-Za-z0-9][A-Za-z0-9+.#-]*/g;
  for (const match of query.matchAll(pattern)) {
    const raw = match[0];
    if (raw === "(" || raw === ")") {
      tokens.push({ kind: raw, text: raw });
      continue;
    }
    if (raw.startsWith("\"")) {
      const text = match[1]?.trim().toLowerCase() ?? "";
      if (!text) return { error: "An empty quote is not a search term." };
      tokens.push({ kind: "term", text });
      continue;
    }
    const word = raw.toLowerCase();
    if (word === "and" || word === "or" || word === "not") tokens.push({ kind: word, text: word });
    else tokens.push({ kind: "term", text: word });
  }
  if (query.includes("\"") && (query.match(/"/g)?.length ?? 0) % 2 === 1) return { error: "A quote is missing its pair." };
  return tokens;
}

function evaluate(node: BoolNode, haystack: string): boolean {
  if (node.op === "term") {
    return node.text.includes(" ") ? haystack.includes(node.text) : termPresent(haystack, node.text);
  }
  if (node.op === "not") return !evaluate(node.node, haystack);
  if (node.op === "and") return node.nodes.every((child) => evaluate(child, haystack));
  return node.nodes.some((child) => evaluate(child, haystack));
}

export type KnockoutField = {
  id: string;
  label: string;
  knockout?: { min?: number; fail?: string[] };
};

/** Employer-written rules only. A failed rule stores the application and closes it. */
export function knockoutResult(
  fields: KnockoutField[],
  answers: Record<string, string>,
): { closed: boolean; reason: string | null } {
  for (const field of fields) {
    if (!field.knockout) continue;
    const value = (answers[field.id] ?? "").trim();
    if (typeof field.knockout.min === "number") {
      const years = Number(value);
      if (!Number.isInteger(years) || years < field.knockout.min) {
        return {
          closed: true,
          reason: `Knockout: ${field.label} is below ${field.knockout.min}. The application is stored and closed.`,
        };
      }
    }
    const failed = field.knockout.fail?.find((item) => item.toLowerCase() === value.toLowerCase());
    if (failed) {
      return {
        closed: true,
        reason: `Knockout: ${field.label} was “${value || failed}”. The application is stored and closed.`,
      };
    }
  }
  return { closed: false, reason: null };
}

export function applicationForm(input: { minYears: number | null; requireAuthorization: boolean }) {
  const fields: Record<string, unknown>[] = [
    { id: "website", type: "url", label: "Portfolio or website", required: false, help: "Optional" },
    { id: "why", type: "long_text", label: "Why this role?", required: false, help: "A short note is enough." },
  ];
  if (input.minYears != null) {
    fields.push({
      id: "years",
      type: "number",
      label: "Years of relevant experience",
      required: true,
      help: `Below ${input.minYears} closes the application. This is a knockout question, not a resume score.`,
      knockout: { min: input.minYears },
    });
  }
  if (input.requireAuthorization) {
    fields.push({
      id: "work_auth",
      type: "select",
      label: "Are you legally authorized to work in the job location?",
      required: true,
      options: ["Yes", "No"],
      help: "No closes the application. This is a knockout question.",
      knockout: { fail: ["No"] },
    });
  }
  return fields;
}
