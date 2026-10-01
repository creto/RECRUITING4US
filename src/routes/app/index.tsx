import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createCompany, listMyCompanies, seedDemo } from "@/server/talent.functions";
import { Alert, AppLink, Button, Field, Gate, inputClass, Loading, PageTitle, useAuthed, MarketingHomeLink } from "@/components/talent/kit";
import { UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/")({ component: Workspaces });

function Workspaces() {
  const state = useAuthed(() => listMyCompanies(), []);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createCompany({ data: { name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" } });
      void navigate({ href: `/app/${created.slug}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the company.");
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    setError(null);
    try {
      const created = await seedDemo();
      void navigate({ href: `/app/${created.slug}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the demo.");
      setBusy(false);
    }
  }

  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <MarketingHomeLink />
          <UserButton />
        </div>
        <PageTitle title="Your companies" lede="A company is a tenant. You only see employers that invited you or that you created." />
        {state.loading ? <Loading /> : null}
        {state.error ? <Alert>{state.error}</Alert> : null}
        <ul className="space-y-3">
          {(state.data ?? []).map((company) => (
            <li key={company.id}>
              <AppLink className="block rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" href={`/app/${company.slug}`}>
                <span className="text-xl">{company.name}</span>
                <span className="mt-1 block text-sm text-muted">{company.role}{company.demo ? " · demo" : ""}</span>
              </AppLink>
            </li>
          ))}
        </ul>
        {!state.loading && (state.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">No companies yet.</p>
        ) : null}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <form className="space-y-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={create}>
            <h2 className="text-2xl">Create a company</h2>
            <Field label="Company name">
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            </Field>
            <Button type="submit" disabled={busy}>Create</Button>
          </form>
          <div className="space-y-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
            <h2 className="text-2xl">Northstar Labs demo</h2>
            <p className="text-sm text-muted">
              Loads a fictional employer with jobs, candidates, an assessment you can take, an interview, and an offer you can answer. A second employer, Harbor Analytics, is created so you can confirm you cannot open it.
            </p>
            <Button type="button" variant="secondary" disabled={busy} onClick={demo}>Open Northstar Labs</Button>
          </div>
        </div>
        {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      </main>
    </Gate>
  );
}
