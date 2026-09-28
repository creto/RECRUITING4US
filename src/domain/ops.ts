export const RULE_TRIGGERS = [
  "APPLICATION_SUBMITTED",
  "STAGE_CHANGED",
  "ASSESSMENT_ASSIGNED",
  "ASSESSMENT_COMPLETED",
  "REVIEW_COMPLETED",
  "OFFER_SENT",
  "OFFER_RESPONDED",
  "LIFECYCLE_CHANGED",
] as const;

export const RULE_ACTIONS = ["create_review", "add_tag", "move_stage", "send_email", "send_text", "pipe_analytics"] as const;

const STAGE_CATEGORIES = ["APPLIED", "SCREEN", "ASSESSMENT", "INTERVIEW", "OFFER", "DECISION"] as const;

export type SandboxSpec = {
  timeoutMs: number;
  maxOutputChars: number;
  runtime: "node";
  network: "denied";
  filesystem: "denied";
};

export function sandboxSpec(input: { timeoutMs: number; maxOutputChars: number }): SandboxSpec | { error: string } {
  if (!Number.isInteger(input.timeoutMs) || input.timeoutMs < 200 || input.timeoutMs > 5000) {
    return { error: "Timeout must be a whole number of milliseconds from 200 to 5000." };
  }
  if (!Number.isInteger(input.maxOutputChars) || input.maxOutputChars < 200 || input.maxOutputChars > 8000) {
    return { error: "Output cap must be a whole number of characters from 200 to 8000." };
  }
  return {
    timeoutMs: input.timeoutMs,
    maxOutputChars: input.maxOutputChars,
    runtime: "node",
    network: "denied",
    filesystem: "denied",
  };
}

/** Invalid limits fall back to the built-in sample run. They never become zero. */
export function clampRunLimits(input?: { timeoutMs?: number; maxOutputChars?: number }): { timeoutMs: number; maxOutputChars: number } {
  const spec = sandboxSpec({
    timeoutMs: input?.timeoutMs ?? 1500,
    maxOutputChars: input?.maxOutputChars ?? 4000,
  });
  if ("error" in spec) return { timeoutMs: 1500, maxOutputChars: 4000 };
  return { timeoutMs: spec.timeoutMs, maxOutputChars: spec.maxOutputChars };
}

export function textPlan(phone: string | null | undefined, body: string): {
  status: "CAPTURED" | "REFUSED";
  reason: string;
  to: string;
  body: string;
} {
  const text = body.trim().slice(0, 320);
  const to = (phone ?? "").trim();
  if (text.length < 2) {
    return { status: "REFUSED", reason: "Write a message first. Nothing was sent.", to, body: text };
  }
  if (!/^[0-9+().\-\s]{7,20}$/.test(to)) {
    return { status: "REFUSED", reason: "This person has no usable phone number. Nothing was sent.", to, body: text };
  }
  return {
    status: "CAPTURED",
    reason: "No texting carrier is connected. The message is stored in this workspace and was not sent.",
    to,
    body: text,
  };
}

export function biLocalPlan(destination: string, rowCount: number): { status: "CAPTURED" | "REFUSED" | "ATTEMPT"; detail: string } {
  if (!Number.isInteger(rowCount) || rowCount <= 0) {
    return { status: "REFUSED", detail: "There are no rows in this extract, so nothing was sent." };
  }
  if (!destination.trim()) {
    return {
      status: "CAPTURED",
      detail: "No analytics destination is configured. The extract is stored in this workspace and was not sent.",
    };
  }
  return { status: "ATTEMPT", detail: "No API key is configured, so the request has no secret." };
}

export function normalizeRuleDraft(input: { trigger: string; conditions: unknown; actions: unknown }):
  | {
      trigger: string;
      conditions: { field: string; op: string; value: string }[];
      actions: { type: string; tag?: string; category?: string; subject?: string; body?: string }[];
    }
  | { error: string } {
  if (!(RULE_TRIGGERS as readonly string[]).includes(input.trigger)) return { error: "That trigger is not supported." };
  if (!Array.isArray(input.actions) || input.actions.length < 1 || input.actions.length > 6) {
    return { error: "Add one to six actions." };
  }
  const actions: { type: string; tag?: string; category?: string; subject?: string; body?: string }[] = [];
  for (const raw of input.actions) {
    if (!raw || typeof raw !== "object") return { error: "An action is incomplete." };
    const type = String((raw as { type?: unknown }).type ?? "");
    if (!(RULE_ACTIONS as readonly string[]).includes(type)) return { error: "That action is not supported." };
    const action: { type: string; tag?: string; category?: string; subject?: string; body?: string } = { type };
    if (type === "add_tag") action.tag = String((raw as { tag?: unknown }).tag || "Follow-up").trim().slice(0, 40) || "Follow-up";
    if (type === "move_stage") {
      const category = String((raw as { category?: unknown }).category || "INTERVIEW");
      if (!(STAGE_CATEGORIES as readonly string[]).includes(category)) return { error: "That stage category is not supported." };
      action.category = category;
    }
    if (type === "send_email" || type === "send_text") {
      const body = String((raw as { body?: unknown }).body ?? "").trim().slice(0, 320);
      if (body.length < 2) return { error: "Write the message that should be stored." };
      action.body = body;
      if (type === "send_email") {
        action.subject = String((raw as { subject?: unknown }).subject || "Update on your application").trim().slice(0, 120);
      }
    }
    actions.push(action);
  }
  const conditions: { field: string; op: string; value: string }[] = [];
  if (Array.isArray(input.conditions)) {
    for (const raw of input.conditions) {
      if (!raw || typeof raw !== "object") continue;
      const field = String((raw as { field?: unknown }).field ?? "");
      const op = String((raw as { op?: unknown }).op ?? "");
      const value = String((raw as { value?: unknown }).value ?? "").trim().slice(0, 80);
      if (!field && !value) continue;
      if (field === "score" && op === "gte" && /^\d{1,6}$/.test(value)) conditions.push({ field, op, value });
      else if (field === "source" && op === "eq" && value) conditions.push({ field, op, value });
      else return { error: "That condition is not supported. Use a final score, a source, or no condition." };
    }
  }
  return { trigger: input.trigger, conditions, actions };
}
