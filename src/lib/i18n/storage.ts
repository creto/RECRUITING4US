import type { Locale } from "./translate.ts";

export const LOCALE_KEY = "recruit4us-locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseStoredLocale(value: string | null | undefined): Locale | null {
  return value === "es" || value === "en" ? value : null;
}

/** Read preference from localStorage first, then cookie. Default en. */
export function readStoredLocale(
  storage: Pick<Storage, "getItem"> | null | undefined,
  cookie = "",
): Locale {
  const fromStorage = parseStoredLocale(storage?.getItem(LOCALE_KEY) ?? null);
  if (fromStorage) return fromStorage;
  const match = cookie.match(/(?:^|;\s*)recruit4us-locale=(es|en)(?:;|$)/);
  return match ? (match[1] as Locale) : "en";
}

export function writeStoredLocale(
  locale: Locale,
  storage: Pick<Storage, "setItem"> | null | undefined,
  setCookie: (value: string) => void = (value) => {
    document.cookie = value;
  },
): void {
  storage?.setItem(LOCALE_KEY, locale);
  setCookie(`${LOCALE_KEY}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`);
}

export function readClientLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    return readStoredLocale(window.localStorage, document.cookie);
  } catch {
    return "en";
  }
}
