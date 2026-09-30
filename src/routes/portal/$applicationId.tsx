import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  getPortalApplication,
  openPortalAssignment,
  replyPortalMail,
} from "@/server/talent.functions";
import { attemptHrefWithAccess, storeAssessAccess } from "@/domain/assess-access-storage";
import { readPortalAccess, takePortalAccessFromSearch } from "@/domain/portal-access-storage";
import {
  Alert,
  AppLink,
  Button,
  Field,
  inputClass,
  Loading,
  MailCard,
  money,
  PageTitle,
  StageBar,
  Wordmark,
  when,
} from "@/components/talent/kit";
import { examPaper } from "@/components/talent/exam-shell";

export const Route = createFileRoute("/portal/$applicationId")({
  validateSearch: (search: Record<string, unknown>) => ({
    access: typeof search.access === "string" ? search.access : undefined,
  }),
  component: PortalShell,
});

type PortalData = {
  application: {
    id: string;
    company_name: string;
    job_title: string;
    label: string;
    steps: string[];
    index: number;
    stopped: boolean;
    hired: boolean;
    timezone: string;
  };
  assignments: Array<{
    id: string;
    status: string;
    name: string;
    duration_seconds: number;
    instructions: string;
    proctored: boolean | string;
    start_by: string;
    active_attempt: string | null;
  }>;
  offers: Array<{
    id: string;
    status: string;
    title: string;
    salary_minor: number;
    currency: string;
    start_date: string | null;
    message: string;
  }>;
  interviews: Array<{
    id: string;
    title: string;
    timezone: string;
    location: string;
    meeting_url: string;
    starts_at: string;
  }>;
  messages: Array<{
    id: string;
    subject: string;
    body: string;
    from_name: string;
    author: string;
    company_name: string;
    mail_from_name: string;
    mail_footer: string;
    accent: string;
    at: string;
  }>;
  runner: { reason: string };
};

function PortalShell() {
  const { applicationId } = Route.useParams();
  const accessFromSearch = Route.useSearch({ select: (s) => s.access });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const accessToken = (() => {
    if (typeof window === "undefined") return accessFromSearch ?? null;
    const fromUrl = accessFromSearch ?? takePortalAccessFromSearch(applicationId, searchStr);
    return fromUrl ?? readPortalAccess(applicationId);
  })();

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <Link to="/"><Wordmark /></Link>
        <PageTitle
          title="Unlock required"
          lede="Open the applicant portal with the email and application id from your confirmation."
        />
        <AppLink className="inline-flex min-h-11 items-center rounded-full bg-[#cefa90] px-5 text-sm font-medium text-[#14221b]" href="/portal">
          Go to portal unlock
        </AppLink>
      </main>
    );
  }

  return <PortalBody applicationId={applicationId} accessToken={accessToken} />;
}

function PortalBody({ applicationId, accessToken }: { applicationId: string; accessToken: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    getPortalApplication({ data: { applicationId, accessToken } })
      .then((row) => {
        setData(row as PortalData);
        setError(null);
      })
      .catch((err: unknown) => {
        setData(null);
        setError(err instanceof Error ? err.message : "Could not load this application.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, accessToken]);

  async function openAssignment(assignmentId: string) {
    setBusyId(assignmentId);
    setError(null);
    try {
      const result = await openPortalAssignment({
        data: { applicationId, accessToken, assignmentId },
      });
      storeAssessAccess(result.attemptId, result.accessToken);
      void navigate({ href: attemptHrefWithAccess(result.attemptId, result.accessToken) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not open this assessment.");
      setBusyId(null);
    }
  }

  async function onReply(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await replyPortalMail({ data: { applicationId, accessToken, body: reply } });
      setReply("");
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not store the reply.");
    }
  }

  if (loading && !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Wordmark />
        <Loading />
      </main>
    );
  }

  const app = data?.application;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/"><Wordmark /></Link>
        <Link to="/portal" className="text-sm text-link">Unlock another</Link>
      </div>
      {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      {app ? (
        <>
          <PageTitle title={app.job_title} lede={`${app.company_name} · ${app.label}`} />
          <StageBar
            steps={app.steps ?? []}
            index={app.hired ? (app.steps ?? []).length : app.index ?? 0}
            stopped={app.stopped}
          />
          <p className="mt-2 text-sm text-muted">
            Guest access for this application. Notes, scores, and pay details stay with the employer unless they appear in an offer below.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="text-2xl">Assessments</h2>
            <p className="text-sm text-muted">{data?.runner?.reason}</p>
            {(data?.assignments ?? []).length === 0 ? <p className="text-sm">No assessments yet.</p> : null}
            {(data?.assignments ?? []).map((item) => (
              <article key={String(item.id)} className={`${examPaper} overflow-hidden rounded-[28px] border border-[#d7e1da]`}>
                <div className="h-1.5 bg-[#cefa90]" />
                <div className="p-5 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#4c6b16]">Assessment</p>
                  <h3 className="mt-1 text-2xl text-[#17211c]">{String(item.name)}</h3>
                  <p className="mt-1 text-xs text-[#44574e]">Status: {String(item.status)}</p>
                  <p className="mt-3 whitespace-pre-wrap text-[#44574e]">{String(item.instructions)}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-[#17211c]">
                    <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">
                      {Math.round(Number(item.duration_seconds) / 60)} min
                    </span>
                    <span className="rounded-full border border-[#d7e1da] px-2.5 py-1">
                      Start by {when(String(item.start_by), app.timezone)}
                    </span>
                    {item.proctored === true || item.proctored === "t" ? (
                      <span className="rounded-full border border-[#d7e1da] bg-[#f7fbe9] px-2.5 py-1 text-[#4c6b16]">Camera on</span>
                    ) : null}
                  </div>
                  {item.status === "COMPLETED" ? (
                    <p className="mt-4 text-sm text-muted">Submitted.</p>
                  ) : item.status === "CANCELLED" || item.status === "EXPIRED" ? (
                    <p className="mt-4 text-sm text-muted">No longer available.</p>
                  ) : (
                    <Button
                      className="mt-4 rounded-full bg-[#cefa90] text-[#14221b]"
                      type="button"
                      disabled={busyId === String(item.id)}
                      onClick={() => void openAssignment(String(item.id))}
                    >
                      {busyId === String(item.id)
                        ? "Opening…"
                        : item.active_attempt
                          ? "Continue assessment"
                          : "Open assessment"}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-2xl">Messages</h2>
            <p className="text-sm text-muted">
              Messages written in RECRUIT4US. A reply is stored for the recruiter the same way.
            </p>
            {(data?.messages ?? []).length === 0 ? <p className="text-sm">No messages yet.</p> : null}
            {(data?.messages ?? []).map((message) => (
              <article key={message.id} className="text-sm">
                <p className="font-medium">{message.subject}</p>
                <p className="mb-2 text-muted">
                  {message.author === "CANDIDATE" ? "You" : message.from_name || "Recruiter"} · {when(message.at)}
                </p>
                {message.author === "CANDIDATE" ? (
                  <p className="whitespace-pre-wrap rounded-[24px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
                    {message.body}
                  </p>
                ) : (
                  <MailCard
                    name={message.mail_from_name || message.company_name || message.from_name}
                    body={message.body}
                    footer={message.mail_footer}
                    accent={message.accent}
                  />
                )}
              </article>
            ))}
            <form className="space-y-2" onSubmit={onReply}>
              <Field label="Reply">
                <textarea className={`${inputClass} min-h-20 py-2`} value={reply} onChange={(event) => setReply(event.target.value)} />
              </Field>
              <Button type="submit" variant="secondary">Store reply</Button>
            </form>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-2xl">Interviews</h2>
            {(data?.interviews ?? []).length === 0 ? <p className="text-sm">No interviews scheduled.</p> : null}
            {(data?.interviews ?? []).map((item) => (
              <article key={String(item.id)} className="rounded-[24px] border border-line bg-white p-4 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
                <p>{String(item.title)}</p>
                <p>{when(String(item.starts_at), String(item.timezone))}</p>
                <p className="text-muted">{String(item.location)} {String(item.meeting_url)}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-2xl">Offers</h2>
            {(data?.offers ?? []).length === 0 ? <p className="text-sm">No offers yet.</p> : null}
            {(data?.offers ?? []).map((offer) => (
              <article key={String(offer.id)} className="rounded-[24px] border border-line bg-white p-4 text-sm shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
                <p>{String(offer.title)} · {String(offer.status)}</p>
                <p>{money(Number(offer.salary_minor), String(offer.currency))}</p>
                {offer.start_date ? <p>Start date {String(offer.start_date)}</p> : null}
                {offer.message ? <p className="mt-2 whitespace-pre-wrap text-muted">{String(offer.message)}</p> : null}
                <p className="mt-2 text-xs text-muted">
                  To accept or decline formally, use the offer link from your email or sign in to the candidate desk.
                </p>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
