import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listRules, simulateRule, upsertRule } from "@/server/talent.functions";
import { Alert, Button, Empty, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/automations")({ component: Automations });

function Automations() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listRules({ data: { slug: companySlug } }), [companySlug]);
  const [error, setError] = useState<string | null>(null);
  const [sim, setSim] = useState<string | null>(null);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  return (
    <div>
      <PageTitle title="Automations" lede="Rules are plain triggers and actions. Unknown data does not count as a failing score. Disabled rules never run." />
      {(state.data ?? []).length === 0 ? <Empty title="No rules" body="Add a rule below. It will not backfill old candidates." /> : null}
      <ul className="space-y-3">
        {(state.data ?? []).map((rule: any) => (
          <li key={String(rule.id)} className="rounded-md border border-line bg-surface p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl">{String(rule.name)}</h2>
              <span>{rule.enabled ? "On" : "Off"}</span>
            </div>
            <p className="text-muted">When {String(rule.trigger_name)} · version {String(rule.version)}</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              simulateRule({ data: { slug: companySlug, ruleId: String(rule.id), applicationId: String(data.get("applicationId")) } })
                .then((result) => setSim(`${result.verdict}: ${result.lines.join("; ")} ${result.note}`))
                .catch((err) => setError(err.message));
            }}>
              <input name="applicationId" className={inputClass} placeholder="Application id" aria-label="Application id" />
              <Button type="submit" variant="secondary">Simulate</Button>
              <Button type="button" variant="ghost" onClick={() => upsertRule({
                data: {
                  slug: companySlug,
                  id: String(rule.id),
                  name: String(rule.name),
                  enabled: !rule.enabled,
                  trigger: String(rule.trigger_name),
                  conditions: (rule.conditions as never) ?? [],
                  actions: (rule.actions as never) ?? [],
                },
              }).then(() => refreshPage()).catch((err) => setError(err.message))}>{rule.enabled ? "Disable" : "Enable"}</Button>
            </form>
          </li>
        ))}
      </ul>
      {sim ? <p className="mt-4 text-sm">{sim}</p> : null}
      <form className="mt-8 space-y-3 rounded-md border border-line bg-surface p-4" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        upsertRule({
          data: {
            slug: companySlug,
            name: String(data.get("name")),
            enabled: false,
            trigger: String(data.get("trigger")),
            conditions: [],
            actions: [{ type: String(data.get("action")) }],
          },
        }).then(() => refreshPage()).catch((err) => setError(err.message));
      }}>
        <h2 className="text-2xl">New rule</h2>
        <Field label="Name"><input name="name" className={inputClass} required /></Field>
        <Field label="Trigger">
          <select name="trigger" className={inputClass}>
            <option value="APPLICATION_SUBMITTED">Application submitted</option>
            <option value="ASSESSMENT_COMPLETED">Assessment completed</option>
            <option value="STAGE_CHANGED">Stage changed</option>
          </select>
        </Field>
        <Field label="Action">
          <select name="action" className={inputClass}>
            <option value="create_review">Create a review task</option>
            <option value="add_tag">Add tag Follow-up</option>
          </select>
        </Field>
        <Button type="submit">Save disabled rule</Button>
      </form>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </div>
  );
}
