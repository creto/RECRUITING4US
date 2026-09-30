import { useMemo, useState, type ReactNode } from "react";
import {
  difficultyTone,
  parseProblemPrompt,
  splitInline,
  type PromptBlock,
} from "@/domain/problem-prompt";

export function CodeBlock({
  code,
  language = "text",
  className = "",
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const label = language && language !== "text" ? language : "code";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be denied */
    }
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#2a3530] bg-[#15201b] text-[#e8f0ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#2f3d36] bg-[#1b2822] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8fb59a]">{label}</span>
        <button
          type="button"
          className="rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#8fb59a] hover:bg-[#24332c] hover:text-[#e8f0ea]"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function InlineCode({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <code className={`rounded-md border border-[#d7e1da] bg-[#eef4f0] px-1.5 py-0.5 font-mono text-[0.9em] text-[#14221b] ${className}`}>
      {children}
    </code>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  const tone = difficultyTone(difficulty);
  if (!tone.label) return null;
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${tone.className}`}>
      {tone.label}
    </span>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <>
      {splitInline(text).map((piece, index) =>
        piece.kind === "code" ? (
          <InlineCode key={index}>{piece.text}</InlineCode>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </>
  );
}

function BlockView({ block }: { block: PromptBlock }) {
  if (block.kind === "title") {
    return <h3 className="font-brand text-2xl leading-tight text-[#17211c] sm:text-3xl">{block.text}</h3>;
  }
  if (block.kind === "signature") {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#4c6b16]">Function signature</p>
        <CodeBlock code={block.text} language="signature" />
      </div>
    );
  }
  if (block.kind === "code") {
    return <CodeBlock code={block.code} language={block.language} />;
  }
  if (block.kind === "example") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#d7e1da] bg-[#f7faf8]">
        <div className="border-b border-[#d7e1da] bg-[#eef5f0] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#4c6b16]">
          Example
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-6 text-[#17211c] whitespace-pre-wrap">
          <code>{block.text}</code>
        </pre>
      </div>
    );
  }
  if (block.kind === "section") {
    return (
      <div className="rounded-2xl border border-[#d7e1da] bg-[#f7faf8] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#4c6b16]">{block.heading}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#17211c]">
          <RichText text={block.text} />
        </p>
      </div>
    );
  }
  if (block.kind === "note") {
    return <p className="text-xs leading-relaxed text-[#5c6f67]"><RichText text={block.text} /></p>;
  }
  return (
    <p className="text-base leading-relaxed text-[#17211c] sm:text-[17px]">
      <RichText text={block.text} />
    </p>
  );
}

export function ProblemPrompt({
  prompt,
  title,
  difficulty,
  points,
  typeLabel,
  compact = false,
  className = "",
}: {
  prompt: string;
  title?: string | null;
  difficulty?: string | null;
  points?: number | null;
  typeLabel?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const blocks = useMemo(
    () => parseProblemPrompt(prompt, { title, compact }),
    [prompt, title, compact],
  );
  const hasTitle = blocks.some((block) => block.kind === "title");

  return (
    <div className={`space-y-4 ${className}`}>
      {(difficulty || points != null || typeLabel || (!hasTitle && title)) ? (
        <div className="flex flex-wrap items-center gap-2">
          {!hasTitle && title ? (
            <h3 className="mr-1 font-brand text-2xl leading-tight text-[#17211c] sm:text-3xl">{title}</h3>
          ) : null}
          <DifficultyBadge difficulty={difficulty} />
          {typeLabel ? (
            <span className="rounded-full border border-[#d7e1da] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[#44574e]">
              {typeLabel}
            </span>
          ) : null}
          {points != null ? (
            <span className="rounded-full border border-[#d7e1da] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[#44574e]">
              {points} pt
            </span>
          ) : null}
        </div>
      ) : null}
      {blocks.map((block, index) => (
        <BlockView key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  );
}
