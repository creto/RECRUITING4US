/** Safe HTML helpers for recruiter mail: sanitize for SMTP, plain-text fallback, and editor seeding. */

const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span", "b", "strong", "i", "em", "u",
  "ul", "ol", "li", "a", "img", "h1", "h2", "h3", "hr", "blockquote",
]);

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function readAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

/** Strip disallowed tags and dangerous attributes. Keep basic formatting + https images + http(s)/mailto links. */
export function sanitizeMailHtml(input: string): string {
  let s = String(input ?? "");
  s = s.replace(/<(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)(\s[^>]*)?>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<\/?(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)(\s[^>]*)?\/?>/gi, "");
  s = s.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript\s*:/gi, "");
  return s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, rawName: string, attrs: string) => {
    const tag = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const closing = full.startsWith("</");
    if (closing) return `</${tag}>`;
    if (tag === "br" || tag === "hr") return `<${tag}>`;
    if (tag === "img") {
      const src = (readAttr(attrs, "src") ?? "").trim();
      if (!/^https:\/\//i.test(src)) return "";
      const alt = readAttr(attrs, "alt") ?? "";
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="max-width:100%;height:auto">`;
    }
    if (tag === "a") {
      const href = (readAttr(attrs, "href") ?? "").trim();
      if (!/^(https?:|mailto:)/i.test(href)) return "<a>";
      return `<a href="${escapeAttr(href)}">`;
    }
    return `<${tag}>`;
  });
}

/** HTML → readable plain text for multipart/alternative. */
export function htmlToPlain(html: string): string {
  let s = String(html ?? "");
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\s*\/\s*(p|div|h1|h2|h3|li|blockquote|tr)\s*>/gi, "\n");
  s = s.replace(/<\s*li\b[^>]*>/gi, "- ");
  s = s.replace(/<\s*hr\s*\/?>/gi, "\n——\n");
  s = s.replace(/<\s*img\b[^>]*\balt\s*=\s*"([^"]*)"[^>]*>/gi, (_, alt) => (alt ? `[${alt}]` : ""));
  s = s.replace(/<\s*img\b[^>]*>/gi, "");
  s = s.replace(/<\s*a\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\s*\/\s*a\s*>/gi, (_, href, text) => {
    const label = text.replace(/<[^>]+>/g, "").trim();
    return label ? `${label} (${href})` : href;
  });
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

/** Seed the editor from stored plain or HTML bodies. */
export function plainToEditorHtml(text: string): string {
  const raw = String(text ?? "");
  if (!raw.trim()) return "";
  if (looksLikeHtml(raw)) return sanitizeMailHtml(raw);
  return raw
    .split(/\n/)
    .map((line) => (line.length ? escapeHtml(line) : "<br>"))
    .join("<br>");
}

/** Normalize outbound body: sanitize HTML when present, otherwise keep plain text. */
export function prepareMailBody(value: string): string {
  const raw = String(value ?? "").slice(0, 8000);
  if (!raw.trim()) return raw;
  if (looksLikeHtml(raw)) return sanitizeMailHtml(raw).slice(0, 8000);
  return raw;
}

export type ContactBlock = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
};

/** One-click signature / contact snippet for the compose toolbar. */
export function contactBlockHtml(contact: ContactBlock): string {
  const lines: string[] = [];
  const name = (contact.name ?? "").trim();
  const email = (contact.email ?? "").trim();
  const phone = (contact.phone ?? "").trim();
  const company = (contact.company ?? "").trim();
  if (name) lines.push(`<strong>${escapeHtml(name)}</strong>`);
  if (email) lines.push(escapeHtml(email));
  if (phone) lines.push(escapeHtml(phone));
  if (company) lines.push(escapeHtml(company));
  if (!lines.length) return "<p><em>Add a name or email in the contact fields. It does not have to be the address on your account.</em></p>";
  return `<p><br></p><p>——</p><p>${lines.join("<br>")}</p>`;
}

export function editorIsEmpty(html: string): boolean {
  const plain = htmlToPlain(html).replace(/\u00a0/g, " ").trim();
  return plain.length === 0;
}
