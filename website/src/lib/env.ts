/** Build-time configuration. Every value has a safe default. */
const env = import.meta.env;

export const APP_ORIGIN: string = (env.VITE_APP_ORIGIN ?? "").replace(/\/$/, "");
export const SITE_ORIGIN: string = (env.VITE_SITE_ORIGIN || "https://recruit.tiglobal.com.co").replace(/\/$/, "");
export const DEMO_ENDPOINT: string = env.VITE_DEMO_ENDPOINT ?? "";
export const DEMO_EMAIL: string = env.VITE_DEMO_EMAIL || "info@tiglobal.com.co";

/** Link into the hiring app. The website never renders the login itself. */
export function appHref(path = "/login"): string {
  return `${APP_ORIGIN}${path}`;
}
