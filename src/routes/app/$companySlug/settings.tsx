import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_EMBED_THEME, PRODUCT_THEME, companyCssVars, contrastRatio, embedTheme, type EmbedTheme } from "@/domain/embed-theme";
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
        <CompanySettings
          key={`${status.data?.companyName ?? ""}:${status.data?.headline ?? ""}:${status.data?.embed.background ?? ""}:${status.data?.embed.ink ?? ""}:${status.data?.embed.accent ?? ""}:${status.data?.embed.accentInk ?? ""}:${status.data?.mail?.fromName ?? ""}:${status.data?.mail?.logoUrl ?? ""}:${status.data?.mail?.hasLogo ? "1" : "0"}`}
          companySlug={companySlug}
          companyName={status.data?.companyName ?? ""}
          timezone={status.data?.timezone ?? "America/New_York"}
          retentionDays={status.data?.retentionDays ?? 365}
          headline={status.data?.headline ?? ""}
          embed={embedTheme(status.data?.embed)}
          mailFromName={status.data?.mail?.fromName ?? ""}
          mailFooter={status.data?.mail?.footer ?? ""}
          mailLogoUrl={status.data?.mail?.logoUrl ?? ""}
          hasLogo={Boolean(status.data?.mail?.hasLogo)}
          onError={setError}
        />
      ) : null}
      {tab === "Members" ? (
        members.loading && !members.data ? <Loading /> :
        <div className="space-y-4">
          {members.error ? <Alert>{members.error}</Alert> : null}
          <ul className="space-y-2 text-sm">
            {(members.data?.members ?? []).map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] px-3 py-2">
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
            <li key={String(message.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
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
            <li key={item.name} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4">
              <h2 className="text-xl">{item.name}</h2>
              <p className="text-sm text-link">{item.state}</p>
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
            <li key={String(request.id)} className="flex items-center justify-between gap-3 rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3">
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
            <li key={String(event.id)} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] px-3 py-2">
              {String(event.summary)} <span className="text-muted">{when(String(event.at))}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CompanySettings({
  companySlug,
  companyName,
  timezone,
  retentionDays,
  headline,
  embed,
  mailFromName,
  mailFooter,
  mailLogoUrl,
  hasLogo,
  onError,
}: {
  companySlug: string;
  companyName: string;
  timezone: string;
  retentionDays: number;
  headline: string;
  embed: EmbedTheme;
  mailFromName: string;
  mailFooter: string;
  mailLogoUrl: string;
  hasLogo: boolean;
  onError: (message: string) => void;
}) {
  const [colors, setColors] = useState<EmbedTheme>(embed);
  const [line, setLine] = useState(headline);
  const [fromName, setFromName] = useState(mailFromName);
  const [footer, setFooter] = useState(mailFooter);
  const [logoUrl, setLogoUrl] = useState(mailLogoUrl);
  const [logoFile, setLogoFile] = useState<{ mime: string; bytes: string } | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const swatch = companyCssVars(colors);
  const textContrast = contrastRatio(colors.ink, colors.background);
  const buttonContrast = contrastRatio(colors.accentInk, colors.accent);
  function setColor(key: keyof EmbedTheme, value: string) {
    setColors((current) => ({ ...current, [key]: value }));
  }
  return (
    <form className="max-w-lg space-y-3" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      updateCompany({
        data: {
          slug: companySlug,
          name: String(data.get("name")),
          timezone: String(data.get("timezone")),
          retentionDays: Number(data.get("retention")),
          careersHeadline: line,
          embedBackground: colors.background,
          embedInk: colors.ink,
          embedAccent: colors.accent,
          embedAccentInk: colors.accentInk,
          mailFromName: fromName,
          mailFooter: footer,
          mailLogoUrl: logoUrl,
          mailLogoMime: logoFile?.mime ?? "",
          mailLogoBytes: logoFile?.bytes ?? "",
          clearLogo: clearLogo && !logoFile,
        },
      }).then(() => refreshPage()).catch((err) => onError(err instanceof Error ? err.message : "Could not save."));
    }}>
      <Field label="Name"><input name="name" className={inputClass} defaultValue={companyName} placeholder="Company name" required /></Field>
      <fieldset className="space-y-3 rounded-md border border-line p-4">
        <legend className="px-1 text-sm font-medium">Email</legend>
        <p className="text-sm text-muted">This name, logo, and footer are added when a queued message is sent. A blank name uses the company name. The header uses this company’s button color.</p>
        <Field label="From name">
          <input className={inputClass} value={fromName} maxLength={80} placeholder={companyName || "Company"} onChange={(event) => setFromName(event.target.value)} />
        </Field>
        <Field label="Footer">
          <textarea className={`${inputClass} min-h-20 py-2`} value={footer} maxLength={400} placeholder="Optional line under the message" onChange={(event) => setFooter(event.target.value)} />
        </Field>
        <Field label="Logo URL">
          <input className={inputClass} value={logoUrl} maxLength={300} placeholder="https://…" onChange={(event) => setLogoUrl(event.target.value)} />
        </Field>
        <Field label="Logo file">
          <input
            className={inputClass}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setLogoError(null);
              if (!file) {
                setLogoFile(null);
                return;
              }
              const ext = file.name.toLowerCase().split(".").pop();
              const mime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "";
              if (!mime || file.size > 120_000) {
                setLogoFile(null);
                setLogoError("The logo must be a PNG or JPEG under 120 KB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const encoded = String(reader.result ?? "");
                const bytes = encoded.includes(",") ? encoded.split(",")[1] ?? "" : encoded;
                setLogoFile({ mime, bytes });
                setClearLogo(false);
              };
              reader.readAsDataURL(file);
            }}
          />
        </Field>
        {hasLogo || logoFile ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearLogo} onChange={(event) => setClearLogo(event.target.checked)} />
            Remove the saved logo
          </label>
        ) : null}
        {logoError ? <p className="text-sm text-warn">{logoError}</p> : null}
        <div className="rounded-[24px] border border-line bg-white p-4">
          {logoFile ? <img src={`data:${logoFile.mime};base64,${logoFile.bytes}`} alt="" className="mb-2 max-h-16" /> : null}
          <p className="text-2xl">{fromName.trim() || companyName || "Company"}</p>
          <p className="mb-1 mt-3 text-sm font-medium">Message</p>
          <div className="rounded-xl border border-line px-3 py-2 text-sm">Hello candidate,</div>
          {footer.trim() ? <p className="mt-3 text-sm text-muted">{footer.trim()}</p> : null}
          <div className="mt-3 h-2 rounded-full" style={{ background: colors.accent }} />
        </div>
      </fieldset>
      <Field label="Timezone"><input name="timezone" className={inputClass} defaultValue={timezone} /></Field>
      <Field label="Retention days"><input name="retention" className={inputClass} type="number" min={30} max={3650} defaultValue={retentionDays} /></Field>
      <fieldset className="space-y-3 rounded-md border border-line p-4">
        <legend className="px-1 text-sm font-medium">Main page</legend>
        <p className="text-sm text-muted">These colors are this company’s. They cover the public careers page, each job page, the apply form, and this workspace. Sign-in stays RECRUIT4US.</p>
        <Field label="Welcome line">
          <input className={inputClass} value={line} maxLength={160} placeholder="Optional line under the company name" onChange={(event) => setLine(event.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField label="Background" value={colors.background} onChange={(value) => setColor("background", value)} />
          <ColorField label="Text" value={colors.ink} onChange={(value) => setColor("ink", value)} />
          <ColorField label="Button" value={colors.accent} onChange={(value) => setColor("accent", value)} />
          <ColorField label="Button text" value={colors.accentInk} onChange={(value) => setColor("accentInk", value)} />
        </div>
        {textContrast < 4.5 || buttonContrast < 4.5 ? (
          <p className="text-sm text-warn">Text and its background are close. The page will save, but it will be hard to read.</p>
        ) : null}
        <div className="rounded-md border p-4" style={swatch}>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Careers</p>
          <p className="text-2xl">{companyName || "Company"}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>{line || "Published jobs only."}</p>
          <div className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}>Open role</div>
          <span className="mt-3 inline-flex min-h-11 items-center rounded-md px-4 text-sm" style={{ background: colors.accent, color: colors.accentInk }}>View job</span>
        </div>
        <button type="button" className="text-sm text-link" onClick={() => setColors(DEFAULT_EMBED_THEME)}>Use the white default</button>
        <button type="button" className="ml-4 text-sm text-link" onClick={() => setColors(PRODUCT_THEME)}>Use RECRUIT4US colors</button>
      </fieldset>
      <Button type="submit">Save</Button>
    </form>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input
          aria-label={label}
          type="color"
          className="h-11 w-14 cursor-pointer rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-1"
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
        <span className="font-mono text-xs text-muted">{value}</span>
      </span>
    </label>
  );
}

