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
  for (const part of parts) {
    if (part.length > 120 || !EMAIL.test(part)) return { error: "A copy address is not a valid email." };
  }
  return { emails: parts.map((part) => part.toLowerCase()) };
}

export function mailText(value: string, min: number, max: number, label: string): { text: string } | { error: string } {
  const text = value.replace(/\r\n/g, "\n").trim();
  if (text.length < min) return { error: `${label} is too short.` };
  if (text.length > max) return { error: `${label} is too long.` };
  return { text };
}
