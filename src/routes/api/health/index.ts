import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health/")({
  server: {
    handlers: {
      GET: async () => {
        const { healthSnapshot } = await import("@/server/observe");
        const body = await healthSnapshot();
        return Response.json(body, { status: body.ready ? 200 : 503 });
      },
    },
  },
});
