import { candidateStageLabel, toCsv } from "./rules.ts";

export type SheetField = { id: string; label: string };

export type SheetRow = {
  receipt: string;
  submittedAt: string;
  name: string;
  email: string;
  phone: string;
  cvName: string;
  cvResult: string;
  answers: Record<string, string>;
};

export function applicationReceipt(applicationId: string): string {
  const compact = applicationId.replace(/[^a-zA-Z0-9]/gi, "").slice(0, 8).toUpperCase();
  return `R-${compact || "APPLY"}`;
}

export function cvResultLabel(fit: string | null, action: string | null, hadFile: boolean): string {
  if (!hadFile) return "no cv";
  if (!fit) return "not checked";
  if (fit === "GOOD" && action === "SEND") return "good fit; assessment sent";
  if (fit === "NOT_A_FIT") return "not a fit; assessment not sent";
  if (fit === "NEEDS_A_PERSON") return "needs a person; assessment not sent";
  if (fit === "GOOD") return "good fit; assessment not sent";
  return "not checked";
}

export function applicantNotice(input: { alreadyApplied: boolean; receipt: string; cvResult: string }): { title: string; lines: string[] } {
  if (input.alreadyApplied) {
    return {
      title: "This email already has an application",
      lines: [
        "It was not added again.",
        input.receipt ? `Receipt ${input.receipt}.` : "",
      ].filter(Boolean),
    };
  }
  const lines = [
    `Receipt ${input.receipt}. Keep it.`,
    "Your name, email, and answers were added as one row on the employer’s application sheet.",
  ];
  if (input.cvResult === "good fit; assessment sent") {
    lines.push("Your CV matched the must-have skills. An assessment is in the candidate portal after you sign in with this email.");
  } else if (input.cvResult === "no cv") {
    lines.push("No CV was attached, so it was not checked and no assessment was sent.");
  } else if (input.cvResult === "not checked" || input.cvResult.startsWith("needs a person")) {
    lines.push("The CV could not be read, so no assessment was sent.");
  } else {
    lines.push("Your CV was checked. An assessment was not sent.");
  }
  lines.push("This confirmation is shown on this page and stored for the employer. It is not emailed.");
  lines.push("Use this receipt or your email on the application status page to see a progress bar.");
  return { title: "Form complete", lines };
}

/** One lookup box: email, the R- receipt from the apply form, or the application id. */
export function trackQuery(raw: string): { email: string } | { receipt: string } | { id: string } | { error: string } {
  const text = raw.trim();
  if (text.length < 3) return { error: "Enter the email or the receipt from the apply form." };
  if (text.includes("@")) {
    const email = text.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: "That email is not usable." };
    return { email };
  }
  const compact = text.toUpperCase().replace(/^R-/, "").replace(/[^A-Z0-9]/g, "");
  if (compact.length === 8 && text.length <= 12) return { receipt: compact };
  if (text.length >= 8 && text.length <= 80 && /^[a-zA-Z0-9-]+$/.test(text)) return { id: text };
  return { error: "Enter the email, the receipt from the apply form, or the application id." };
}

/** Stages of this job, with the current one marked. Hired fills the bar. A stop stays on the stage it reached. */
export function trackBar(input: { stages: string[]; stageName: string; category: string; lifecycle: string }): {
  steps: string[];
  index: number;
  label: string;
  stopped: boolean;
  hired: boolean;
} {
  const steps = input.stages.map((name) => name.trim()).filter(Boolean);
  const names = steps.length > 0 ? steps : [input.stageName.trim() || "Applied"];
  const found = names.findIndex((name) => name === input.stageName);
  const index = found >= 0 ? found : 0;
  const hired = input.lifecycle === "HIRED";
  return {
    steps: names,
    index: hired ? names.length - 1 : index,
    label: candidateStageLabel(input.category, input.lifecycle),
    stopped: input.lifecycle === "REJECTED" || input.lifecycle === "WITHDRAWN",
    hired,
  };
}

/** Stage names from the public lookup. Accepts a JSON string or an already-parsed array. */
export function stageNameList(value: unknown): string[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const names: string[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const name = (item as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) names.push(name);
  }
  return names;
}

export function sheetColumns(schema: readonly SheetField[], rows: readonly SheetRow[]): SheetField[] {
  const columns: SheetField[] = [];
  const seen = new Set<string>();
  for (const field of schema) {
    const id = field.id.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    columns.push({ id, label: field.label.trim() || id });
  }
  const extra: string[] = [];
  for (const row of rows) {
    for (const id of Object.keys(row.answers)) {
      if (!seen.has(id)) {
        seen.add(id);
        extra.push(id);
      }
    }
  }
  extra.sort();
  for (const id of extra) columns.push({ id, label: id });
  const used = new Map<string, number>();
  return columns.map((column) => {
    const count = used.get(column.label) ?? 0;
    used.set(column.label, count + 1);
    if (count === 0) return column;
    return { ...column, label: `${column.label} (${column.id})` };
  });
}

export function applicationSheetCsv(schema: readonly SheetField[], rows: readonly SheetRow[]): string {
  const columns = sheetColumns(schema, rows);
  const header = ["receipt", "submitted_at", "name", "email", "phone", "cv_file", "cv_result", ...columns.map((column) => column.label)];
  const body = rows.map((row) => [
    row.receipt,
    row.submittedAt,
    row.name,
    row.email,
    row.phone,
    row.cvName,
    row.cvResult,
    ...columns.map((column) => row.answers[column.id] ?? ""),
  ]);
  return toCsv([header, ...body]);
}

export function storedAnswerText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value) return String((value as { text: unknown }).text ?? "");
  return "";
}
