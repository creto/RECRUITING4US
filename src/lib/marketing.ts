/**
 * Public marketing website origin.
 * Empty (default) = same host as the app (unified Signature-style deploy).
 * Set VITE_MARKETING_ORIGIN only when marketing is on a separate origin.
 */
export const MARKETING_ORIGIN = (import.meta.env.VITE_MARKETING_ORIGIN || "").replace(/\/$/, "");

/** Absolute-or-same-origin URL on the marketing site. Defaults to the homepage. */
export function marketingHref(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${MARKETING_ORIGIN}${p === "/" ? "/" : p}`;
}
