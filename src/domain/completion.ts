import { createHmac, timingSafeEqual } from "node:crypto";

/** Hex HMAC-SHA256 of a raw body. The secret stays on the server. */
export function signBody(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function webhookVerdict(input: {
  signature: string | null;
  expected: string;
  seen: boolean;
}): "accept" | "unsigned" | "mismatch" | "replay" {
  if (!input.signature) return "unsigned";
  const left = Buffer.from(input.signature);
  const right = Buffer.from(input.expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return "mismatch";
  if (input.seen) return "replay";
  return "accept";
}
