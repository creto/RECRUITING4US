export const MAIL_NOTE =
  "Stored in RECRUIT4US and shown in the candidate portal when the email matches. It was not delivered by an outside mail server.";

export const MAIL_TOKENS = ["candidate_name", "job_title", "company_name", "recruiter_name"] as const;

export const DEFAULT_MAIL_TEMPLATES = [
  {
    name: "Application received",
    subject: "We received your application, {{candidate_name}}",
    body: "Hello {{candidate_name}},\n\n{{company_name}} has your application for {{job_title}}. This note is in your candidate portal.\n\n{{recruiter_name}}",
  },
  {
    name: "Interview",
    subject: "Interview for {{job_title}}",
    body: "Hello {{candidate_name}},\n\n{{company_name}} would like to talk with you about {{job_title}}. A scheduled time, if there is one, is on your candidate portal.\n\n{{recruiter_name}}",
  },
  {
    name: "Moving forward",
    subject: "Next step for {{job_title}}",
    body: "Hello {{candidate_name}},\n\n{{company_name}} is moving your application for {{job_title}} forward.\n\n{{recruiter_name}}",
  },
  {
    name: "Not moving forward",
    subject: "Your application for {{job_title}}",
    body: "Hello {{candidate_name}},\n\n{{company_name}} is not moving forward with your application for {{job_title}}. Thank you for the time you spent.\n\n{{recruiter_name}}",
  },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Any inbox, including one that is not on the signed-in account.
 * Accepts `ada@gmail.com` and `Ada <ada@gmail.com>`.
 */
export function parseRecipient(value: string): { email: string } | { error: string } {
  const text = value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!text) return { error: "Enter an email address." };
  const angled = text.match(/<([^<>\s]+)>/);
  const email = (angled?.[1] ?? text).trim().toLowerCase();
  if (email.length > 200 || !EMAIL.test(email)) return { error: "Enter a valid email address." };
  return { email };
}

/** Replaces known {{tokens}}. Anything else is left in place. */
export function renderMail(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (full, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) return full;
    return values[key] ?? "";
  });
}

export function parseCc(value: string): { emails: string[] } | { error: string } {
  const parts = value.split(/[,;]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 3) return { error: "Use at most three copy addresses." };
  const emails: string[] = [];
  for (const part of parts) {
    const parsed = parseRecipient(part);
    if ("error" in parsed || parsed.email.length > 120) return { error: "A copy address is not a valid email." };
    emails.push(parsed.email);
  }
  return { emails };
}

export function mailText(value: string, min: number, max: number, label: string): { text: string } | { error: string } {
  const text = value.replace(/\r\n/g, "\n").trim();
  if (text.length < min) return { error: `${label} is too short.` };
  if (text.length > max) return { error: `${label} is too long.` };
  return { text };
}

/** Outbound copy for an assigned assessment. Each URL must sit on its own line so the mail card turns it into a button. */
export function assessmentNotice(input: {
  assessment: string;
  minutes: number;
  startLabel: string;
  link: string;
  portalLink?: string;
  greeting?: string;
  company?: string;
  job?: string;
  recruiter?: string;
}): string {
  const assessment = input.assessment.replace(/[{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "an assessment";
  const minutes = Math.max(1, Math.round(input.minutes));
  const hello = input.greeting ?? "Hello {{candidate_name}},";
  const company = input.company ?? "{{company_name}}";
  const job = input.job ?? "{{job_title}}";
  const recruiter = input.recruiter ?? "{{recruiter_name}}";
  const portal = (input.portalLink ?? "").trim();
  const lines = [
    hello,
    "",
    `${company} asked you to complete ${assessment} for ${job}.`,
    "",
    `Time limit: ${minutes} minutes.`,
    `Start by: ${input.startLabel}.`,
    "Opening this email does not start the timer. On the page, enter the invited email and your application id. The timer starts when you press Start.",
    "",
    input.link,
  ];
  if (portal) {
    lines.push("", "Track progress, messages, and offers in the applicant portal:", "", portal);
  }
  lines.push("", recruiter);
  return lines.join("\n");
}
