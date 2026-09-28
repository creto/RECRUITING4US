import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { cancelHire, hrisPayload, listHires, openHire, remindHires, setHireTask } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/onboarding")({ component: Onboarding });

function Onboarding() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listHires({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  return (
    <div>
      <PageTitle title="Onboarding" lede={state.data?.hris} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        const id = String(new FormData(event.currentTarget).get("applicationId") ?? "");
        openHire({ data: { slug: companySlug, applicationId: id, note: "Opened after offer acceptance", location: String(new FormData(event.currentTarget).get("location") ?? ""), roleTitle: String(new FormData(event.currentTarget).get("role") ?? "") } }).then(() => refreshPage()).catch((err: Error) => setError(err.message));
      }}>
        <Field label="Accepted application"><input name="applicationId" className={inputClass} /></Field>
        <Field label="Role"><input name="role" className={inputClass} placeholder="Engineer" /></Field>
        <Field label="Location"><input name="location" className={inputClass} placeholder="Remote" /></Field>
        <Button type="submit">Open pending hire</Button>
        <Button type="button" variant="secondary" onClick={() => remindHires({ data: { slug: companySlug } }).then((row) => setError(row.note + ` Queued ${row.queued}.`)).catch((err: Error) => setError(err.message))}>Queue reminders</Button>
      </form>
      {(state.data?.hires ?? []).length === 0 ? <Empty title="No pending hires" body="This opens only after an offer is accepted. Canceling a hire keeps the offer history." /> : null}
      <ul className="space-y-3">
        {(state.data?.hires ?? []).map((hire: any) => (
          <li key={String(hire.id)} className="rounded-md border border-line p-3 text-sm">
            <p>Application {String(hire.application_id)} · {String(hire.status)}</p>
            <ul className="mt-2 space-y-1">
              {(state.data?.tasks ?? []).filter((task: any) => task.hire_id === hire.id).map((task: any) => (
                <li key={String(task.id)} className="flex items-center justify-between gap-2">
                  <span>{String(task.title)} · {String(task.status)} · {String(task.owner_role)}{task.due_at ? ` · due ${String(task.due_at).slice(0, 10)}` : ""}{task.depends_on ? ` · after ${String(task.depends_on)}` : ""}{task.candidate_visible ? " · candidate" : ""}</span>
                  <Button type="button" variant="secondary" onClick={() => setHireTask({ data: { slug: companySlug, taskId: String(task.id), status: task.status === "DONE" ? "OPEN" : "DONE" } }).then(() => refreshPage())}>Toggle</Button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => hrisPayload({ data: { slug: companySlug, applicationId: String(hire.application_id) } }).then((row) => setFile(JSON.stringify(row, null, 2))).catch((err: Error) => setError(err.message))}>Download handoff</Button>
              <Button type="button" variant="danger" onClick={() => cancelHire({ data: { slug: companySlug, applicationId: String(hire.application_id), reason: "Hire canceled" } }).then(() => refreshPage())}>Cancel hire</Button>
            </div>
          </li>
        ))}
      </ul>
      {file ? <pre className="mt-4 overflow-auto rounded-md border border-line p-3 text-xs">{file}</pre> : null}
    </div>
  );
}
