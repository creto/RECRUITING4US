/**
 * Synthetic data helpers shared by the Interviews, Schedule and Offers
 * illustrations. Nothing here talks to the product; the week, the event and
 * the ranking are demo values generated in the browser.
 */

/** Bogotá has no daylight saving time: UTC-5 all year. */
const BOGOTA_OFFSET_H = 5;
export const SLOT_MINUTES = 45;

/** Monday to Friday of next week, at local midnight. */
export function demoWeek(from = new Date()): Date[] {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const dow = d.getDay(); // 0 = Sunday
  const toNextMonday = ((8 - dow) % 7) || 7;
  d.setDate(d.getDate() + toNextMonday);
  return Array.from({ length: 5 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i));
}

const dayFmt = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const shortFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" });

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const longDay = (d: Date) => capitalise(dayFmt.format(d));
export const shortDay = (d: Date) => shortFmt.format(d);

/** "10:30" on a given day, as an absolute UTC instant (Bogotá wall clock). */
export function slotInstant(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h + BOGOTA_OFFSET_H, m));
}

export function addMinutes(d: Date, min: number) {
  return new Date(d.getTime() + min * 60_000);
}

/** 20261006T153000Z */
const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** RFC 5545 §3.1: lines longer than 75 octets continue on a line starting with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder();
  const parts: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (bytes.encode(cur + ch).length > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = "";
    }
    cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

type EventInput = { uid: string; sequence: number; start: Date; minutes: number; title: string; details: string; location: string };

/** A real RFC 5545 calendar file for the demo event. */
export function buildIcs(e: EventInput): string {
  const end = addMinutes(e.start, e.minutes);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RECRUIT4US//Sitio de demostracion//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `SEQUENCE:${e.sequence}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(e.start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `DESCRIPTION:${icsEscape(e.details)}`,
    `LOCATION:${icsEscape(e.location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}

export function downloadIcs(e: EventInput, filename = "entrevista-demostracion.ics") {
  const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** calendar.google.com template deep link (what the product builds too). */
export function googleCalendarUrl(e: Omit<EventInput, "uid" | "sequence">): string {
  const end = addMinutes(e.start, e.minutes);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${icsStamp(e.start)}/${icsStamp(end)}`,
    details: e.details,
    location: e.location,
    ctz: "America/Bogota",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/* ------------------------------------------------------------- ranking */

export type Row = { name: string; recs: number[]; yours?: boolean };
export type Ranked = Row & { avg: number; place: number; tie: boolean };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Order by average overall recommendation; equal averages share a place. */
export function rank(rows: Row[]): Ranked[] {
  const withAvg = rows.map((r) => ({ ...r, avg: avg(r.recs) })).sort((a, b) => b.avg - a.avg);
  return withAvg.map((r, i) => {
    const place = withAvg.findIndex((x) => Math.abs(x.avg - r.avg) < 1e-9) + 1;
    const tie = withAvg.some((x, j) => j !== i && Math.abs(x.avg - r.avg) < 1e-9);
    return { ...r, place, tie };
  });
}

export const decimal = (n: number) => n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
