export const FOOTER =
  "Use the language of the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site.";

export const problems = [];

function format(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "null";
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new Error(`bad example value ${JSON.stringify(value)}`);
}

export function add(difficulty, key, title, sig, task, call, value) {
  if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error(`diff ${key}`);
  if (!sig.includes("(")) throw new Error(`sig ${key}`);
  problems.push({
    key,
    difficulty,
    title,
    prompt: `${title}\n\nWrite \`${sig}\`.\n\n${task}\n\nExample\n${call} returns ${format(value)}.\n\n${FOOTER}`,
  });
}

export function tree(vals) {
  if (!vals.length || vals[0] == null) return null;
  const root = { v: vals[0], l: null, r: null };
  const q = [root];
  let i = 1;
  while (q.length && i < vals.length) {
    const node = q.shift();
    if (i < vals.length && vals[i] != null) {
      node.l = { v: vals[i], l: null, r: null };
      q.push(node.l);
    }
    i += 1;
    if (i < vals.length && vals[i] != null) {
      node.r = { v: vals[i], l: null, r: null };
      q.push(node.r);
    }
    i += 1;
  }
  return root;
}
