import { assertSafeOutboundUrl } from "../../domain/rules.ts";

/** HTTPS call to a configured provider. Loopback is allowed only when the test flag is set. */
export async function postJson(url: string, token: string, body: unknown, method = "POST"): Promise<{ status: number; body: string }> {
  const target = assertSafeOutboundUrl(url, process.env.OUTBOUND_ALLOW_LOOPBACK === "1");
  const idempotencyKey = typeof body === "object" && body && "idempotencyKey" in body ? String((body as { idempotencyKey?: string }).idempotencyKey ?? "") : "";
  const response = await fetch(target.toString(), {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, body: await response.text() };
}

/** Form post for an OAuth token endpoint. The body is not logged. */
export async function postForm(url: string, body: string): Promise<{ status: number; body: string }> {
  const target = assertSafeOutboundUrl(url, process.env.OUTBOUND_ALLOW_LOOPBACK === "1");
  const response = await fetch(target.toString(), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, body: await response.text() };
}
