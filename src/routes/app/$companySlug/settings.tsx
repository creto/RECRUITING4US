import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  anonymizeCandidate,
  integrationStatus,
  inviteMember,
  listAudit,
  listDeletionRequests,
  listMail,
  listMembers,
  removeMember,
  revokeInvite,
  runRetention,
  updateCompany,
} from "@/server/talent.functions";
import { Alert, Button, Field, inputClass, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/settings")({ component: Settings });

function Settings() {
  const { companySlug } = Route.useParams();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState("Company");
  const members = useAuthed(() => listMembers({ data: { slug: companySlug } }), [companySlug], tab === "Members");
  const mail = useAuthed(() => listMail({ data: { slug: companySlug } }), [companySlug], tab === "Inbox");
  const audit = useAuthed(() => listAudit({ data: { slug: companySlug } }), [companySlug], tab === "Audit");
  const status = useAuthed(() => integrationStatus({ data: { slug: companySlug } }), [companySlug], tab === "Company" || tab === "Integrations");
  const deletions = useAuthed(() => listDeletionRequests({ data: { slug: companySlug } }), [companySlug], tab === "Privacy");

  if (status.isPending) return <Loading />;
  return (
    <div>
      <PageTitle title="Settings" lede="Invitations are accepted explicitly. The token in captured mail does not join anyone by itself." />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {["Company", "Members", "Inbox", "Integrations", "Privacy", "Audit"].map((item) => (
          <button key={item} type="button" className={`min-h-11 rounded-md px-3 text-sm ${tab === item ? "bg-accent text-accent-ink" : "border border-line bg-surface"}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {error ? <div className="mb-3"><Alert>{error}</Alert></div> : null}
      {notice ? <p className="mb-3 text-sm">{notice}</p> : null}
      {tab === "Company" ? (
        status.loading && !status.data ? <Loading /> :
        <form className="max-w-lg space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          updateCompany({
            data: {
              slug: companySlug,
              name: String(data.get("name")),
              timezone: String(data.get("timezone")),
              retentionDays: Number(data.get("retention")),
            },
          }).then(() => refreshPage()).catch((err) => setError(err.message));
        }}>
          <Field label="Name"><input name="name" className={inputClass} defaultValue={status.data?.companyName ?? ""} placeholder="Company name" required /></Field>
          <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue={status.data?.timezone ?? "America/New_York"} /></Field>
          <Field label="Retention days"><input name="retention" className={inputClass} type="number" min={30} max={3650} defaultValue={status.data?.retentionDays ?? 365} /></Field>
          <Button type="submit">Save</Button>
        </form>
      ) : null}
      {tab === "Members" ? (
        members.loading && !members.data ? <Loading /> :
        <div className="space-y-4">
          {members.error ? <Alert>{members.error}</Alert> : null}
          <ul className="space-y-2 text-sm">
            {(members.data?.members ?? []).map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2">
                <span>{member.name} · {member.email} · {member.role} · {member.status}</span>
                {member.status === "ACTIVE" ? <Button type="button" variant="danger" onClick={() => removeMember({ data: { slug: companySlug, membershipId: member.id } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Remove</Button> : null}
              </li>
            ))}
          </ul>
          <form className="grid gap-2 md:grid-cols-3" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            inviteMember({ data: { slug: companySlug, email: String(data.get("email")), role: String(data.get("role")) } })
              .then((result) => setToken(result.token)).catch((err) => setError(err.message));
          }}>
            <input name="email" className={inputClass} type="email" required placeholder="Email" aria-label="Email" />
            <select name="role" className={inputClass} aria-label="Role">
              {["ADMIN", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ASSESSMENT_AUTHOR", "ASSESSMENT_REVIEWER", "ANALYST"].map((role) => <option key={role}>{role}</option>)}
            </select>
            <Button type="submit">Invite</Button>
          </form>
          {token ? <p className="text-sm">Give this token to the invitee. It works once: {token}</p> : null}
          <ul className="text-sm text-muted">
            {(members.data?.invites ?? []).map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-2 py-1">
                <span>{invite.email} · {invite.role} · {invite.accepted ? "accepted" : invite.revoked ? "revoked" : `expires ${when(invite.expires_at)}`}</span>
                {!invite.accepted && !invite.revoked ? <button type="button" className="text-danger" onClick={() => revokeInvite({ data: { slug: companySlug, inviteId: invite.id } }).then(() => refreshPage())}>Revoke</button> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tab === "Inbox" ? (
        mail.loading && !mail.data ? <Loading /> :
        <ul className="space-y-2">
          {mail.error ? <Alert>{mail.error}</Alert> : null}
          {(mail.data ?? []).map((message: any) => (
            <li key={String(message.id)} className="rounded-md border border-line bg-surface p-3 text-sm">
              <p className="font-medium">{String(message.subject)}</p>
              <p className="text-muted">To {String(message.to_email)} · {String(message.status)} · {when(String(message.at))}</p>
              <p className="mt-2 whitespace-pre-wrap">{String(message.body)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "Integrations" ? (
        <ul className="space-y-2">
          {(status.data?.items ?? []).map((item) => (
            <li key={item.name} className="rounded-md border border-line bg-surface p-4">
              <h2 className="text-xl">{item.name}</h2>
              <p className="text-sm text-accent">{item.state}</p>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "Privacy" ? (
        <ul className="space-y-2 text-sm">
          <li>
            <Button type="button" variant="secondary" onClick={() => runRetention({ data: { slug: companySlug } }).then((result) => setNotice(`Removed ${result.removed} files past retention.`)).catch((err) => setError(err.message))}>Remove files past retention</Button>
          </li>
          {(deletions.data ?? []).length === 0 ? <p className="text-muted">No deletion requests. Anonymizing a candidate removes contact data and files in this company only.</p> : null}
          {(deletions.data ?? []).map((request: any) => (
            <li key={String(request.id)} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <span>{String(request.name)} · {String(request.status)}</span>
              {String(request.status) === "OPEN" ? <Button type="button" variant="danger" onClick={() => anonymizeCandidate({ data: { slug: companySlug, candidateId: String(request.candidate_id) } }).then(() => refreshPage()).catch((err) => setError(err.message))}>Anonymize</Button> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "Audit" ? (
        <ul className="space-y-2 text-sm">
          {audit.error ? <Alert>{audit.error}</Alert> : null}
          {(audit.data ?? []).map((event: any) => (
            <li key={String(event.id)} className="rounded-md border border-line bg-surface px-3 py-2">
              {String(event.summary)} <span className="text-muted">{when(String(event.at))}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
