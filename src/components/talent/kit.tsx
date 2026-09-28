import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState, type AppUser } from "@/lib/auth/use-current-user";

const inflight = new Map<string, Promise<unknown>>();
const refreshers = new Set<() => void>();

function loadShared<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = loader().finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

/** Refetch the records on screen without reloading the whole app. */
export function refreshPage() {
  if (refreshers.size === 0) {
    window.location.reload();
    return;
  }
  for (const refresh of refreshers) refresh();
}

export type AuthedState<T> = {
  user: AppUser | null;
  isPending: boolean;
  data: T | null;
  error: string | null;
  loading: boolean;
  signedOut: boolean;
  reload: () => void;
};

export type WorkspacePayload = {
  company: {
    name: string;
    slug: string;
    timezone: string;
    role: string;
    demo: boolean;
    retentionDays: number;
  };
  counts?: { jobs: number; applications: number; reviews: number; interviews: number };
  activity: { id: string; summary: string; action: string; at: string }[];
  overdue: { id: string; title: string; deadline: string }[];
};

const CompanyWorkspaceContext = createContext<AuthedState<WorkspacePayload> | null>(null);

export function CompanyWorkspaceProvider({ value, children }: { value: AuthedState<WorkspacePayload>; children: ReactNode }) {
  return <CompanyWorkspaceContext.Provider value={value}>{children}</CompanyWorkspaceContext.Provider>;
}

export function useCompanyWorkspace() {
  const value = useContext(CompanyWorkspaceContext);
  if (!value) throw new Error("Open this page from a company workspace.");
  return value;
}

export function useAuthed<T>(loader: () => Promise<T>, deps: readonly unknown[], enabled = true): AuthedState<T> {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(deps);
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setData(null);
    setError(null);
    setLoading(enabled);
  }
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    refreshers.add(refresh);
    return () => {
      refreshers.delete(refresh);
    };
  }, []);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (isPending) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    let live = true;
    if (data === null) setLoading(true);
    const cacheKey = `${userId}|${key}|${tick}|${String(enabled)}|${loader.toString()}`;
    loadShared(cacheKey, loader)
      .then((value) => {
        if (!live) return;
        setData(value);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
    // loader identity is owned by the caller via deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, userId, key, enabled, tick]);
  return {
    user,
    isPending,
    data,
    error,
    loading,
    signedOut: !isPending && !user,
    reload: () => setTick((n) => n + 1),
  };
}

export function Gate({ signedOut, pending, children }: { signedOut: boolean; pending: boolean; children: ReactNode }) {
  if (pending) return <Loading />;
  if (signedOut) return <RedirectToSignIn />;
  return <>{children}</>;
}

export function Loading() {
  return (
    <div className="space-y-3 p-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 rounded-md bg-line" />
      <div className="h-24 rounded-md bg-line" />
      <p className="text-sm text-muted">Loading records…</p>
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-surface p-6">
      <h2 className="text-xl text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const look =
    variant === "primary"
      ? "bg-accent text-accent-ink"
      : variant === "danger"
        ? "bg-danger text-accent-ink"
        : variant === "ghost"
          ? "bg-transparent text-ink"
          : "border border-line bg-surface text-ink";
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus-visible:border-leaf";

export function when(iso: string | null | undefined, timeZone = "UTC") {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone }).format(date)} (${timeZone})`;
}

export function AppLink({
  href,
  className,
  children,
  onClick,
  ...rest
}: { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const router = useRouter();
  return (
    <a
      href={href}
      className={className}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
        event.preventDefault();
        void router.navigate({ href });
      }}
    >
      {children}
    </a>
  );
}

export function money(minor: number | null, currency = "USD") {
  if (minor == null) return "Hidden";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

const NAV = [
  ["", "Dashboard"],
  ["/jobs", "Jobs"],
  ["/candidates", "Candidates"],
  ["/assessments", "Assessments"],
  ["/reviews", "Reviews"],
  ["/interviews", "Interviews"],
  ["/offers", "Offers"],
  ["/reports", "Reports"],
  ["/automations", "Automations"],
  ["/settings", "Settings"],
] as const;

export function Shell({
  slug,
  name,
  role,
  children,
}: {
  slug: string;
  name: string;
  role: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-bg text-ink md:grid md:grid-cols-[220px_1fr]">
      <a href="#workspace-main" className="absolute left-3 top-3 z-50 -translate-y-24 rounded-md bg-accent px-3 py-2 text-accent-ink focus:translate-y-0">Skip to content</a>
      <aside className="bg-sidebar text-sidebar-fg md:min-h-screen">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:block">
          <Link to="/app" className="block max-w-full overflow-hidden text-sidebar-fg">
            <Wordmark />
          </Link>
          <div className="md:mt-4">
            <UserButton />
          </div>
        </div>
        <p className="px-4 text-sm text-sidebar-muted">{name}</p>
        <p className="px-4 pb-3 text-xs uppercase tracking-wide text-sidebar-muted">{role.replaceAll("_", " ")}</p>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:block md:space-y-1 md:overflow-visible" aria-label="Workspace">
          {NAV.map(([path, label]) => {
            const href = `/app/${slug}${path}`;
            const active = path === "" ? pathname === href : pathname.startsWith(href);
            return (
              <AppLink
                key={path}
                href={href}
                className={`block min-h-11 whitespace-nowrap rounded-md px-3 py-2 text-sm ${active ? "bg-accent text-accent-ink" : "text-sidebar-fg"}`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </AppLink>
            );
          })}
        </nav>
        <div className="hidden space-y-2 px-4 py-4 text-sm md:block">
          <AppLink className="block text-sidebar-muted" href={`/careers/${slug}`}>Public careers</AppLink>
          <AppLink className="block text-sidebar-muted" href="/candidate">Candidate portal</AppLink>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex gap-4 overflow-x-auto border-b border-line px-4 py-2 text-sm md:hidden">
          <AppLink href={`/careers/${slug}`}>Careers</AppLink>
          <AppLink href="/candidate">Portal</AppLink>
        </div>
        <main id="workspace-main" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex max-w-full flex-col items-start gap-1 ${className}`}>
      <img src="/mark.png" alt="" width={72} height={40} className="h-6 w-auto max-w-16" />
      <span className="font-brand max-w-full text-sm uppercase leading-none tracking-wide text-lime">RECRUIT4US</span>
    </span>
  );
}

export function BrandBar() {
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full" aria-hidden="true">
      <span className="flex-1 bg-forest" />
      <span className="flex-1 bg-leaf" />
      <span className="flex-1 bg-spring" />
      <span className="flex-1 bg-lime" />
    </div>
  );
}

export function PageTitle({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl text-ink">{title}</h1>
      {lede ? <p className="mt-2 max-w-2xl text-sm text-muted">{lede}</p> : null}
    </header>
  );
}
