import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { explainJob, listJobs, listPlans, movePlanStage, savePlan } from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/plans")({ component: Plans });

function Plans() {
  const { companySlug } = Route.useParams();
  const jobs = useAuthed(() => listJobs({ data: { slug: companySlug } }), [companySlug]);
  const [jobId, setJobId] = useState("");
  const plans = useAuthed(() => listPlans({ data: { slug: companySlug, jobId } }), [companySlug, jobId], jobId.length > 7);
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoCutoff, setAutoCutoff] = useState(false);
  const [percent, setPercent] = useState(50);
  const [stages, setStages] = useState<Array<{ name: string; kind: "REVIEW" | "SCREEN" | "CODING" | "ASSESSMENT" | "INTERVIEW" | "PANEL" | "OFFER" | "CUSTOM"; reviewers: number; entryRule: string; exitRule: string; assessmentKey: string; scorecardFocus: string }>>([
    { name: "Recruiter screen", kind: "SCREEN", reviewers: 1, entryRule: "", exitRule: "A person moves them", assessmentKey: "", scorecardFocus: "" },
    { name: "Technical interview", kind: "INTERVIEW", reviewers: 2, entryRule: "Screen passed", exitRule: "Scorecards submitted", assessmentKey: "", scorecardFocus: "problem solving" },
    { name: "Offer", kind: "OFFER", reviewers: 1, entryRule: "", exitRule: "", assessmentKey: "", scorecardFocus: "" },
  ]);
  if (jobs.loading || jobs.isPending) return <Loading />;
  return (
    <div>
      <PageTitle title="Hiring plans" lede="Each job can use a different plan. The cutoff includes ties. It does not withdraw a paper that was already sent. A personality type cannot be a cutoff." />
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Job">
        <select className={inputClass} value={jobId} onChange={(event) => setJobId(event.target.value)}>
          <option value="">Choose</option>
          {(jobs.data ?? []).map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>
      </Field>
      {jobId ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => savePlan({ data: { slug: companySlug, jobId, template: "standard", cutoffPercent: 50 } }).then(() => plans.reload()).catch((err: Error) => setError(err.message))}>Standard plan, top 50%</Button>
          <Button type="button" variant="secondary" onClick={() => savePlan({ data: { slug: companySlug, jobId, template: "screen-first", cutoffPercent: 100 } }).then(() => plans.reload()).catch((err: Error) => setError(err.message))}>Screen first</Button>
          <Button type="button" variant="secondary" onClick={() => savePlan({ data: { slug: companySlug, jobId, template: "custom", cutoffPercent: percent, autoCutoff, stages } }).then(() => plans.reload()).catch((err: Error) => setError(err.message))}>Save this version</Button>
          <Button type="button" variant="secondary" onClick={() => explainJob({ data: { slug: companySlug, jobId } }).then((row) => setLines(row.lines)).catch((err: Error) => setError(err.message))}>Explain ranks</Button>
        </div>
      ) : null}
      {jobId ? (
        <div className="mt-4 space-y-3 rounded-md border border-line p-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoCutoff} onChange={(event) => setAutoCutoff(event.target.checked)} /> Automatic top-half cutoff. Off means a recruiter decides. Issued invitations stay unless you cancel them.</label>
          <Field label="Cutoff percent, used only when automatic is on">
            <input className={inputClass} type="number" min={1} max={100} value={percent} onChange={(event) => setPercent(Number(event.target.value))} />
          </Field>
          {stages.map((stage, index) => (
            <div key={`${stage.name}-${index}`} className="grid gap-2 md:grid-cols-3">
              <input className={inputClass} aria-label="Stage name" value={stage.name} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
              <select className={inputClass} aria-label="Stage kind" value={stage.kind} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, kind: event.target.value as typeof stage.kind } : row))}>
                {["REVIEW", "SCREEN", "CODING", "ASSESSMENT", "INTERVIEW", "PANEL", "OFFER", "CUSTOM"].map((kind) => <option key={kind}>{kind}</option>)}
              </select>
              <input className={inputClass} aria-label="Reviewers" type="number" min={0} max={8} value={stage.reviewers} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, reviewers: Number(event.target.value) } : row))} />
              <input className={inputClass} aria-label="Entry rule" placeholder="Entry rule" value={stage.entryRule} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, entryRule: event.target.value } : row))} />
              <input className={inputClass} aria-label="Exit rule" placeholder="Exit rule" value={stage.exitRule} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, exitRule: event.target.value } : row))} />
              <input className={inputClass} aria-label="Assessment key" placeholder="Assessment key" value={stage.assessmentKey} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, assessmentKey: event.target.value } : row))} />
              <input className={inputClass} aria-label="Scorecard focus" placeholder="Scorecard focus" value={stage.scorecardFocus} onChange={(event) => setStages(stages.map((row, i) => i === index ? { ...row, scorecardFocus: event.target.value } : row))} />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setStages([...stages, { name: "Custom stage", kind: "CUSTOM", reviewers: 1, entryRule: "", exitRule: "", assessmentKey: "", scorecardFocus: "" }])}>Add stage</Button>
        </div>
      ) : null}
      <ul className="mt-4 space-y-2 text-sm">
        {(plans.data?.plans ?? []).map((plan: any) => (
          <li key={plan.id}>
            <p>{plan.name} v{plan.version} · {plan.status} · cutoff {plan.cutoff_percent}%{plan.auto_cutoff === false ? " · automatic cutoff off" : ""}</p>
            <ul className="ml-4 list-disc">
              {(plans.data?.stages ?? []).filter((stage: any) => stage.plan_id === plan.id).map((stage: any) => (
                <li key={`${plan.id}-${stage.position}`}>{stage.name} · {stage.kind} · {stage.reviewers} reviewers{stage.entry_rule ? ` · in: ${stage.entry_rule}` : ""}{stage.exit_rule ? ` · out: ${stage.exit_rule}` : ""}{stage.assessment_key ? ` · ${stage.assessment_key}` : ""}{stage.scorecard_focus ? ` · ${stage.scorecard_focus}` : ""}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-1 text-sm">{lines.map((line) => <li key={line}>{line}</li>)}</ul>
      <form className="mt-4 grid gap-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        movePlanStage({ data: { slug: companySlug, applicationId: String(form.get("applicationId")), toStage: String(form.get("toStage")), reason: String(form.get("reason")), decline: form.get("decline") === "on" } }).then(() => setLines(["Stage recorded. Existing invitations were kept."])).catch((err: Error) => setError(err.message));
      }}>
        <Field label="Application"><input name="applicationId" className={inputClass} /></Field>
        <Field label="Stage name"><input name="toStage" className={inputClass} placeholder="Technical interview" /></Field>
        <Field label="Reason"><input name="reason" className={inputClass} /></Field>
        <label className="text-sm"><input name="decline" type="checkbox" /> Decline instead of advancing</label>
        <Button type="submit" variant="secondary">Record transition</Button>
      </form>
    </div>
  );
}
