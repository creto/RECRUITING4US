/** Turn a pasted webpage, address-bar copy, or bare host into an http(s) URL. */

const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;

export function normalizeWebsiteUrl(raw: string): { url: string } | { empty: true } | { error: string } {
  let text = String(raw ?? "").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  if (!text) return { empty: true };

  const hrefAttr = text.match(/\bhref\s*=\s*["']([^"']+)["']/i);
  if (hrefAttr?.[1]) text = hrefAttr[1].trim();

  const embedded = text.match(/https?:\/\/[^\s<>"']+/i);
  if (embedded) {
    text = embedded[0];
  } else {
    text = (text.split(" ")[0] ?? text).replace(/^<|>$/g, "");
    if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) {
      text = `https://${text.replace(/^\/+/, "")}`;
    }
  }
  text = text.replace(/[),.;]+$/g, "");

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { error: "Enter a website address, such as https://example.com." };
  }
  if (url.username || url.password) return { error: "Website addresses cannot include a username or password." };
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Use an http or https website address." };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || (!host.includes(".") && host !== "localhost")) {
    return { error: "Enter a website address, such as https://example.com." };
  }
  return { url: url.toString() };
}

/** A stored answer that is itself a website, not a sentence that mentions one. */
export function websiteHref(raw: string): string | null {
  const text = raw.trim();
  if (!text || text.length > 500) return null;
  if (/\s/.test(text) && !/^https?:\/\//i.test(text.split(/\s+/)[0] ?? "")) return null;
  const result = normalizeWebsiteUrl(text);
  return "url" in result ? result.url : null;
}
