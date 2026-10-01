import { es, type Copy } from "./es";

/**
 * i18n seam. Spanish is the only published locale. To add English, create
 * `en.ts` exporting an object typed `Copy` (the compiler then lists every
 * missing string), register it below, and add the locale to the router.
 * Components never branch on locale; they only read `useCopy()`.
 */
export type Locale = "es";
const dictionaries: Record<Locale, Copy> = { es };

export const LOCALE: Locale = "es";

export function useCopy(): Copy {
  return dictionaries[LOCALE];
}

export type { Copy };
