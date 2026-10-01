/**
 * Recruiter search, as the product documents it: AND, OR, NOT (any case),
 * "quoted phrases" and parentheses; words without an operator must all
 * appear. Terms match whole words; phrases match as written. This is the
 * website's own implementation for the interactive demo (the site never
 * imports app code); its behaviour mirrors RECRUIT4US's documented rules.
 * It is keyword matching, not semantic search.
 */
export type Node = { op: "term"; text: string } | { op: "not"; node: Node } | { op: "and" | "or"; nodes: Node[] };
type Token = { kind: "term" | "and" | "or" | "not" | "(" | ")"; text: string };

export type Compiled = { tree: Node; terms: string[] } | { error: string };

export function tokenize(query: string): Token[] | { error: string } {
  if ((query.match(/"/g)?.length ?? 0) % 2 === 1) return { error: "Una comilla no tiene su pareja." };
  const tokens: Token[] = [];
  const pattern = /"([^"]*)"|\(|\)|[\p{L}\p{N}][\p{L}\p{N}+.#-]*/gu;
  for (const m of query.matchAll(pattern)) {
    const raw = m[0];
    if (raw === "(" || raw === ")") tokens.push({ kind: raw, text: raw });
    else if (raw.startsWith('"')) {
      const text = (m[1] ?? "").trim().toLowerCase();
      if (!text) return { error: "Unas comillas vacías no son un término." };
      tokens.push({ kind: "term", text });
    } else {
      const w = raw.toLowerCase();
      tokens.push(w === "and" || w === "or" || w === "not" ? { kind: w, text: w } : { kind: "term", text: w });
    }
  }
  return tokens;
}

export function compile(query: string): Compiled {
  const toks = tokenize(query);
  if ("error" in toks) return toks;
  if (toks.length === 0) return { error: "Escribe una búsqueda." };
  let i = 0;
  const peek = () => toks[i];
  const take = () => toks[i++];
  const positive: string[] = [];

  function parseOr(neg: boolean): Node | { error: string } {
    const first = parseAnd(neg);
    if ("error" in first) return first;
    const nodes = [first];
    while (peek()?.kind === "or") {
      take();
      const n = parseAnd(neg);
      if ("error" in n) return n;
      nodes.push(n);
    }
    return nodes.length === 1 ? first : { op: "or", nodes };
  }
  function parseAnd(neg: boolean): Node | { error: string } {
    const first = parseNot(neg);
    if ("error" in first) return first;
    const nodes = [first];
    while (peek() && peek().kind !== "or" && peek().kind !== ")") {
      if (peek().kind === "and") take();
      const n = parseNot(neg);
      if ("error" in n) return n;
      nodes.push(n);
    }
    return nodes.length === 1 ? first : { op: "and", nodes };
  }
  function parseNot(neg: boolean): Node | { error: string } {
    if (peek()?.kind === "not") {
      take();
      const n = parseNot(!neg);
      if ("error" in n) return n;
      return { op: "not", node: n };
    }
    return parseTerm(neg);
  }
  function parseTerm(neg: boolean): Node | { error: string } {
    const t = take();
    if (!t) return { error: "La búsqueda termina en un operador." };
    if (t.kind === "(") {
      const n = parseOr(neg);
      if ("error" in n) return n;
      if (take()?.kind !== ")") return { error: "Falta cerrar un paréntesis." };
      return n;
    }
    if (t.kind !== "term") return { error: "Hay un operador fuera de lugar." };
    if (!neg) positive.push(t.text);
    return { op: "term", text: t.text };
  }

  const tree = parseOr(false);
  if ("error" in tree) return tree;
  if (i < toks.length) return { error: "Falta abrir un paréntesis." };
  return { tree, terms: Array.from(new Set(positive)) };
}

export function termPresent(haystack: string, term: string): boolean {
  const needle = term.trim().toLowerCase().replace(/\s+/g, " ");
  if (needle.length < 2) return false;
  const flat = haystack.toLowerCase().replace(/\s+/g, " ");
  if (needle.includes(" ")) return flat.includes(needle);
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${esc}([^\\p{L}\\p{N}]|$)`, "iu").test(flat);
}

export function evaluate(node: Node, haystack: string): boolean {
  switch (node.op) {
    case "term":
      return termPresent(haystack, node.text);
    case "not":
      return !evaluate(node.node, haystack);
    case "and":
      return node.nodes.every((n) => evaluate(n, haystack));
    case "or":
      return node.nodes.some((n) => evaluate(n, haystack));
  }
}
