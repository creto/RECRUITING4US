import { createFileRoute } from "@tanstack/react-router";
import { bookSlot, readBooking, rescheduleSlot } from "@/server/talent.functions";
import { Alert, Button, Gate, Loading, PageTitle, refreshPage, useAuthed, when } from "@/components/talent/kit";
import { useState } from "react";

export const Route = createFileRoute("/book/$token")({ component: Book });

function Book() {
  const { token } = Route.useParams();
  const state = useAuthed(() => readBooking({ data: { token } }), [token]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-xl px-4 py-8">
        <PageTitle title={state.data?.title || "Pick a time"} lede={`Times are shown in ${state.data?.timezone ?? "the interview timezone"}. Booking one slot closes it for everyone else.`} />
        {state.loading ? <Loading /> : null}
        {state.error ? <Alert>{state.error}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
        {done ? <p className="text-sm">{done}</p> : null}
        {state.data?.mine ? <p className="mb-3 text-sm">You already hold {when(state.data.mine.starts_at, state.data.timezone)}. Choosing another time moves that booking. A provider failure is shown and does not pretend the outside calendar moved.</p> : null}
        <ul className="space-y-2">
          {(state.data?.slots ?? []).map((slot: any) => (
            <li key={slot.id}>
              <Button type="button" variant="secondary" onClick={() => {
                const action = state.data?.mine ? rescheduleSlot({ data: { token, slotId: slot.id } }) : bookSlot({ data: { token, slotId: slot.id } });
                action.then((row) => setDone(`${row.status ?? "BOOKED"}: ${row.detail}`)).catch((err: Error) => setError(err.message)).finally(() => refreshPage());
              }}>{when(slot.starts_at, state.data?.timezone)}</Button>
            </li>
          ))}
        </ul>
      </main>
    </Gate>
  );
}
