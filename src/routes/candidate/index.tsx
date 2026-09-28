import { createFileRoute, Link } from "@tanstack/react-router";
import { exportMine, listMyApplications } from "@/server/talent.functions";
import { AppLink, Button, Empty, Gate, Loading, PageTitle, useAuthed, when, Wordmark } from "@/components/talent/kit";
import { UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/candidate/")({ component: Portal });

function Portal() {
  const state = useAuthed(() => listMyApplications(), []);
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link to="/"><Wordmark /></Link>
          <UserButton />
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
        {state.loading ? <Loading /> : null}
        {(state.data ?? []).length === 0 ? <Empty title="Nothing here yet" body="Apply on a careers page with this account’s email. Unverified email addresses cannot claim someone else’s application." /> : null}
        <ul className="space-y-3">
          {(state.data ?? []).map((item) => (
            <li key={item.id}>
              <AppLink className="block rounded-md border border-line bg-surface p-4" href={`/candidate/applications/${item.id}`}>
                <span className="text-xl">{item.jobTitle}</span>
                <span className="mt-1 block text-sm text-muted">{item.companyName} · {item.label} · {when(item.submittedAt)}</span>
              </AppLink>
            </li>
          ))}
        </ul>
      </main>
    </Gate>
  );
}
