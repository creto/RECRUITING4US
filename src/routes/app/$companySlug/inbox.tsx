import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$companySlug/inbox")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$companySlug/mail", params: { companySlug: params.companySlug } });
  },
});
