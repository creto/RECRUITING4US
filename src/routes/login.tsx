import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { goAfterLogin, safeNextPath } from "@/domain/post-login-next";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { Alert, BrandBar, Button, Field, inputClass, Wordmark } from "@/components/talent/kit";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const searchNext = Route.useSearch({ select: (s) => s.next });
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const fromRouter = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("next");
  const fromWindow = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
  const nextPath = safeNextPath(searchNext || fromRouter || fromWindow);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signingUp = mode === "up";

  async function onEmail(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (signingUp) {
        const created = await authClient.signUp.email({ email, password, name });
        if (created.error) throw new Error(created.error.message ?? "Could not create the account.");
      }
      const signed = await authClient.signIn.email({ email, password });
      if (signed.error) throw new Error(signed.error.message ?? "Could not sign in.");
      goAfterLogin(nextPath);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="border-b border-line px-6 py-8 lg:flex lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
        <Link to="/" className="lg:hidden">
          <Wordmark />
        </Link>
        <div className="hidden max-w-md lg:block">
          <img src="/mark.png" alt="" width={96} height={56} className="h-12 w-auto max-w-28" />
          <p className="font-brand mt-4 text-4xl uppercase leading-none text-ink">RECRUIT4US</p>
          <p className="mt-4 text-base text-muted">
            Each employer keeps its own candidates, scores, and notes. A score is evidence for a person to read, not an automatic hire or reject.
          </p>
          <div className="mt-8 max-w-xs">
            <BrandBar />
          </div>
        </div>
        <p className="mt-10 hidden text-sm text-muted lg:block">Sign in with the account this employer should recognize.</p>
      </aside>
      <section className="flex items-center px-6 py-10 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-4xl text-ink">{signingUp ? "Create an account" : "Enter RECRUIT4US"}</h1>
          <p className="mt-2 text-sm text-muted">
            {signingUp
              ? "Use the email you want employers to recognize."
              : "Sign in with your email or a connected account."}
          </p>
          {signingUp ? null : (
            <div className="mt-8 space-y-2">
              {GROK_PROVIDERS.map((provider) => (
                <Button
                  key={provider.providerId}
                  variant="secondary"
                  className="w-full"
                  type="button"
                  disabled={pending}
                  onClick={() => signIn(provider.providerId, { callbackURL: nextPath })}
                >
                  Continue with {provider.label}
                </Button>
              ))}
            </div>
          )}
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-line" />
            Email
            <span className="h-px flex-1 bg-line" />
          </div>
          <form className="space-y-3" onSubmit={onEmail}>
            {signingUp ? (
              <Field label="Name">
                <input className={inputClass} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
            ) : null}
            <Field label="Email">
              <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                autoComplete={signingUp ? "new-password" : "current-password"}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            {signingUp ? <p className="text-xs text-muted">At least 8 characters.</p> : null}
            {error ? <Alert>{error}</Alert> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Working…" : signingUp ? "Create account" : "Sign in with email"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 min-h-11 text-sm text-link"
            onClick={() => {
              setMode(signingUp ? "in" : "up");
              setError(null);
            }}
          >
            {signingUp ? "Already have an account? Sign in" : "Need an account? Create one"}
          </button>
        </div>
      </section>
    </main>
  );
}
