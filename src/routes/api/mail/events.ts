import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mail/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { receiveMailEvent } = await import("@/server/talent/platform.server");
        const body = await request.text();
        const result = await receiveMailEvent({
          body,
          timestamp: request.headers.get("x-mail-timestamp") ?? "",
          signature: request.headers.get("x-mail-signature"),
        });
        return Response.json(result, { status: result.accepted ? 200 : 403 });
      },
    },
  },
});
