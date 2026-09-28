import { toCsv } from "./rules.ts";

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
  const compact = applicationId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
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
  return { title: "Form complete", lines };
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
