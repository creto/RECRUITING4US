import { randomBytes } from "node:crypto";
import { env } from "@/lib/env.server";

const globalRef = globalThis as typeof globalThis & {
  __recruit4usAccessTokenSecret__?: string;
};

/** Process-stable preview secret (never a public forgeable literal). */
function previewAccessSecret(): string {
  globalRef.__recruit4usAccessTokenSecret__ ??= randomBytes(32).toString("hex");
  return globalRef.__recruit4usAccessTokenSecret__;
}

/**
 * HMAC secret for portal / assess access tokens and OTP code hashes.
 *
 * Fail-closed when a real database is configured and BETTER_AUTH_SECRET is
 * missing — never fall back to a known literal that anyone can forge.
 * Local/preview without DATABASE_URL uses a process-stable random secret.
 */
export function accessTokenSecret(purpose = "Access"): string {
  const configured = (env("BETTER_AUTH_SECRET") ?? process.env.BETTER_AUTH_SECRET ?? "").trim();
  if (configured) return configured;
  if (process.env.DATABASE_URL?.trim()) {
    throw new Error(
      `${purpose} signing is unavailable: set BETTER_AUTH_SECRET when DATABASE_URL is configured.`,
    );
  }
  return previewAccessSecret();
}

/** Test helper: clear the process preview secret between cases. */
export function resetPreviewAccessSecretForTests() {
  delete globalRef.__recruit4usAccessTokenSecret__;
}
