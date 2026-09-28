import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/provider/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { receiveProviderCallback } = await import("@/server/talent/workflows.server");
        const body = await request.text();
        let parsed: { attemptId?: string; eventKey?: string; companyId?: string; assignmentId?: string; status?: string } = {};
        try {
          parsed = JSON.parse(body) as typeof parsed;
        } catch {
          return Response.json({ accepted: false, stored: false, reason: "The body is not JSON." }, { status: 400 });
        }
        const incoming = parsed.status === "RUNNING" || parsed.status === "SUCCEEDED" || parsed.status === "FAILED"
          ? parsed.status
          : null;
        if (!parsed.attemptId || !parsed.eventKey || !incoming) {
          return Response.json({ accepted: false, stored: false, reason: "The callback is missing an attempt, event, or status." }, { status: 400 });
        }
        const result = await receiveProviderCallback({
          attemptId: parsed.attemptId,
          eventKey: parsed.eventKey,
          body,
          signature: request.headers.get("x-provider-signature"),
          bodyCompanyId: parsed.companyId ?? "",
          bodyAssignmentId: parsed.assignmentId ?? "",
          incoming,
        });
        return Response.json(result, { status: result.accepted ? 200 : 403 });
      },
    },
  },
});
