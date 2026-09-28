/**
 * Deterministic hiring and assessment rules.
 * No framework, clock, or database imports — callers pass time and facts in.
 */

export const PRODUCT_NAME = "RECRUIT4US";

export const PERMISSIONS = [
  "job.manage",
  "application.read",
  "application.move",
  "application.note",
  "assessment.author",
  "assessment.publish",
  "assessment.assign",
  "evaluation.grade",
  "offer.manage",
  "offer.approve",
  "offer.read_comp",
  "report.read",
  "candidate.export",
  "integration.manage",
  "member.manage",
  "interview.manage",
  "interview.feedback",
  "workflow.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
  "OWNER",
  "ADMIN",
  "RECRUITER",
  "HIRING_MANAGER",
  "INTERVIEWER",
  "ASSESSMENT_AUTHOR",
  "ASSESSMENT_REVIEWER",
  "ANALYST",
] as const;

export type Role = (typeof ROLES)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: PERMISSIONS,
  RECRUITER: [
    "job.manage",
    "application.read",
    "application.move",
    "application.note",
    "assessment.assign",
    "offer.manage",
    "offer.read_comp",
    "report.read",
    "candidate.export",
    "interview.manage",
    "interview.feedback",
    "workflow.manage",
  ],
  HIRING_MANAGER: [
    "application.read",
    "application.move",
    "application.note",
    "evaluation.grade",
    "offer.approve",
    "offer.read_comp",
    "interview.manage",
    "interview.feedback",
    "report.read",
  ],
  INTERVIEWER: ["application.read", "interview.feedback"],
  ASSESSMENT_AUTHOR: ["assessment.author", "assessment.publish"],
  ASSESSMENT_REVIEWER: ["evaluation.grade"],
  ANALYST: ["report.read"],
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function roleHas(role: string, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Interviewers and reviewers only see work assigned to them. */
export function canReadApplication(input: {
  role: string;
  assignedToActor: boolean;
}): boolean {
  if (!roleHas(input.role, "application.read") && !roleHas(input.role, "evaluation.grade")) {
    return false;
  }
  if (input.role === "INTERVIEWER" || input.role === "ASSESSMENT_REVIEWER") {
    return input.assignedToActor;
  }
  return roleHas(input.role, "application.read");
}

export function canSeeCompensation(role: string): boolean {
  return roleHas(role, "offer.read_comp");
}

export function canSeePeerFeedback(role: string, viewerSubmitted: boolean): boolean {
  if (role === "OWNER" || role === "ADMIN" || role === "RECRUITER" || role === "HIRING_MANAGER") {
    return true;
  }
  return viewerSubmitted;
}

const JOB_EDGES: Record<string, readonly string[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["PAUSED", "CLOSED"],
  PAUSED: ["PUBLISHED", "CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionJob(from: string, to: string): boolean {
  return (JOB_EDGES[from] ?? []).includes(to);
}

export const LIFECYCLES = ["ACTIVE", "REJECTED", "WITHDRAWN", "HIRED"] as const;

export function canSetLifecycle(from: string, to: string): boolean {
  if (from === to) return true;
  if (from === "ACTIVE" && (to === "REJECTED" || to === "WITHDRAWN" || to === "HIRED")) return true;
  if (from === "REJECTED" && to === "ACTIVE") return true;
  if (from === "WITHDRAWN" && to === "ACTIVE") return true;
  if (from === "HIRED" && to === "ACTIVE") return false;
  return false;
}

/** Candidate-facing label. Internal reasons and deliberations stay off this map. */
export function candidateStageLabel(category: string, lifecycle: string): string {
  if (lifecycle === "REJECTED") return "Not moving forward";
  if (lifecycle === "WITHDRAWN") return "Withdrawn";
  if (lifecycle === "HIRED") return "Hired";
  switch (category) {
    case "APPLIED":
      return "Application received";
    case "SCREEN":
      return "In review";
    case "ASSESSMENT":
      return "Assessment";
    case "INTERVIEW":
      return "Interview";
    case "OFFER":
      return "Offer";
    case "DECISION":
      return "Decision";
    default:
      return "In review";
  }
}

export function calculateAttemptDeadline(input: {
  startedAt: Date;
  durationSeconds: number;
  multiplierBasisPoints: number;
  extraSeconds: number;
  hardFinishBy: Date | null;
}): Date {
  if (!Number.isInteger(input.durationSeconds) || input.durationSeconds <= 0) {
    throw new Error("Duration must be a positive whole number of seconds.");
  }
  if (!Number.isInteger(input.multiplierBasisPoints) || input.multiplierBasisPoints <= 0) {
    throw new Error("Accommodation multiplier must be a positive basis-point value.");
  }
  if (!Number.isInteger(input.extraSeconds) || input.extraSeconds < 0) {
    throw new Error("Extra seconds must be a non-negative integer.");
  }
  const effective =
    Math.ceil((input.durationSeconds * input.multiplierBasisPoints) / 10000) + input.extraSeconds;
  if (effective <= 0) throw new Error("The remaining window is not positive.");
  let deadline = new Date(input.startedAt.getTime() + effective * 1000);
  if (input.hardFinishBy && input.hardFinishBy.getTime() < deadline.getTime()) {
    deadline = new Date(input.hardFinishBy.getTime());
  }
  if (deadline.getTime() <= input.startedAt.getTime()) {
    throw new Error("The remaining window is not positive.");
  }
  return deadline;
}

export function acceptsResponseAt(input: { status: string; deadline: Date; now: Date }): boolean {
  if (input.status !== "IN_PROGRESS") return false;
  return input.now.getTime() < input.deadline.getTime();
}

/** A candidate may start only while server time is strictly before start-by. */
export function canStartAttempt(input: { now: Date; startBy: Date; deadline: Date }): boolean {
  if (input.now.getTime() >= input.startBy.getTime()) return false;
  if (input.deadline.getTime() <= input.now.getTime()) return false;
  return true;
}

export function gradeExactMultipleChoice(answer: readonly string[], correct: readonly string[]): number {
  const a = [...answer].map(String).sort();
  const c = [...correct].map(String).sort();
  if (a.length !== c.length) return 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== c[i]) return 0;
  return a.length === 0 ? 0 : 1;
}

const DECIMAL_SCALE = 12;
const SCALE_FACTOR = 10n ** BigInt(DECIMAL_SCALE);

/** Parse a plain decimal into a scaled integer. Rejects locale commas and non-finite text. */
export function parseDecimal(input: string): bigint | null {
  const t = input.trim();
  if (!/^[+-]?(?:\d+\.\d+|\d+|\.\d+)$/.test(t)) return null;
  const neg = t.startsWith("-");
  const raw = t.replace(/^[+-]/, "");
  const [wholeRaw, fracRaw = ""] = raw.split(".");
  if (fracRaw.length > DECIMAL_SCALE) return null;
  const whole = wholeRaw === "" ? "0" : wholeRaw;
  if (whole.length > 18) return null;
  const digits = whole + fracRaw.padEnd(DECIMAL_SCALE, "0");
  const n = BigInt(digits);
  return neg ? -n : n;
}

/**
 * Accept when abs(answer - expected) <= max(absTolerance, relTolerance * abs(expected)).
 * relTolerance is a ratio ("0.01" = 1%), not a percent.
 */
export function gradeNumeric(input: {
  answer: string;
  expected: string;
  absTolerance: string;
  relTolerance: string;
}): boolean {
  const answer = parseDecimal(input.answer);
  const expected = parseDecimal(input.expected);
  const absTolerance = parseDecimal(input.absTolerance);
  const relTolerance = parseDecimal(input.relTolerance);
  if (answer === null || expected === null || absTolerance === null || relTolerance === null) return false;
  if (absTolerance < 0n || relTolerance < 0n) return false;
  const absExpected = expected < 0n ? -expected : expected;
  const relBand = (relTolerance * absExpected) / SCALE_FACTOR;
  const band = absTolerance > relBand ? absTolerance : relBand;
  const diff = answer > expected ? answer - expected : expected - answer;
  return diff <= band;
}

export type SectionScoreInput = {
  earned: number | null;
  possible: number;
  weightBasisPoints: number;
  status: "FINAL" | "PENDING";
};

export function calculateWeightedScore(sections: readonly SectionScoreInput[]): {
  status: "FINAL" | "PENDING";
  basisPoints: number | null;
  numerator: string | null;
  denominator: string | null;
} {
  if (sections.length === 0 || sections.some((s) => s.status !== "FINAL" || s.earned === null)) {
    return { status: "PENDING", basisPoints: null, numerator: null, denominator: null };
  }
  let num = 0n;
  let den = 1n;
  for (const section of sections) {
    if (!Number.isInteger(section.possible) || section.possible <= 0) {
      return { status: "PENDING", basisPoints: null, numerator: null, denominator: null };
    }
    if (!Number.isInteger(section.earned) || section.earned! < 0) {
      return { status: "PENDING", basisPoints: null, numerator: null, denominator: null };
    }
    const n = BigInt(section.earned!) * BigInt(section.weightBasisPoints);
    const d = BigInt(section.possible);
    num = num * d + n * den;
    den = den * d;
    const g = gcd(num < 0n ? -num : num, den);
    num /= g;
    den /= g;
  }
  let basisPoints: number | null = null;
  if (den !== 0n && num % den === 0n) {
    const whole = num / den;
    if (whole <= BigInt(Number.MAX_SAFE_INTEGER) && whole >= BigInt(Number.MIN_SAFE_INTEGER)) {
      basisPoints = Number(whole);
    }
  } else if (den !== 0n) {
    // Floor only for display storage; decisions must use numerator/denominator.
    const floored = num / den;
    if (floored <= BigInt(Number.MAX_SAFE_INTEGER)) basisPoints = Number(floored);
  }
  return {
    status: "FINAL",
    basisPoints,
    numerator: num.toString(),
    denominator: den.toString(),
  };
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0n ? 1n : x;
}

/** Compare earned/possible against a threshold expressed in basis points. No display rounding. */
export function meetsThreshold(
  score: { earned: number; possible: number },
  thresholdBasisPoints: number,
): boolean {
  if (!Number.isInteger(score.possible) || score.possible <= 0) return false;
  if (!Number.isInteger(score.earned) || score.earned < 0) return false;
  if (!Number.isInteger(thresholdBasisPoints) || thresholdBasisPoints < 0) return false;
  return BigInt(score.earned) * 10000n >= BigInt(thresholdBasisPoints) * BigInt(score.possible);
}

export function rubricComplete(
  ratings: Readonly<Record<string, number | null | undefined>>,
  requiredIds: readonly string[],
): boolean {
  return requiredIds.every((id) => {
    const value = ratings[id];
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4;
  });
}

/** Average of finalized reviewer dimension scores on a shared 0–4 scale. Incomplete reviews are omitted. */
export function aggregateRubric(
  reviews: readonly { complete: boolean; ratings: Readonly<Record<string, number>> }[],
  dimensionIds: readonly string[],
): { status: "FINAL" | "PENDING"; byDimension: Record<string, number | null> } {
  const complete = reviews.filter((r) => r.complete);
  if (complete.length === 0) {
    return {
      status: "PENDING",
      byDimension: Object.fromEntries(dimensionIds.map((id) => [id, null])),
    };
  }
  const byDimension: Record<string, number | null> = {};
  for (const id of dimensionIds) {
    const values = complete.map((r) => r.ratings[id]).filter((n) => typeof n === "number");
    if (values.length !== complete.length) {
      byDimension[id] = null;
    } else {
      byDimension[id] = values.reduce((s, n) => s + n, 0) / values.length;
    }
  }
  return { status: "FINAL", byDimension };
}

export type DedupeEvent = { id: string; timestampMs: number };

/** Keep the first event for an id; drop later ones within an inclusive window of the last retained event. */
export function deduplicateEvents(events: readonly DedupeEvent[], windowMs: number): DedupeEvent[] {
  if (!Number.isSafeInteger(windowMs) || windowMs < 0) {
    throw new Error("windowMs must be a non-negative safe integer.");
  }
  if (events.length > 100_000) throw new Error("At most 100,000 events are supported.");
  let previous = -1;
  for (const event of events) {
    if (typeof event.id !== "string" || event.id.length === 0 || event.id.length > 200) {
      throw new Error("Event id is invalid.");
    }
    if (!Number.isSafeInteger(event.timestampMs) || event.timestampMs < 0) {
      throw new Error("Timestamps must be non-negative safe integers.");
    }
    if (event.timestampMs < previous) throw new Error("Events must be sorted by timestamp.");
    previous = event.timestampMs;
  }
  const lastRetained = new Map<string, number>();
  const kept: DedupeEvent[] = [];
  for (const event of events) {
    const last = lastRetained.get(event.id);
    if (last !== undefined && event.timestampMs - last <= windowMs) continue;
    lastRetained.set(event.id, event.timestampMs);
    kept.push(event);
  }
  return kept;
}

export function escapeCsvCell(value: string): string {
  let cell = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^[=+\-@\t\n]/.test(cell)) cell = `'${cell}`;
  if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\r\n");
}

const SAVED_VIEW_FIELDS = new Set(["name", "email", "source", "tag", "jobId"]);
const SAVED_VIEW_OPS = new Set(["eq", "contains"]);

export function validateSavedViewFilters(
  filters: readonly { field?: unknown; op?: unknown; value?: unknown }[],
): { ok: true } | { ok: false; message: string } {
  if (filters.length > 12) return { ok: false, message: "A saved view can have at most 12 filters." };
  for (const filter of filters) {
    if (typeof filter.field !== "string" || !SAVED_VIEW_FIELDS.has(filter.field)) {
      return { ok: false, message: "That filter field is not supported." };
    }
    if (typeof filter.op !== "string" || !SAVED_VIEW_OPS.has(filter.op)) {
      return { ok: false, message: "That filter operator is not supported." };
    }
    if (typeof filter.value !== "string" || filter.value.length > 200) {
      return { ok: false, message: "Filter values must be text under 200 characters." };
    }
  }
  return { ok: true };
}

export type Tri = "true" | "false" | "unknown";

export function triAnd(values: readonly Tri[]): Tri {
  if (values.includes("false")) return "false";
  if (values.includes("unknown")) return "unknown";
  return "true";
}

export function triEq(actual: string | null | undefined, expected: string): Tri {
  if (actual == null || actual === "") return "unknown";
  return actual === expected ? "true" : "false";
}

/** Unknown scores do not count as failing a threshold. */
export function triScoreAtLeast(
  basisPoints: number | null,
  status: "FINAL" | "PENDING" | "FAILED",
  threshold: number,
): Tri {
  if (status !== "FINAL" || basisPoints == null) return "unknown";
  return basisPoints >= threshold ? "true" : "false";
}

export function classifyDelivery(result: "ok" | "rejected" | "timeout"): "DELIVERED" | "FAILED" | "UNKNOWN" {
  if (result === "ok") return "DELIVERED";
  if (result === "rejected") return "FAILED";
  return "UNKNOWN";
}

export type PublishIssue = { code: string; message: string };

export function validateAssessmentPublish(input: {
  sections: readonly {
    title: string;
    weightBasisPoints: number;
    items: readonly {
      type: string;
      hasKey: boolean;
      hasRubric: boolean;
      points: number;
    }[];
    poolPick?: number | null;
  }[];
  durationSeconds: number;
}): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const items = input.sections.flatMap((s) => s.items);
  if (items.length === 0) issues.push({ code: "empty", message: "Add at least one question before publishing." });
  const weight = input.sections.reduce((sum, s) => sum + s.weightBasisPoints, 0);
  if (weight !== 10000) {
    issues.push({ code: "weights", message: "Section weights must total 100%." });
  }
  if (!Number.isInteger(input.durationSeconds) || input.durationSeconds <= 0) {
    issues.push({ code: "timing", message: "Duration must be a positive number of seconds." });
  }
  for (const section of input.sections) {
    if (section.items.length === 0) {
      issues.push({ code: "empty-section", message: `Section “${section.title}” has no questions.` });
    }
    if (section.poolPick != null) {
      if (!Number.isInteger(section.poolPick) || section.poolPick < 1 || section.poolPick > section.items.length) {
        issues.push({
          code: "pool",
          message: `Section “${section.title}” does not have enough eligible questions for the pool.`,
        });
      }
    }
    for (const item of section.items) {
      if (!Number.isInteger(item.points) || item.points <= 0) {
        issues.push({ code: "points", message: "Every question needs a positive point value." });
      }
      const auto = item.type === "single" || item.type === "multi" || item.type === "numeric";
      if (auto && !item.hasKey) {
        issues.push({ code: "key", message: "Objective questions need an answer key before publishing." });
      }
      if (!auto && !item.hasRubric) {
        issues.push({ code: "rubric", message: "Human-graded questions need a rubric before publishing." });
      }
    }
  }
  return issues;
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number };

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function sameLocal(parts: ZonedParts, y: number, mo: number, d: number, h: number, mi: number): boolean {
  return parts.year === y && parts.month === mo && parts.day === d && parts.hour === h && parts.minute === mi;
}

/**
 * Convert a timezone-local civil time to UTC.
 * Rejects DST gaps and ambiguous overlap times instead of silently shifting them.
 */
export function zonedLocalToUtc(local: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) throw new Error("Enter a local time as YYYY-MM-DDTHH:mm.");
  let zone = timeZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date());
  } catch {
    throw new Error("Choose a valid timezone.");
  }
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const h = Number(match[4]);
  const mi = Number(match[5]);
  if (h > 23 || mi > 59 || mo < 1 || mo > 12 || d < 1 || d > 31) {
    throw new Error("That date and time is not valid.");
  }
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const shown = zonedParts(new Date(guess), zone);
  const shownUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, 0);
  const corrected = new Date(guess - (shownUtc - guess));
  if (!sameLocal(zonedParts(corrected, zone), y, mo, d, h, mi)) {
    throw new Error("That local time falls in a daylight-saving gap. Choose another time.");
  }
  const hour = 60 * 60 * 1000;
  if (
    sameLocal(zonedParts(new Date(corrected.getTime() + hour), zone), y, mo, d, h, mi) ||
    sameLocal(zonedParts(new Date(corrected.getTime() - hour), zone), y, mo, d, h, mi)
  ) {
    throw new Error("That local time is ambiguous because clocks overlap. Choose another time.");
  }
  return corrected;
}

export function buildIcs(input: {
  uid: string;
  sequence: number;
  title: string;
  description: string;
  startUtc: Date;
  endUtc: Date;
  location: string;
  status: "CONFIRMED" | "CANCELLED";
  stamp?: Date;
}): string {
  const stamp = input.stamp ?? input.startUtc;
  const fmt = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const text = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RECRUIT4US//Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:" + (input.status === "CANCELLED" ? "CANCEL" : "REQUEST"),
    "BEGIN:VEVENT",
    "UID:" + text(input.uid),
    "SEQUENCE:" + String(input.sequence),
    "DTSTAMP:" + fmt(stamp),
    "DTSTART:" + fmt(input.startUtc),
    "DTEND:" + fmt(input.endUtc),
    "SUMMARY:" + text(input.title),
    "DESCRIPTION:" + text(input.description),
    "LOCATION:" + text(input.location),
    "STATUS:" + input.status,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return slug || "company";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Same key and same fingerprint replays. Same key and a different fingerprint conflicts. */
export function idempotencyDecision(
  stored: { payloadHash: string } | null,
  payloadHash: string,
): "proceed" | "replay" | "conflict" {
  if (!stored) return "proceed";
  if (stored.payloadHash === payloadHash) return "replay";
  return "conflict";
}

/** Only a clean scan may be downloaded. Quarantine and infection stay blocked. */
export function canDownloadFile(scanState: string): boolean {
  return scanState === "CLEAN";
}

export function executionUnavailable(): {
  available: false;
  reason: string;
} {
  return {
    available: false,
    reason:
      "No remote code runner is configured. This result does not execute a program and does not include hidden tests.",
  };
}

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

/** Reject obviously unsafe outbound integration URLs. Not a complete SSRF sandbox. */
export function assertSafeOutboundUrl(raw: string, allowLocalDev: boolean): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid http or https URL.");
  }
  if (url.username || url.password) throw new Error("URLs with embedded credentials are not allowed.");
  if (url.protocol !== "https:" && !(allowLocalDev && url.protocol === "http:")) {
    throw new Error("Only https URLs are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    if (!(allowLocalDev && (host === "localhost" || host === "127.0.0.1"))) {
      throw new Error("That host is not allowed for an integration URL.");
    }
  }
  if (
    host === "0.0.0.0" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "::1" ||
    host.startsWith("fd") ||
    host.startsWith("fe80")
  ) {
    if (!(allowLocalDev && (host === "127.0.0.1" || host === "::1"))) {
      throw new Error("Private and link-local addresses are not allowed.");
    }
  }
  return url;
}

export function filePolicy(input: { name: string; mime: string; size: number }): string | null {
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > 500_000) {
    return "Files must be between 1 byte and 500 KB in this workspace.";
  }
  const name = input.name.toLowerCase();
  const allowed: Record<string, string[]> = {
    pdf: ["application/pdf"],
    txt: ["text/plain"],
    png: ["image/png"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    csv: ["text/csv", "text/plain", "application/vnd.ms-excel"],
  };
  const ext = name.split(".").pop() ?? "";
  if (!allowed[ext]) return "Upload a PDF, text, CSV, PNG, or JPEG file.";
  if (!allowed[ext].includes(input.mime)) return "The file type does not match its contents label.";
  if (name.endsWith(".html") || name.endsWith(".svg") || name.endsWith(".exe")) {
    return "That file type is not allowed.";
  }
  return null;
}

export function scanDecision(input: { name: string; textSample: string }): "CLEAN" | "INFECTED" {
  const sample = `${input.name}\n${input.textSample}`.toLowerCase();
  if (sample.includes("eicar") || sample.includes("<script") || sample.includes("onerror=")) return "INFECTED";
  return "CLEAN";
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable Fisher-Yates. The same seed and items always return the same order. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  let state = hashSeed(seed) || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const swap = out[i]!;
    out[i] = out[j]!;
    out[j] = swap;
  }
  return out;
}

/** Draw a fixed subset. Fails when the bank is smaller than the draw. */
export function choosePool<T>(items: readonly T[], pick: number, seed: string): T[] {
  if (!Number.isInteger(pick) || pick < 1) throw new Error("Pool pick must be a positive integer.");
  if (pick > items.length) throw new Error("The pool does not have enough eligible questions.");
  return seededShuffle(items, seed).slice(0, pick);
}

export function planExtension(input: {
  status: string;
  deadline: Date;
  extraSeconds: number;
  hardFinishBy: Date | null;
}): Date {
  if (input.status !== "IN_PROGRESS") throw new Error("Only an open attempt can be extended.");
  if (!Number.isInteger(input.extraSeconds) || input.extraSeconds <= 0) {
    throw new Error("Extension must be a positive number of seconds.");
  }
  let next = new Date(input.deadline.getTime() + input.extraSeconds * 1000);
  if (input.hardFinishBy && next.getTime() > input.hardFinishBy.getTime()) {
    next = new Date(input.hardFinishBy.getTime());
  }
  if (next.getTime() <= input.deadline.getTime()) {
    throw new Error("The hard finish leaves no additional time.");
  }
  return next;
}

export function assertSameCompany(leftCompanyId: string, rightCompanyId: string) {
  if (leftCompanyId !== rightCompanyId) {
    throw new Error("Candidates from different companies cannot be merged.");
  }
}

/** Keep the provider scale. Unparseable input is a failure with no invented zero. */
export function mapExternalScore(input: { raw: string; scaleMin: string; scaleMax: string }): {
  status: "FINAL" | "FAILED";
  basisPoints: number | null;
} {
  const raw = parseDecimal(input.raw);
  const min = parseDecimal(input.scaleMin);
  const max = parseDecimal(input.scaleMax);
  if (raw == null || min == null || max == null || max <= min || raw < min || raw > max) {
    return { status: "FAILED", basisPoints: null };
  }
  const basis = Number(((raw - min) * 10000n) / (max - min));
  return { status: "FINAL", basisPoints: basis };
}

/** A scanner error leaves the file quarantined. It does not approve it. */
export function applyScan(scanner: "CLEAN" | "INFECTED" | "ERROR"): "QUARANTINE" | "CLEAN" | "INFECTED" {
  if (scanner === "ERROR") return "QUARANTINE";
  return scanner;
}

export function grantAllows(input: {
  now: Date;
  expiresAt: Date;
  fileId: string;
  grantFileId: string;
  companyId: string;
  grantCompanyId: string;
  userId: string;
  grantUserId: string;
}): boolean {
  if (input.now.getTime() >= input.expiresAt.getTime()) return false;
  return (
    input.fileId === input.grantFileId &&
    input.companyId === input.grantCompanyId &&
    input.userId === input.grantUserId
  );
}

export function retentionDue(createdAt: Date, now: Date, retentionDays: number): boolean {
  if (!Number.isInteger(retentionDays) || retentionDays < 30) return false;
  return now.getTime() - createdAt.getTime() >= retentionDays * 86_400_000;
}

/** Candidate download. Internal notes and answer keys are not part of this object. */
export function candidateExportPayload<T>(applications: readonly T[]): { applications: T[] } {
  return { applications: [...applications] };
}

export function distinctApplicationCount(applicationIds: readonly string[]): number {
  return new Set(applicationIds).size;
}

export function includeInScoreDistribution(status: string): boolean {
  return status === "FINAL";
}

export function reportDayWindow(localDate: string, timeZone: string): { start: Date; end: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error("Use a date as YYYY-MM-DD.");
  const start = zonedLocalToUtc(`${localDate}T00:00`, timeZone);
  const [year, month, day] = localDate.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day!));
  next.setUTCDate(next.getUTCDate() + 1);
  const end = zonedLocalToUtc(`${next.toISOString().slice(0, 10)}T00:00`, timeZone);
  return { start, end };
}

export function bulkProgress(ids: readonly string[], completed: number): { done: boolean; remaining: string[] } {
  const cursor = Math.max(0, Math.min(ids.length, completed));
  return { done: cursor >= ids.length, remaining: ids.slice(cursor) };
}

export function operationalFailure(): { status: "FAILED"; basisPoints: null; reason: string } {
  return {
    status: "FAILED",
    basisPoints: null,
    reason: "The scoring provider did not return a result. No score was invented.",
  };
}

export function bookingIntent(existingId: string | null): "reuse" | "create" {
  return existingId ? "reuse" : "create";
}

export function outboxDisposition(attempts: number, leaseActive: boolean): "claim" | "skip" | "fail" {
  if (attempts >= 5) return "fail";
  if (leaseActive) return "skip";
  return "claim";
}

export function questionIndex(index: number, key: string, length: number): number | null {
  if (key === "ArrowRight") return index + 1 < length ? index + 1 : null;
  if (key === "ArrowLeft") return index > 0 ? index - 1 : null;
  return null;
}

export function saveStatusLabel(state: string | undefined): string {
  if (state === "saving") return "Saving…";
  if (state === "saved") return "Saved on the server.";
  if (state === "unsaved") return "Unsaved changes.";
  if (state === "conflict") return "Conflict. The server copy is shown.";
  if (state === "offline") return "Not saved. Check the connection and try again.";
  if (state === "rejected") return "Not saved.";
  return "Answers save after you pause typing.";
}

export const DEFAULT_TEXT_RUBRIC = {
  dimensions: [
    { id: "substance", label: "Substance", anchors: ["Missing", "Thin", "Adequate", "Strong", "Exceptional"] },
    { id: "clarity", label: "Clarity", anchors: ["Unclear", "Hard to follow", "Understandable", "Clear", "Precise"] },
  ],
} as const;

const HUMAN_QUESTION_TYPES = ["text", "code", "file", "sql", "spreadsheet", "recording"] as const;

export function gradingMethod(type: string): "exact" | "numeric" | "rubric" | null {
  if (type === "single" || type === "multi") return "exact";
  if (type === "numeric") return "numeric";
  if ((HUMAN_QUESTION_TYPES as readonly string[]).includes(type)) return "rubric";
  return null;
}

/** The rule the grader actually applies. No answer key. */
export function gradingGuide(type: string): { method: "exact" | "numeric" | "rubric"; title: string; steps: string[] } {
  const method = gradingMethod(type);
  if (method === "exact") {
    return {
      method,
      title: type === "multi" ? "Exact set" : "Exact option",
      steps: [
        "The saved selection is compared with the answer key as a set. Order does not matter.",
        "The sets must be identical. A missing option or an extra option scores 0.",
        "There is no partial credit.",
        "A blank answer scores 0 only after a final submission.",
        "Credit is 1 or 0, then multiplied by the question's points.",
      ],
    };
  }
  if (method === "numeric") {
    return {
      method,
      title: "Numeric tolerance",
      steps: [
        "The answer and the expected value are parsed as plain decimals. Commas, NaN, and Infinity score 0.",
        "The answer is accepted when the absolute difference is at most the larger of the absolute tolerance and (relative tolerance × |expected|).",
        "Relative tolerance is a ratio: 0.01 means 1 percent, not 1.",
        "The boundary is inclusive. A match earns the full point value. A miss earns 0.",
      ],
    };
  }
  if (type === "code") {
    return {
      method: "rubric",
      title: "Code ranking",
      steps: [
        "Saved source is judged in a separate process when the question has cases. The application process does not eval it.",
        "Fully correct answers rank by estimated time class, then space class, then measured time. The class is a heuristic, not a proof.",
        "A wrong or partial answer does not outrank a correct one, even if it looks faster.",
        "Complexity credit is withheld until every case passes. A timeout stores no score. It is not zero.",
        "A person still scores the rubric from 0 to 4. That review stays pending until every dimension is scored.",
      ],
    };
  }
  if (method === "rubric") {
    return {
      method,
      title: "Human rubric",
      steps: [
        "The answer is stored. SQL, spreadsheets, and recordings are not executed.",
        "Each required dimension is an integer from 0 to 4.",
        "The review stays pending until every required dimension is scored. Pending is not zero.",
        "Earned points are the sum of the dimension scores. Possible points are 4 times the number of dimensions.",
        "The stored score is round(earned ÷ possible × 10000) basis points. 10000 is 100 percent.",
        "If a scoring provider fails, the result is an operational failure. No zero is invented.",
      ],
    };
  }
  throw new Error("That question type is not supported.");
}

type RubricDimension = { id: string; label: string; anchors: string[] };

function rubricDimensions(rubric: unknown): RubricDimension[] {
  if (!rubric || typeof rubric !== "object") return [];
  const dimensions = (rubric as { dimensions?: unknown }).dimensions;
  if (!Array.isArray(dimensions)) return [];
  return dimensions.flatMap((dimension) => {
    if (!dimension || typeof dimension !== "object") return [];
    const id = (dimension as { id?: unknown }).id;
    const label = (dimension as { label?: unknown }).label;
    const anchors = (dimension as { anchors?: unknown }).anchors;
    if (typeof id !== "string" || typeof label !== "string" || !Array.isArray(anchors)) return [];
    return [{ id, label, anchors: anchors.filter((anchor): anchor is string => typeof anchor === "string") }];
  });
}

function optionRows(payload: unknown): { id: string; label: string }[] {
  if (!payload || typeof payload !== "object") return [];
  const options = (payload as { options?: unknown }).options;
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (!option || typeof option !== "object") return [];
    const id = (option as { id?: unknown }).id;
    const label = (option as { label?: unknown }).label;
    if (typeof id !== "string" || typeof label !== "string") return [];
    return [{ id, label }];
  });
}

function keyStrings(key: unknown, field: string): string[] {
  if (!key || typeof key !== "object") return [];
  const value = (key as Record<string, unknown>)[field];
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function keyText(key: unknown, field: string): string {
  if (!key || typeof key !== "object") return "";
  const value = (key as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}

/** Author-facing grading line. Copies only the fields the grader uses, never other key material. */
export function explainAuthorQuestion(input: {
  type: string;
  points: number;
  payload: unknown;
  rubric: unknown;
  key: unknown;
}): { method: "exact" | "numeric" | "rubric"; title: string; steps: string[]; keySummary: string } {
  const guide = gradingGuide(input.type);
  const points = Number.isInteger(input.points) && input.points > 0 ? input.points : 0;
  if (guide.method === "exact") {
    const options = optionRows(input.payload);
    const correct = keyStrings(input.key, "correct");
    const labels = correct.map((id) => options.find((option) => option.id === id)?.label ?? id);
    const listed = labels.length ? labels.join("; ") : "no option selected";
    return {
      ...guide,
      keySummary: `Full credit (${points} pt) only when the selection is exactly: ${listed}. Any other set scores 0. Partial credit is not used.`,
    };
  }
  if (guide.method === "numeric") {
    const expected = keyText(input.key, "expected");
    const abs = keyText(input.payload, "absTolerance") || "0";
    const rel = keyText(input.payload, "relTolerance") || "0";
    if (!expected) {
      return { ...guide, keySummary: "This numeric question has no expected value, so a submitted answer cannot earn credit." };
    }
    return {
      ...guide,
      keySummary: `Full credit (${points} pt) when the answer is within the larger of absolute tolerance ${abs} and relative tolerance ${rel} × |${expected}|. A miss is 0.`,
    };
  }
  if (input.type === "code") {
    const dimensions = rubricDimensions(input.rubric);
    if (dimensions.length === 0) {
      return { ...guide, keySummary: "This question has no rubric, so it cannot be published or finalized." };
    }
    const names = dimensions.map((dimension) => dimension.label).join(" and ");
    return {
      ...guide,
      keySummary: `Judge cases are worth up to 7000 basis points. A fully correct answer also earns up to 2000 for a better estimated time class and up to 1000 for measured time. The class is a heuristic, not a proof. ${names} is still scored by a person from 0 to 4. A timeout is not stored as zero.`,
    };
  }
  const dimensions = rubricDimensions(input.rubric);
  if (dimensions.length === 0) {
    return { ...guide, keySummary: "This question has no rubric, so it cannot be published or finalized." };
  }
  const names = dimensions.map((dimension) => dimension.label).join(" and ");
  return {
    ...guide,
    keySummary: `A person scores ${names} from 0 to 4. The score is round(sum ÷ ${dimensions.length * 4} × 10000) basis points. Until every dimension is scored, the result stays pending, not zero.`,
  };
}

/** Same conversion submitReview stores. Incomplete ratings stay pending. */
export function manualBasisPoints(
  ratings: Readonly<Record<string, number | null | undefined>>,
  dimensionIds: readonly string[],
): { earned: number; possible: number; basisPoints: number } | null {
  if (dimensionIds.length === 0 || !rubricComplete(ratings, dimensionIds)) return null;
  const earned = dimensionIds.reduce((sum, id) => sum + (ratings[id] as number), 0);
  const possible = dimensionIds.length * 4;
  return { earned, possible, basisPoints: Math.round((earned / possible) * 10000) };
}

