import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateTask, exportMine, listMyApplications, listMyDesk, replyToIntent } from "@/server/talent.functions";
import { AppLink, Button, Empty, Gate, Loading, MailCard, PageTitle, refreshPage, StageBar, useAuthed, when, MarketingHomeLink } from "@/components/talent/kit";
import { UserButton } from "@/lib/auth/gates";
import { useState } from "react";

export const Route = createFileRoute("/candidate/")({ component: Portal });

function Portal() {
  const state = useAuthed(() => listMyApplications(), []);
  const desk = useAuthed(() => listMyDesk(), []);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState<string | null>(null);
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <MarketingHomeLink />
          <div className="flex items-center gap-4">
            <Link to="/portal" className="text-sm text-link">Applicant portal</Link>
            <UserButton />
          </div>
        </div>
        <PageTitle title="Your applications" lede="You only see applications tied to your signed-in email. Internal notes and other candidates stay hidden." />
        <Button type="button" variant="secondary" className="mb-4" onClick={() => {
          exportMine().then((file) => {
            const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "recruit4us-export.json";
            link.click();
            URL.revokeObjectURL(url);
          }).catch(() => undefined);
        }}>Download my data</Button>
        {desk.data?.note ? <p className="mb-3 text-sm text-muted">{desk.data.note}</p> : null}
        {(desk.data?.exercises ?? []).map((item: any) => (
          <p key={item.token} className="mb-2 text-sm"><AppLink href={`/code/${item.token}`}>Coding exercise: {item.title}</AppLink></p>
        ))}
        {(desk.data?.tasks ?? []).map((task: any) => (
          <p key={task.id} className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span>{task.title} · {task.status}</span>
            {task.status !== "DONE" ? <Button type="button" variant="secondary" onClick={() => candidateTask({ data: { taskId: task.id } }).then(() => refreshPage())}>Mark done</Button> : null}
          </p>
        ))}
        {(desk.data?.mail ?? []).map((message: { id: string; subject: string; body: string; intent_id: string; company_name?: string; mail_from_name?: string; mail_footer?: string; accent?: string }) => (
          <form key={message.id} className="mb-3 space-y-2 text-sm" onSubmit={(event) => {
            event.preventDefault();
            replyToIntent({ data: { intentId: message.intent_id, body: reply } }).then((row) => setNote(row.note)).catch(() => setNote("The reply was not saved."));
          }}>
            <p className="font-medium">{message.subject}</p>
            <MailCard name={message.mail_from_name || message.company_name || "Message"} body={message.body} footer={message.mail_footer} accent={message.accent} />
            <textarea className="mt-2 min-h-16 w-full rounded-md border border-line p-2" value={reply} onChange={(event) => setReply(event.target.value)} aria-label="Reply" />
            <Button type="submit" className="mt-2" variant="secondary">Save reply</Button>
          </form>
        ))}
        {note ? <p className="mb-3 text-sm">{note}</p> : null}
        {state.loading ? <Loading /> : null}
        {(state.data ?? []).length === 0 ? <Empty title="Nothing here yet" body="Apply on a careers page with this account’s email. Unverified email addresses cannot claim someone else’s application." /> : null}
        <ul className="space-y-3">
          {(state.data ?? []).map((item: any) => (
            <li key={item.id}>
              <AppLink className="block rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4" href={`/candidate/applications/${item.id}`}>
                <span className="text-xl">{item.jobTitle}</span>
                <span className="mt-1 block text-sm text-muted">{item.companyName} · {item.label} · {when(item.submittedAt)}</span>
                <StageBar steps={item.steps ?? []} index={item.hired ? (item.steps ?? []).length : item.index ?? 0} stopped={item.stopped} />
              </AppLink>
            </li>
          ))}
        </ul>
      </main>
    </Gate>
  );
}
