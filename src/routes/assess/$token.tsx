import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { applicationIdGateHint, assessmentInviteGateLede } from "@/domain/assessment-invite";
import { attemptHrefWithAccess, storeAssessAccess } from "@/domain/assess-access-storage";
import { storePortalAccess } from "@/domain/portal-access-storage";
import {
  openAssessmentInvite,
  peekAssessmentInvite,
  requestAssessOtp,
  verifyAssessOtp,
} from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, Wordmark, when } from "@/components/talent/kit";

export const Route = createFileRoute("/assess/$token")({ component: AssessInvite });

type Mode = "otp" | "uuid";

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
  const [mode, setMode] = useState<Mode>("otp");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [note, setNote] = useState<string | null>(null);
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

  function finishUnlock(result: {
    attemptId: string;
    accessToken: string;
    portalAccessToken?: string;
    applicationId?: string;
  }) {
    storeAssessAccess(result.attemptId, result.accessToken);
    if (result.portalAccessToken && result.applicationId) {
      storePortalAccess(result.applicationId, result.portalAccessToken);
    }
    void navigate({ href: attemptHrefWithAccess(result.attemptId, result.accessToken) });
  }

  async function onRequestCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await requestAssessOtp({
        data: { token, email: email.trim() },
      });
      setNote(result.note);
      setPhase("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send a code.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await verifyAssessOtp({
        data: { token, email: email.trim(), code: code.trim() },
      });
      finishUnlock(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not open this assessment.");
      setBusy(false);
    }
  }

  async function onUuidUnlock(event: FormEvent) {
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
      finishUnlock(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not open this assessment.");
      setBusy(false);
    }
  }

  const locked =
    peek?.status === "COMPLETED" || peek?.status === "EXPIRED" || peek?.status === "CANCELLED";

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
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      {peek ? (
        <article className="mt-4 space-y-3 rounded-[24px] border border-line bg-white p-5 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
          <p>Status: {peek.status}</p>
          <p>Start by: {when(String(peek.startBy))}</p>
          <p>Duration: {Math.round(Number(peek.durationSeconds) / 60)} minutes (timer starts when you unlock).</p>

          {mode === "otp" && phase === "email" ? (
            <form className="space-y-3 pt-2" onSubmit={onRequestCode}>
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
              <Button
                type="submit"
                className="rounded-full bg-[#cefa90] text-[#14221b]"
                disabled={busy || locked}
              >
                {busy ? "Sending…" : "Send one-time code"}
              </Button>
              <button
                type="button"
                className="text-sm text-link"
                onClick={() => {
                  setMode("uuid");
                  setError(null);
                  setNote(null);
                }}
              >
                Unlock with email + application id instead
              </button>
            </form>
          ) : null}

          {mode === "otp" && phase === "code" ? (
            <form className="space-y-3 pt-2" onSubmit={onVerifyCode}>
              <Field label="One-time code">
                <input
                  className={inputClass}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,8}"
                  maxLength={8}
                  required
                  placeholder="123456"
                />
              </Field>
              <Button
                type="submit"
                className="rounded-full bg-[#cefa90] text-[#14221b]"
                disabled={busy || locked}
              >
                {busy ? "Opening…" : "Open assessment"}
              </Button>
              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setPhase("email");
                    setCode("");
                    setNote(null);
                  }}
                >
                  Resend / change email
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setMode("uuid");
                    setError(null);
                  }}
                >
                  Use application id instead
                </button>
              </div>
            </form>
          ) : null}

          {mode === "uuid" ? (
            <form className="space-y-3 pt-2" onSubmit={onUuidUnlock}>
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
                disabled={busy || locked}
              >
                {busy ? "Opening…" : "Open assessment"}
              </Button>
              <button
                type="button"
                className="text-sm text-link"
                onClick={() => {
                  setMode("otp");
                  setPhase("email");
                  setError(null);
                }}
              >
                Prefer one-time code
              </button>
            </form>
          ) : null}
        </article>
      ) : null}
    </main>
  );
}
