import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { attachSandbox, listSandboxes, saveSandbox } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/sandboxes")({ component: Sandboxes });

function Sandboxes() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listSandboxes({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const data = state.data;
  if (!data) return null;
  return (
    <div>
      <PageTitle
        title="Sandboxes"
        lede="A sandbox sets the time and output cap for a sample run. JavaScript/TypeScript prefer a local Node jail when available; every language can also run through Judge0 CE. The output is not a score."
      />
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      <ul className="space-y-3">
        {data.profiles.map((profile) => (
          <li key={profile.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
            <h2 className="text-xl">{profile.name}</h2>
            <p className="text-muted">
              {profile.runtime} · {profile.timeout_ms} ms · {profile.max_output_chars} characters · network {profile.network} · filesystem {profile.filesystem}
            </p>
            <p className="mt-2">{profile.note}</p>
          </li>
        ))}
      </ul>
      {data.canEdit ? (
        <form className="mt-8 space-y-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          saveSandbox({
            data: {
              slug: companySlug,
              name: String(form.get("name") ?? ""),
              timeoutMs: Number(form.get("timeoutMs")),
              maxOutputChars: Number(form.get("maxOutputChars")),
            },
          }).then(() => refreshPage()).catch((err) => setError(err.message));
        }}>
          <h2 className="text-2xl">Make a sandbox</h2>
          <Field label="Name"><input name="name" className={inputClass} required /></Field>
          <Field label="Timeout in milliseconds (200–5000)">
            <input name="timeoutMs" className={inputClass} inputMode="numeric" defaultValue="1500" required />
          </Field>
          <Field label="Output cap in characters (200–8000)">
            <input name="maxOutputChars" className={inputClass} inputMode="numeric" defaultValue="4000" required />
          </Field>
          <Button type="submit">Save sandbox</Button>
        </form>
      ) : <p className="mt-6 text-sm text-muted">You can read sandboxes. Publishing an assessment is required to make one.</p>}
      <div className="mt-8 space-y-3">
        <h2 className="text-2xl">Use on an assessment</h2>
        {data.assessments.map((assessment) => (
          <form key={assessment.id} className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            attachSandbox({
              data: { slug: companySlug, assessmentId: assessment.id, sandboxId: String(form.get("sandboxId") ?? "") },
            }).then(() => refreshPage()).catch((err) => setError(err.message));
          }}>
            <Field label={assessment.name}>
              <select name="sandboxId" className={inputClass} defaultValue={assessment.sandbox_profile_id ?? ""} disabled={!data.canEdit}>
                <option value="">Default 1500 ms / 4000 characters</option>
                {data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </Field>
            {data.canEdit ? <Button type="submit" variant="secondary">Attach</Button> : null}
          </form>
        ))}
      </div>
    </div>
  );
}
