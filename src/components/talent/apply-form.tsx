import { useEffect, useState } from "react";
import { applicantNotice } from "@/domain/sheet";
import { submitApplicationAuthed, submitApplicationPublic } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass } from "./kit";

type FormField = { id: string; label: string; type: string; required?: boolean; help?: string; options?: string[] };

export function ApplyForm({
  companySlug,
  jobSlug,
  fields,
  user,
  source,
}: {
  companySlug: string;
  jobSlug: string;
  fields: FormField[];
  user: { primaryEmail?: string | null; displayName?: string | null } | null;
  source: "CAREERS" | "EMBED";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resume, setResume] = useState<{ name: string; mime: string; dataBase64: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ title: string; lines: string[] } | null>(null);

  useEffect(() => {
    if (user?.primaryEmail) setEmail(user.primaryEmail);
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!resume) {
      setError("Attach a CV as a PDF or text file.");
      return;
    }
    setPending(true);
    try {
      const result = user
        ? await submitApplicationAuthed({
            data: { companySlug, jobSlug, name, email, phone, answers, idempotencyKey: crypto.randomUUID(), resume, source },
          })
        : await submitApplicationPublic({
            data: { companySlug, jobSlug, name, email, phone, answers, idempotencyKey: crypto.randomUUID(), resume, source },
          });
      setDone(applicantNotice({
        alreadyApplied: result.alreadyApplied,
        receipt: result.receipt,
        cvResult: result.cvResult,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <section className="space-y-2 rounded-md border border-line bg-surface p-4" aria-live="polite">
        <h2 className="text-2xl">{done.title}</h2>
        {done.lines.map((line) => <p key={line} className="text-sm">{line}</p>)}
      </section>
    );
  }

  return (
    <form className="space-y-3 rounded-md border border-line bg-surface p-4" onSubmit={submit}>
      <h2 className="text-2xl">Apply</h2>
      <Field label="Name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></Field>
      <Field label="Email"><input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></Field>
      <Field label="Phone (optional)"><input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" /></Field>
      {fields.map((field) => (
        <Field key={field.id} label={field.required ? `${field.label} (required)` : field.label}>
          {field.type === "long_text" ? (
            <textarea
              className={`${inputClass} min-h-28 py-2`}
              value={answers[field.id] ?? ""}
              required={Boolean(field.required)}
              onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
            />
          ) : field.type === "select" ? (
            <select
              className={inputClass}
              value={answers[field.id] ?? ""}
              required={Boolean(field.required)}
              onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
            >
              <option value="">Choose</option>
              {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              className={inputClass}
              type={field.type === "url" ? "url" : "text"}
              value={answers[field.id] ?? ""}
              required={Boolean(field.required)}
              onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
            />
          )}
          {field.help ? <span className="mt-1 block text-xs text-muted">{field.help}</span> : null}
        </Field>
      ))}
      <Field label="CV (PDF or text)">
        <input
          className={inputClass}
          type="file"
          required
          accept=".pdf,.txt,.csv,application/pdf,text/plain,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setResume(null);
              return;
            }
            if (file.size > 500_000) {
              setResume(null);
              setError("The CV must be 500 KB or smaller.");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const encoded = String(reader.result ?? "");
              const dataBase64 = encoded.includes(",") ? encoded.split(",")[1] ?? "" : encoded;
              const ext = file.name.toLowerCase().split(".").pop();
              const mime = ext === "pdf" ? "application/pdf" : ext === "csv" ? "text/csv" : ext === "txt" ? "text/plain" : file.type;
              setResume({ name: file.name, mime, dataBase64 });
              setError(null);
            };
            reader.readAsDataURL(file);
          }}
        />
      </Field>
      <p className="text-sm text-muted">The CV is checked for this job’s must-have skills. Your other answers are stored as one row. You will see a receipt when the form is complete. It is not emailed.</p>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={pending}>{pending ? "Submitting" : "Submit application"}</Button>
    </form>
  );
}
