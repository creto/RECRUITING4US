/**
 * Tenant brand marks for the app shell / careers header.
 * Files live under public/companies/. This is product UI branding, not email BIMI.
 */
const HOSTED_COMPANY_LOGOS: Record<string, string> = {
  tiglobal: "/companies/tiglobal-logo.gif",
};

/** Prefer a stored https/same-origin logo URL; otherwise a hosted public asset for the slug. */
export function companyBrandLogoUrl(slug: string, storedLogoUrl = ""): string {
  const stored = storedLogoUrl.trim();
  if (stored.startsWith("https://") || stored.startsWith("/")) return stored.slice(0, 300);
  return HOSTED_COMPANY_LOGOS[slug.trim().toLowerCase()] ?? "";
}
