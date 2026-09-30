import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { applicationIdGateHint } from "@/domain/assessment-invite";
import { applicationPortalGateLede } from "@/domain/application-portal";
import { portalHrefWithAccess, storePortalAccess } from "@/domain/portal-access-storage";
import { openApplicationPortal } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, PageTitle, Wordmark } from "@/components/talent/kit";

export const Route = createFileRoute("/portal/")({ component: PortalGate });

function PortalGate() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const result = await openApplicationPortal({
        data: {
          email: email.trim(),
          applicationId: applicationId.trim(),
        },
      });
      storePortalAccess(result.applicationId, result.accessToken);
      void navigate({ href: portalHrefWithAccess(result.applicationId, result.accessToken) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not open the portal.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link to="/"><Wordmark /></Link>
      <PageTitle title="Applicant portal" lede={applicationPortalGateLede()} />
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      <form
        className="space-y-3 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]"
        onSubmit={onUnlock}
      >
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
        <Button type="submit" className="rounded-full bg-[#cefa90] text-[#14221b]" disabled={busy}>
          {busy ? "Opening…" : "Open portal"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Need a stage-only lookup without unlocking the full portal?{" "}
        <Link to="/track" className="text-link">Application status</Link>
      </p>
    </main>
  );
}
