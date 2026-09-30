import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { applicationIdGateHint } from "@/domain/assessment-invite";
import { applicationPortalGateLede } from "@/domain/application-portal";
import { portalHrefWithAccess, storePortalAccess } from "@/domain/portal-access-storage";
import {
  openApplicationPortal,
  requestPortalOtp,
  verifyPortalOtp,
} from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, PageTitle, Wordmark } from "@/components/talent/kit";

export const Route = createFileRoute("/portal/")({
  component: PortalGate,
});

type CompanyChoice = { slug: string; name: string };
type UnlockedApp = {
  id: string;
  jobTitle: string;
  companyName: string;
  companySlug: string;
  stageName: string;
  accessToken: string;
};

type Step = "email" | "company" | "code" | "apps" | "uuid";

function PortalGate() {
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const companyFromSearch = (() => {
    const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
    return new URLSearchParams(raw).get("company") ?? "";
  })();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [companySlug, setCompanySlug] = useState(companyFromSearch);
  const [companies, setCompanies] = useState<CompanyChoice[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [apps, setApps] = useState<UnlockedApp[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onRequestCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      const result = await requestPortalOtp({
        data: {
          email: email.trim(),
          companySlug: companySlug.trim() || undefined,
        },
      });
      if (result.status === "pick_company") {
        setCompanies(result.companies);
        setStep("company");
        setNote("Choose the employer you applied to. Codes are scoped per company.");
      } else {
        if (result.companySlug) setCompanySlug(result.companySlug);
        if (result.companyName) setCompanyName(result.companyName);
        setNote(result.note);
        setStep("code");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send a code.");
    } finally {
      setBusy(false);
    }
  }

  async function onPickCompany(slug: string) {
    setCompanySlug(slug);
    setError(null);
    setBusy(true);
    try {
      const result = await requestPortalOtp({
        data: { email: email.trim(), companySlug: slug },
      });
      if (result.status === "pick_company") {
        setCompanies(result.companies);
        setStep("company");
      } else {
        if (result.companySlug) setCompanySlug(result.companySlug);
        if (result.companyName) setCompanyName(result.companyName);
        setNote(result.note);
        setStep("code");
      }
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
      const result = await verifyPortalOtp({
        data: {
          email: email.trim(),
          code: code.trim(),
          companySlug: companySlug.trim(),
        },
      });
      for (const app of result.applications) {
        storePortalAccess(app.id, app.accessToken);
      }
      setApps(result.applications);
      setCompanyName(result.companyName);
      if (result.applications.length === 1) {
        const only = result.applications[0];
        void navigate({ href: portalHrefWithAccess(only.id, only.accessToken) });
        return;
      }
      setStep("apps");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not verify that code.");
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
      {note && step !== "apps" ? <p className="mb-3 text-sm text-muted">{note}</p> : null}

      {step === "email" || step === "company" ? (
        <form
          className="space-y-3 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]"
          onSubmit={onRequestCode}
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
          {step === "company" ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">This email has applications at more than one employer. Pick one:</p>
              <ul className="space-y-2">
                {companies.map((company) => (
                  <li key={company.slug}>
                    <Button
                      type="button"
                      className="w-full rounded-full bg-[#cefa90] text-[#14221b]"
                      disabled={busy}
                      onClick={() => void onPickCompany(company.slug)}
                    >
                      {company.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Button type="submit" className="rounded-full bg-[#cefa90] text-[#14221b]" disabled={busy}>
              {busy ? "Sending…" : "Send one-time code"}
            </Button>
          )}
          <button
            type="button"
            className="text-sm text-link"
            onClick={() => {
              setStep("uuid");
              setError(null);
              setNote(null);
            }}
          >
            Unlock with email + application id instead
          </button>
        </form>
      ) : null}

      {step === "code" ? (
        <form
          className="space-y-3 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]"
          onSubmit={onVerifyCode}
        >
          <p className="text-sm text-muted">
            Code sent{companyName ? ` for ${companyName}` : ""}. Enter the 6-digit code from your email.
          </p>
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
          <Button type="submit" className="rounded-full bg-[#cefa90] text-[#14221b]" disabled={busy}>
            {busy ? "Checking…" : "Unlock portal"}
          </Button>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setStep("email");
                setCode("");
                setNote(null);
                setError(null);
              }}
            >
              Use a different email
            </button>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setStep("uuid");
                setError(null);
              }}
            >
              Use application id instead
            </button>
          </div>
        </form>
      ) : null}

      {step === "apps" ? (
        <div className="space-y-3 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
          <p className="text-sm text-muted">
            Unlocked for {companyName}. Choose an application (same email at other employers stays locked).
          </p>
          {apps.length === 0 ? (
            <p className="text-sm text-muted">No applications found for this employer.</p>
          ) : (
            <ul className="space-y-2">
              {apps.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    className="w-full rounded-[20px] border border-line px-4 py-3 text-left hover:bg-[#f7faf4]"
                    onClick={() => {
                      storePortalAccess(app.id, app.accessToken);
                      void navigate({ href: portalHrefWithAccess(app.id, app.accessToken) });
                    }}
                  >
                    <p className="font-medium">{app.jobTitle}</p>
                    <p className="text-sm text-muted">{app.companyName} · {app.stageName}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {step === "uuid" ? (
        <form
          className="space-y-3 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]"
          onSubmit={onUuidUnlock}
        >
          <p className="text-sm text-muted">Fallback unlock with the application id from your confirmation.</p>
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
          <button
            type="button"
            className="text-sm text-link"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
          >
            Prefer one-time code
          </button>
        </form>
      ) : null}

      <p className="mt-4 text-sm text-muted">
        Need a stage-only lookup without unlocking the full portal?{" "}
        <Link to="/track" className="text-link">Application status</Link>
      </p>
    </main>
  );
}
