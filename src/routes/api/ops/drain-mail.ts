import { createFileRoute } from "@tanstack/react-router";

/**
 * One-shot ops drain for due message_intents + outbox.
 * Requires Authorization: Bearer $DRAIN_TOKEN (project env).
 */
export const Route = createFileRoute("/api/ops/drain-mail")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = (process.env.DRAIN_TOKEN ?? "").trim();
        const auth = request.headers.get("authorization") ?? "";
        const got = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!expected || got.length < 16 || got !== expected) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        try {
          const { drainDueWork } = await import("@/server/talent/drain.server");
          const result = await drainDueWork();
          return Response.json({ ok: true, companies: result.companies });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return Response.json({ ok: false, error: message.slice(0, 240) }, { status: 500 });
        }
      },
    },
  },
});
