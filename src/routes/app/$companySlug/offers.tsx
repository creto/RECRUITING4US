import { createFileRoute } from "@tanstack/react-router";
import { listOffers } from "@/server/talent.functions";
import { Alert, Empty, Loading, PageTitle, money, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/app/$companySlug/offers")({ component: Offers });

function Offers() {
  const { companySlug } = Route.useParams();
  const state = useAuthed(() => listOffers({ data: { slug: companySlug } }), [companySlug]);
  if (state.loading || state.isPending) return <Loading />;
  if (state.error) return <Alert>{state.error}</Alert>;
  const rows = state.data ?? [];
  return (
    <div>
      <PageTitle title="Offers" lede="Sending requires an approval of the exact current revision. Editing terms later would need a new revision." />
      {rows.length === 0 ? <Empty title="No offers" body="Create one from an application." /> : null}
      <ul className="space-y-2">
        {rows.map((offer) => (
          <li key={offer.id} className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-4 text-sm">
            <span className="text-xl">{offer.candidate_name}</span>
            <span className="mt-1 block text-muted">{offer.job_title} · {offer.title} · {offer.status} · rev {offer.current_revision}</span>
            <span className="mt-1 block">{money(offer.salary_minor, offer.currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
