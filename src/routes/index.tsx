import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInGate } from "@/lib/auth/gates";
import { BrandBar, Wordmark } from "@/components/talent/kit";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <Wordmark />
        <SignInGate
          fallback={
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm text-accent-ink">
              Enter
            </Link>
          }
        >
          <Link to="/app" className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm text-accent-ink">
            Open workspace
          </Link>
        </SignInGate>
      </header>
      <div className="mt-6">
        <BrandBar />
      </div>
      <section className="mt-14 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="text-sm font-medium text-link">Hiring with the evidence attached</p>
          <h1 className="mt-3 text-5xl leading-tight text-ink">Jobs, assessments, and offers in one company workspace.</h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            RECRUIT4US keeps each employer’s candidates, scores, and notes separate. A score is evidence for a person to read — not an automatic hire or reject.
          </p>
        </div>
        <div className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Example pipeline</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["Applied", "12"],
              ["Assessment", "4"],
              ["Interview", "3"],
              ["Offer", "1"],
            ].map(([stage, count]) => (
              <li key={stage} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                <span>{stage}</span>
                <span className="tabular-nums text-muted">{count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Illustration only. Your workspace shows records you actually create.</p>
        </div>
      </section>
      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          ["Careers pages", "Publish a job and take applications without leaving the workspace."],
          ["Assessments", "Objective items score themselves. Written and code work waits for a person. Code is never run on this server."],
          ["Interviews and offers", "Schedule with a calendar file, approve exact terms, and record the candidate’s response."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </article>
        ))}
      </section>
      <p className="mt-10 text-sm text-muted">
        Demo assessments are fictional and are not a validated hiring instrument. Mail stays inside the workspace.
      </p>
    </main>
  );
}
