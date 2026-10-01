import { roleHas } from "./rules.ts";

export const LIVE_SIGNAL_KINDS = ["SCREENS", "LEFT_APP", "RETURNED", "LEFT_WINDOW", "COPY", "PASTE"] as const;

export type LiveSignalKind = (typeof LIVE_SIGNAL_KINDS)[number];

export function liveSignalKind(value: string): LiveSignalKind | null {
  return (LIVE_SIGNAL_KINDS as readonly string[]).includes(value) ? (value as LiveSignalKind) : null;
}

/** One line an interviewer can read. Clipboard text is shortened. Empty copy still says that a copy happened. */
export function clipSignalText(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
}

export function describeLiveSignal(kind: string, detail: string): string {
  const text = clipSignalText(detail);
  switch (kind) {
    case "SCREENS":
      return text || "Screen count was not available.";
    case "LEFT_APP":
      return "Left the page or switched tabs.";
    case "RETURNED":
      return "Came back to the page.";
    case "LEFT_WINDOW":
      return "The window lost focus.";
    case "COPY":
      return text ? `Copied: ${text}` : "Copied, but the text was not available.";
    case "PASTE":
      return text ? `Pasted: ${text}` : "Pasted, but the text was not available.";
    default:
      return "Noted.";
  }
}

export type AttemptLiveItem = {
  position: number;
  type: string;
  prompt: string;
  answer: unknown;
};

export type AttemptLiveFile = { name: string; body: string };

/** Build the pad files a recruiter watches while a candidate takes an exam. */
export function buildAttemptLivePad(input: {
  assessmentName: string;
  candidateName: string;
  jobTitle: string;
  items: AttemptLiveItem[];
}): { prompt: string; files: AttemptLiveFile[]; activeFile: string; source: string } {
  const answered = input.items.filter((item) => answerPreview(item.type, item.answer)).length;
  const total = input.items.length;
  const lines = [
    `# ${input.assessmentName}`,
    "",
    `${input.candidateName} · ${input.jobTitle}`,
    `Progress: ${answered} of ${total} answered.`,
    "",
    "This pad mirrors the open exam. Code updates as the candidate types. Watching does not change a score.",
    "",
  ];
  const files: AttemptLiveFile[] = [];
  for (const item of input.items) {
    const label = `q${item.position}`;
    const preview = answerPreview(item.type, item.answer);
    lines.push(`## Q${item.position} · ${item.type}`);
    lines.push(clipPrompt(item.prompt));
    lines.push(preview ? `Saved: ${preview.split("\n")[0]!.slice(0, 120)}` : "Not answered yet.");
    lines.push("");
    if (item.type === "code" || item.type === "sql" || item.type === "text") {
      const ext = item.type === "sql" ? "sql" : item.type === "code" ? "js" : "md";
      files.push({
        name: `${label}.${ext}`,
        body: typeof preview === "string" && preview.length > 0
          ? preview
          : item.type === "code"
            ? "function solve() {\n  return null;\n}\n"
            : "",
      });
    }
  }
  files.unshift({ name: "progress.md", body: `${lines.join("\n")}\n` });
  const codeFile = files.find((file) => file.name.endsWith(".js") || file.name.endsWith(".sql"));
  const activeFile = codeFile?.name ?? "progress.md";
  const source = files.find((file) => file.name === activeFile)?.body ?? files[0]!.body;
  return {
    prompt: `${input.assessmentName}\n\nLive exam watch for ${input.candidateName} (${input.jobTitle}). Code appears here as they type. This does not change a score.`,
    files,
    activeFile,
    source,
  };
}

export function liveWatchPath(token: string): string {
  return `/live/${token}`;
}

export function activeAttemptSummary(input: {
  candidateName: string;
  jobTitle: string;
  assessmentName: string;
}): string {
  return `${input.candidateName} · ${input.jobTitle} · ${input.assessmentName}`;
}

function clipPrompt(prompt: string): string {
  const text = prompt.replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 160)}…` : text || "(no prompt)";
}

function answerPreview(type: string, answer: unknown): string {
  if (!answer || typeof answer !== "object") return "";
  const record = answer as { text?: unknown; optionId?: unknown; optionIds?: unknown; value?: unknown };
  if (type === "code" || type === "sql" || type === "text") {
    return typeof record.text === "string" ? record.text : "";
  }
  if (type === "numeric") return typeof record.value === "string" ? record.value.trim() : "";
  if (type === "single" || type === "likert") return typeof record.optionId === "string" ? `option ${record.optionId}` : "";
  if (type === "multi" && Array.isArray(record.optionIds)) {
    const ids = record.optionIds.filter((id): id is string => typeof id === "string");
    return ids.length ? `options ${ids.join(", ")}` : "";
  }
  return "";
}


/** True when this staff role may see who is taking an exam / act as live interviewer. */
export function canWatchActiveAttempts(role: string): boolean {
  return (
    roleHas(role, "assessment.assign") ||
    roleHas(role, "interview.manage") ||
    roleHas(role, "evaluation.grade") ||
    roleHas(role, "assessment.author")
  );
}

/** Fail-closed: a live watch row is visible only when company and application line up. */
export function liveRowVisibleToTenant(input: {
  tenantCompanyId: string;
  rowCompanyId: string;
  applicationId: string;
  liveApplicationId: string | null | undefined;
  liveToken: string | null | undefined;
}): boolean {
  if (!input.tenantCompanyId || input.rowCompanyId !== input.tenantCompanyId) return false;
  if (!input.liveToken) return false;
  if (input.liveApplicationId && input.liveApplicationId !== input.applicationId) return false;
  return true;
}

