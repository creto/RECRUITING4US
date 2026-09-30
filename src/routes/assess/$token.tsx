import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { applicationIdGateHint, assessmentInviteGateLede } from "@/domain/assessment-invite";
import { attemptHrefWithAccess, storeAssessAccess } from "@/domain/assess-access-storage";
import { openAssessmentInvite, peekAssessmentInvite } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, Wordmark, when } from "@/components/talent/kit";

export const Route = createFileRoute("/assess/$token")({ component: AssessInvite });

function AssessInvite() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [peek, setPeek] = useState<{
    assessmentName: string;
    status: string;
    durationSeconds: number;
    startBy: string;
  } | null>(null);
  const [peekError, setPeekError] = useState<string | null>(null);
  const [peekLoading, setPeekLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setPeekLoading(true);
    peekAssessmentInvite({ data: { token } })
      .then((row) => {
        if (!live) return;
        setPeek(row);
        setPeekError(null);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setPeek(null);
        setPeekError(err instanceof Error ? err.message : "This assessment link is not valid.");
      })
      .finally(() => {
        if (live) setPeekLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);

  async function onUnlock(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const idHint = applicationIdGateHint(applicationId);
    if (idHint) {
      setError(idHint);
      return;
    }
    setBusy(true);
    try {
      const result = await openAssessmentInvite({
        data: {
          token,
          email: email.trim(),
          applicationId: applicationId.trim(),
        },
      });
      storeAssessAccess(result.attemptId, result.accessToken);
      // Carry access in the URL so a login round-trip or new tab still opens the attempt.
      void navigate({ href: attemptHrefWithAccess(result.attemptId, result.accessToken) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not open this assessment.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <Wordmark />
      <PageTitle
        title={peek?.assessmentName || "Assessment invite"}
        lede={assessmentInviteGateLede()}
      />
      {peekLoading ? <Loading /> : null}
      {peekError ? <Alert>{peekError}</Alert> : null}
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      {peek ? (
        <article className="mt-4 space-y-3 rounded-[24px] border border-line bg-white p-5 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
          <p>Status: {peek.status}</p>
          <p>Start by: {when(String(peek.startBy))}</p>
          <p>Duration: {Math.round(Number(peek.durationSeconds) / 60)} minutes (timer starts when you unlock).</p>
          <form className="space-y-3 pt-2" onSubmit={onUnlock}>
            <Field label="Email from your application">
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="Application id (full UUID, 36 characters)">
              <input
                className={inputClass}
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="bd546960-cae6-4cfd-873a-73e06c51015b"
                required
                minLength={36}
                maxLength={36}
                spellCheck={false}
                autoComplete="off"
                inputMode="text"
              />
            </Field>
            <Button
              type="submit"
              className="rounded-full bg-[#cefa90] text-[#14221b]"
              disabled={busy || peek.status === "COMPLETED" || peek.status === "EXPIRED" || peek.status === "CANCELLED"}
            >
              {busy ? "Opening…" : "Open assessment"}
            </Button>
          </form>
        </article>
      ) : null}
    </main>
  );
}
