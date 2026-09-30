import { createFileRoute, Outlet } from "@tanstack/react-router";
import { companyCssVars } from "@/domain/embed-theme";
import { getWorkspace } from "@/server/talent.functions";
import { Alert, CompanyWorkspaceProvider, Gate, Shell, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug")({ component: Layout });

function Layout() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => getWorkspace({ data: { slug: companySlug } }), [companySlug]);
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <CompanyWorkspaceProvider value={state}>
        <Shell
          slug={companySlug}
          name={state.data?.company.name ?? "Workspace"}
          role={state.data?.company.role ?? ""}
          logoUrl={state.data?.company.logoUrl}
          theme={state.data?.company.theme ? companyCssVars(state.data.company.theme) : undefined}
        >
          {state.error && !state.data ? <Alert>{state.error}</Alert> : null}
          <Outlet />
        </Shell>
      </CompanyWorkspaceProvider>
    </Gate>
  );
}
