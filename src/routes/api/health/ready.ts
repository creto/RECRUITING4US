import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health/ready")({
  server: {
    handlers: {
      GET: async () => {
        const { getSql } = await import("@/lib/db");
        const sql = await getSql();
        await sql`select 1 as ok`;
        return Response.json({ ok: true, service: "talentflow" });
      },
    },
  },
});
