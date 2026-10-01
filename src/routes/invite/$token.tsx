import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { acceptInvite } from "@/server/talent.functions";
import { Alert, Button, Loading, MarketingHomeLink } from "@/components/talent/kit";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/invite/$token")({ component: InvitePage });

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (isPending) return <Loading />;
  if (!user) return <RedirectToSignIn />;
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <MarketingHomeLink />
      <h1 className="mt-6 text-3xl">Company invitation</h1>
      <p className="mt-3 text-sm text-muted">
        Opening this page does not join the company and does not use up the invitation. Accept only if this address was invited.
      </p>
      {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      <Button
        className="mt-6"
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          acceptInvite({ data: { token } })
            .then((result) => {
              void navigate({ href: `/app/${result.slug}` });
            })
            .catch((err) => {
              setError(err instanceof Error ? err.message : "Could not accept.");
              setBusy(false);
            });
        }}
      >
        Accept invitation
      </Button>
    </main>
  );
}
