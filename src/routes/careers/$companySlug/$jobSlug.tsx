import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPublicJob, submitApplicationAuthed, submitApplicationPublic } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading } from "@/components/talent/kit";

export const Route = createFileRoute("/careers/$companySlug/$jobSlug")({ component: JobPage });

function JobPage() {
  const { companySlug, jobSlug } = Route.useParams();
  const { user } = useCurrentUserState();
  const [job, setJob] = useState<Awaited<ReturnType<typeof getPublicJob>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [why, setWhy] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    let live = true;
    getPublicJob({ data: { companySlug, jobSlug } })
      .then((value) => { if (live) setJob(value); })
      .catch((err: unknown) => { if (live) setError(err instanceof Error ? err.message : "Could not load this job."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [companySlug, jobSlug]);

  useEffect(() => {
    if (user?.primaryEmail) setEmail(user.primaryEmail);
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      companySlug,
      jobSlug,
      name,
      email,
      answers: { why, website },
      idempotencyKey: crypto.randomUUID(),
      resume: null,
    };
    try {
      const result = user
        ? await submitApplicationAuthed({ data: payload })
        : await submitApplicationPublic({ data: payload });
      setDone(result.alreadyApplied
        ? "An active application was already on file. It was not duplicated."
        : "Application received. Sign in with the same email to follow it in the candidate portal.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    }
  }

  if (loading) return <Loading />;
  if (!job) return <main className="p-6"><Empty title="This job is not open" body="It may be a draft, paused, or closed." /></main>;
  const fields = (job.form_schema ?? []) as { id: string; label: string; type: string; required?: boolean; help?: string }[];
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-muted">{job.company_name}</Link>
      <h1 className="mt-3 text-4xl">{job.title}</h1>
      <p className="mt-2 text-sm text-muted">{job.department} · {job.locations} · {job.work_arrangement}</p>
      {job.salary_visible && job.salary_min ? (
        <p className="mt-2 text-sm">Compensation shown: {job.salary_min.toLocaleString()}–{job.salary_max?.toLocaleString()} {job.salary_currency} per year</p>
      ) : null}
      <article className="mt-6 whitespace-pre-wrap text-sm leading-6">{job.description}</article>
      <form className="mt-8 space-y-3 rounded-md border border-line bg-surface p-4" onSubmit={submit}>
        <h2 className="text-2xl">Apply</h2>
        <Field label="Name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required /></Field>
        <Field label="Email"><input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
        {fields.map((field) => (
          <Field key={field.id} label={field.label}>
            {field.type === "long_text" ? (
              <textarea className={`${inputClass} min-h-24 py-2`} value={field.id === "why" ? why : website} onChange={(event) => field.id === "why" ? setWhy(event.target.value) : setWebsite(event.target.value)} />
            ) : (
              <input className={inputClass} value={field.id === "website" ? website : why} onChange={(event) => field.id === "website" ? setWebsite(event.target.value) : setWhy(event.target.value)} />
            )}
          </Field>
        ))}
        {error ? <Alert>{error}</Alert> : null}
        {done ? <p className="text-sm text-ok">{done}</p> : null}
        <Button type="submit">Submit application</Button>
      </form>
    </main>
  );
}
