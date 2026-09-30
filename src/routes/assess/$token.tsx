import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getAssessmentInvite, startAttempt } from "@/server/talent.functions";
import { Alert, Button, Loading, PageTitle, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/assess/$token")({ component: AssessInvite });

function AssessInvite() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const state = useAuthed(() => getAssessmentInvite({ data: { token } }), [token]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = `/assess/${token}`;

  if (state.isPending) return <Loading />;
  if (state.signedOut) {
    if (typeof window !== "undefined") {
      const target = `/login?next=${encodeURIComponent(next)}`;
      if (`${window.location.pathname}${window.location.search}` !== target) {
        window.location.replace(target);
      }
    }
    return <Loading />;
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <PageTitle
        title={state.data?.assessmentName || "Assessment invite"}
        lede="Sign in with the invited email. Opening this page does not start the timer. Start only when you are ready."
      />
      {state.loading ? <Loading /> : null}
      {state.error ? <Alert>{state.error}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      {state.data ? (
        <article className="mt-4 space-y-3 rounded-[24px] border border-line bg-white p-5 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
          <p>Status: {state.data.status}</p>
          <p>Start by: {when(String(state.data.startBy))}</p>
          <p>Duration: {Math.round(Number(state.data.durationSeconds) / 60)} minutes (timer starts when you begin).</p>
          <p className="text-muted">Signed in as {state.data.email}</p>
          {state.data.activeAttemptId ? (
            <Button
              type="button"
              className="rounded-full bg-[#cefa90] text-[#14221b]"
              onClick={() => {
                void navigate({ href: `/candidate/attempts/${state.data!.activeAttemptId}` });
              }}
            >
              Continue assessment
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-full bg-[#cefa90] text-[#14221b]"
              disabled={busy || state.data.status === "COMPLETED" || state.data.status === "EXPIRED" || state.data.status === "CANCELLED"}
              onClick={() => {
                setBusy(true);
                setError(null);
                startAttempt({ data: { assignmentId: String(state.data!.assignmentId) } })
                  .then((result) => {
                    void navigate({ href: `/candidate/attempts/${result.attemptId}` });
                  })
                  .catch((err: Error) => {
                    setError(err.message);
                    setBusy(false);
                  });
              }}
            >
              Start assessment
            </Button>
          )}
        </article>
      ) : null}
    </main>
  );
}
