export type SlotDraft = { startsAt: string; endsAt: string };

function partsInZone(date: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    weekday: weekdays.indexOf(bag.weekday ?? "Sun"),
  };
}

/** UTC instant whose wall clock in `timeZone` matches the given civil time. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const got = partsInZone(new Date(guess), timeZone);
    const wanted = Date.UTC(year, month - 1, day, hour, minute);
    const actual = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
    guess += wanted - actual;
  }
  return new Date(guess);
}

/**
 * Weekday slots on the hour between startHour and endHour, in the given timezone.
 * A slot that does not exist on a DST spring-forward is skipped. A repeated fall-back hour is kept once.
 */
export function buildSlots(input: {
  from: Date;
  days: number;
  timeZone: string;
  startHour: number;
  endHour: number;
  durationMin: number;
  now?: Date;
}): SlotDraft[] {
  const out: SlotDraft[] = [];
  const seen = new Set<string>();
  const now = input.now ?? new Date();
  for (let day = 0; day < input.days; day += 1) {
    const cursor = new Date(input.from.getTime() + day * 86_400_000);
    const civil = partsInZone(cursor, input.timeZone);
    if (civil.weekday === 0 || civil.weekday === 6) continue;
    for (let hour = input.startHour; hour < input.endHour; hour += 1) {
      const start = zonedTimeToUtc(civil.year, civil.month, civil.day, hour, 0, input.timeZone);
      const check = partsInZone(start, input.timeZone);
      if (check.hour !== hour || check.day !== civil.day) continue;
      const end = new Date(start.getTime() + input.durationMin * 60_000);
      if (start.getTime() <= now.getTime()) continue;
      const key = start.toISOString();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ startsAt: key, endsAt: end.toISOString() });
    }
  }
  return out;
}

export function claimSlot(status: string): { ok: true } | { ok: false; error: string } {
  if (status === "OPEN") return { ok: true };
  if (status === "BOOKED") return { ok: false, error: "That time was just taken. Pick another." };
  return { ok: false, error: "That time is not open." };
}

/** Move a booking only when this person holds it and the destination is still open. */
export function moveBooking(input: { fromStatus: string; toStatus: string; samePerson: boolean }): { ok: true } | { ok: false; error: string } {
  if (!input.samePerson) return { ok: false, error: "Only the person who booked this time can move it." };
  if (input.fromStatus !== "BOOKED") return { ok: false, error: "There is no booking to move." };
  if (input.fromStatus === "BOOKED" && input.toStatus === "BOOKED") return { ok: false, error: "That time was just taken. Pick another." };
  return claimSlot(input.toStatus);
}
