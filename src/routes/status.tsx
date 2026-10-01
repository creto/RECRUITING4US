import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandBar, Wordmark } from "@/components/talent/kit";
import { clientErrors, errorSinkConnected, sentryDsnPresent } from "@/lib/observe";
import type { ObservedError } from "@/domain/observe";

export const Route = createFileRoute("/status")({ component: StatusPage });

type HealthBody = {
  service: string;
  live: boolean;
  ready: boolean;
  database: string;
  checkedAt: string;
  errors: { captured: number; last: { id: string; at: string; source: string; name: string } | null };
  sentry: { dsn: boolean; sink: boolean };
};

function StatusPage() {
  const [health, setHealth] = useState<HealthBody | null>(null);
  const [failed, setFailed] = useState(false);
  const [localErrors, setLocalErrors] = useState<ObservedError[]>([]);

  async function load() {
    setFailed(false);
    setLocalErrors(clientErrors());
    try {
      const response = await fetch("/api/health/");
      if (!response.ok && response.status !== 503) throw new Error("Health check failed");
      setHealth((await response.json()) as HealthBody);
    } catch {
      setHealth(null);
      setFailed(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sentry = health?.sentry.dsn || health?.sentry.sink || sentryDsnPresent() || errorSinkConnected();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <header className="flex items-center justify-between gap-4">
        <Link to="/" className="text-ink">
          <Wordmark />
        </Link>
        <Link to="/" className="text-sm text-link">
          Back to the main page
        </Link>
      </header>
      <div className="mt-6">
        <BrandBar />
      </div>
      <p className="mt-10 text-sm font-medium text-link">Operations</p>
      <h1 className="mt-3 text-4xl leading-tight text-ink">Health and errors</h1>
      <p className="mt-4 max-w-xl text-base text-muted">
        This process reports whether it is up and keeps the latest errors here. Nothing is sent to Sentry until a DSN and a sink are connected.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Pill label="Live" ok={health?.live === true} pending={!health && !failed} />
        <Pill label="Ready" ok={health?.ready === true} pending={!health && !failed} />
        <Pill label={sentry ? "Sentry hook ready" : "Sentry not connected"} ok={Boolean(sentry)} pending={false} />
      </div>
      <button type="button" className="mt-4 min-h-11 rounded-full border border-line bg-white px-5 text-sm" onClick={() => void load()}>
        Check again
      </button>
      {failed ? <p className="mt-4 text-sm text-danger" role="alert">The health check did not answer.</p> : null}
      <section className="mt-8 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
        <h2 className="text-2xl">Server</h2>
        <p className="mt-2 text-sm text-muted">
          {health ? `${health.service} · database ${health.database} · ${health.errors.captured} stored` : "Waiting for the check."}
        </p>
        <ErrorList rows={health?.errors.last ? [health.errors.last] : []} empty="No server error is stored in this process." />
      </section>
      <section className="mt-4 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
        <h2 className="text-2xl">This browser</h2>
        <ErrorList rows={[...localErrors].reverse()} empty="No error is stored in this tab." />
      </section>
    </main>
  );
}

function Pill({ label, ok, pending }: { label: string; ok: boolean; pending: boolean }) {
  const look = pending ? "border-line bg-white text-muted" : ok ? "border-[#cefa90] bg-[#cefa90] text-[#14221b]" : "border-[#f3c7c3] bg-[#fff6f5] text-danger";
  return <span className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm ${look}`}>{label}</span>;
}

function ErrorList({ rows, empty }: { rows: Array<{ id: string; at: string; source: string; name: string; message?: string }>; empty: string }) {
  if (rows.length === 0) return <p className="mt-3 text-sm text-muted">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded-2xl border border-line bg-[#f7faf8] px-4 py-3 text-sm">
          <p className="text-ink">{row.message ? `${row.name}: ${row.message}` : row.name}</p>
          <p className="mt-1 text-xs text-muted">{row.source} · {row.at}</p>
        </li>
      ))}
    </ul>
  );
}
