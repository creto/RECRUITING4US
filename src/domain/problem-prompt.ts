/** Parse assessment / coding-bank prompts into typed blocks for LeetCode-like rendering. */

export type PromptBlock =
  | { kind: "title"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "signature"; text: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "example"; text: string }
  | { kind: "section"; heading: string; text: string }
  | { kind: "note"; text: string };

export type InlinePiece =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string };

const FENCE = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
const WRITE_SIG = /^Write\s+`([^`]+)`\.?\s*$/i;
const WRITE_FN = /^Write\s+(\w+\([^\n;`]*\))(?:\s+that\b|\s*\.|\s+)([\s\S]*)$/i;
const EXAMPLE_HEAD = /^(examples?|sample|samples|input\/output)\s*:?\s*$/i;
const SECTION_HEAD = /^(constraints?|rules?|notes?|follow[- ]?up|topics?)\s*:?\s*$/i;
const NOTE_START =
  /^(use the language of the editor|use any supported programming language|these prompts were written|these items are original|a correct result for the stated rules|state the approach)/i;

export function splitInline(text: string): InlinePiece[] {
  const pieces: InlinePiece[] = [];
  const re = /`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) pieces.push({ kind: "text", text: text.slice(last, match.index) });
    pieces.push({ kind: "code", text: match[1]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) pieces.push({ kind: "text", text: text.slice(last) });
  return pieces.length ? pieces : [{ kind: "text", text }];
}

function pushParagraph(blocks: PromptBlock[], raw: string, opts: { preferTitle: boolean }) {
  const text = raw.trim();
  if (!text) return;

  const write = text.match(WRITE_SIG);
  if (write) {
    blocks.push({ kind: "signature", text: write[1]!.trim() });
    return;
  }

  const writeFn = text.match(WRITE_FN);
  if (writeFn) {
    blocks.push({ kind: "signature", text: writeFn[1]!.trim() });
    const rest = (writeFn[2] ?? "").trim();
    if (rest) {
      // "that returns..." → "Returns..." for readability
      const cleaned = rest.replace(/^that\s+/i, "").replace(/^([a-z])/, (m) => m.toUpperCase());
      blocks.push({ kind: "paragraph", text: cleaned });
    }
    return;
  }

  if (NOTE_START.test(text)) {
    blocks.push({ kind: "note", text });
    return;
  }

  const alreadyTitled = blocks.some((b) => b.kind === "title");
  if (opts.preferTitle && !alreadyTitled && text.length <= 90 && !text.includes("\n") && !/[.!?]$/.test(text)) {
    blocks.push({ kind: "title", text });
    return;
  }

  // "Write `sig`." may sit at the start of a longer paragraph.
  const leadWrite = text.match(/^Write\s+`([^`]+)`\.?\s*\n+([\s\S]+)$/i);
  if (leadWrite) {
    blocks.push({ kind: "signature", text: leadWrite[1]!.trim() });
    pushParagraph(blocks, leadWrite[2]!, { preferTitle: false });
    return;
  }

  blocks.push({ kind: "paragraph", text });
}

function flushTextSegment(blocks: PromptBlock[], segment: string, opts: { preferTitle: boolean }) {
  const lines = segment.replace(/\r\n/g, "\n").split("\n");
  let buffer: string[] = [];
  let pendingExample = false;
  let pendingSection: string | null = null;

  const flushBuffer = () => {
    const chunk = buffer.join("\n").trim();
    buffer = [];
    if (!chunk) return;
    if (pendingExample) {
      blocks.push({ kind: "example", text: chunk });
      pendingExample = false;
      return;
    }
    if (pendingSection) {
      blocks.push({ kind: "section", heading: pendingSection, text: chunk });
      pendingSection = null;
      return;
    }
    pushParagraph(blocks, chunk, opts);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBuffer();
      continue;
    }
    if (EXAMPLE_HEAD.test(trimmed) && buffer.length === 0) {
      flushBuffer();
      pendingExample = true;
      pendingSection = null;
      continue;
    }
    if (SECTION_HEAD.test(trimmed) && buffer.length === 0) {
      flushBuffer();
      pendingSection = trimmed.replace(/:$/, "");
      pendingExample = false;
      continue;
    }
    // Inline "Example: foo" on one line
    const inlineExample = trimmed.match(/^examples?\s*:\s*(.+)$/i);
    if (inlineExample && buffer.length === 0) {
      flushBuffer();
      blocks.push({ kind: "example", text: inlineExample[1]!.trim() });
      continue;
    }
    buffer.push(line);
  }
  flushBuffer();
}

/** Turn a raw prompt string into display blocks. Pass title when known so it is not inferred twice. */
export function parseProblemPrompt(prompt: string, opts: { title?: string | null; compact?: boolean } = {}): PromptBlock[] {
  const source = (prompt ?? "").replace(/\r\n/g, "\n").trim();
  if (!source) return [];

  const blocks: PromptBlock[] = [];
  const knownTitle = opts.title?.trim() || "";
  if (knownTitle) {
    blocks.push({ kind: "title", text: knownTitle });
  }

  let preferTitle = !knownTitle;
  let last = 0;
  let match: RegExpExecArray | null;
  const fence = new RegExp(FENCE.source, "g");
  while ((match = fence.exec(source))) {
    const before = source.slice(last, match.index);
    flushTextSegment(blocks, before, { preferTitle });
    preferTitle = false;
    blocks.push({
      kind: "code",
      language: (match[1] || "text").trim() || "text",
      code: (match[2] ?? "").replace(/^\n/, "").replace(/\n$/, ""),
    });
    last = match.index + match[0].length;
  }
  flushTextSegment(blocks, source.slice(last), { preferTitle });

  // Drop a duplicate leading title paragraph when the caller already supplied title.
  if (knownTitle) {
    const idx = blocks.findIndex((block, i) => i > 0 && (block.kind === "title" || block.kind === "paragraph") && block.text === knownTitle);
    if (idx > 0) blocks.splice(idx, 1);
  }

  if (opts.compact) {
    return compactBlocks(blocks);
  }
  return blocks;
}

function compactBlocks(blocks: PromptBlock[]): PromptBlock[] {
  const out: PromptBlock[] = [];
  let paragraphs = 0;
  for (const block of blocks) {
    if (block.kind === "note") continue;
    if (block.kind === "paragraph") {
      paragraphs += 1;
      if (paragraphs > 2) continue;
      const text = block.text.length > 280 ? `${block.text.slice(0, 280).trimEnd()}…` : block.text;
      out.push({ kind: "paragraph", text });
      continue;
    }
    if (block.kind === "example") {
      const text = block.text.length > 200 ? `${block.text.slice(0, 200).trimEnd()}…` : block.text;
      out.push({ kind: "example", text });
      continue;
    }
    if (block.kind === "code") {
      const lines = block.code.split("\n");
      const code = lines.length > 14 ? `${lines.slice(0, 14).join("\n")}\n…` : block.code;
      out.push({ ...block, code });
      continue;
    }
    out.push(block);
  }
  return out;
}

export function difficultyTone(difficulty: string | null | undefined): {
  label: string;
  className: string;
} {
  const raw = (difficulty ?? "").trim().toLowerCase();
  if (raw === "easy") {
    return { label: "Easy", className: "border-[#b7e4c7] bg-[#e8f8ee] text-[#036145]" };
  }
  if (raw === "medium") {
    return { label: "Medium", className: "border-[#f0d9a8] bg-[#fff6e5] text-[#8a5a00]" };
  }
  if (raw === "hard") {
    return { label: "Hard", className: "border-[#f0c2cb] bg-[#fff0f3] text-[#9f1239]" };
  }
  if (!raw) return { label: "", className: "" };
  return {
    label: difficulty!.trim(),
    className: "border-[#d7e1da] bg-[#f7faf8] text-[#44574e]",
  };
}
