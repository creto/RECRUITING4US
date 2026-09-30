import { useId, useMemo, useState, type CSSProperties } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays, Clock } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { inputClass } from "@/components/talent/kit";

const VALUE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function parseValue(raw: string | undefined): { date: Date | undefined; hour: string; minute: string } {
  if (!raw) return { date: undefined, hour: "10", minute: "00" };
  const match = VALUE_RE.exec(raw);
  if (!match) return { date: undefined, hour: "10", minute: "00" };
  const date = parse(`${match[1]}-${match[2]}-${match[3]}`, "yyyy-MM-dd", new Date());
  return {
    date: isValid(date) ? date : undefined,
    hour: match[4],
    minute: match[5],
  };
}

function toValue(date: Date | undefined, hour: string, minute: string): string {
  if (!date || !isValid(date)) return "";
  return `${format(date, "yyyy-MM-dd")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function displayLabel(value: string): string {
  const parsed = parseValue(value);
  if (!parsed.date) return "Pick date and time";
  const hour = Number(parsed.hour);
  const minute = parsed.minute;
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${format(parsed.date, "MMM d, yyyy")} · ${hour12}:${minute} ${ampm}`;
}

function formatHourLabel(hour: string): string {
  const n = Number(hour);
  const ampm = n >= 12 ? "PM" : "AM";
  const hour12 = n % 12 === 0 ? 12 : n % 12;
  return `${String(hour12).padStart(2, "0")} ${ampm}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

type Props = {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
};

/** Popup calendar + time selects; submits YYYY-MM-DDTHH:mm for schedule APIs. */
export function DateTimeLocalField({ label, name, defaultValue = "", required }: Props) {
  const uid = useId();
  const initial = useMemo(() => parseValue(defaultValue), [defaultValue]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initial.date);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(MINUTES.includes(initial.minute) ? initial.minute : "00");
  const value = toValue(date, hour, minute);

  return (
    <div className="relative block space-y-1 text-sm">
      <span className="font-medium text-ink" id={`${uid}-label`}>
        {label}
      </span>
      {/* Not type=hidden so required still participates in native form validation. */}
      <input
        name={name}
        value={value}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
        onFocus={() => setOpen(true)}
      />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`${inputClass} flex items-center justify-between gap-2 text-left ${value ? "text-ink" : "text-muted"}`}
            aria-labelledby={`${uid}-label`}
            aria-haspopup="dialog"
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <CalendarDays className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">{displayLabel(value)}</span>
            </span>
            <Clock className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            className="z-50 w-[min(100vw-2rem,20.5rem)] rounded-3xl border border-line bg-white p-3 shadow-[0_16px_40px_rgba(20,34,27,0.12)] outline-none"
            aria-labelledby={`${uid}-label`}
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(next) => {
                if (next) setDate(next);
              }}
              defaultMonth={date}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              className="mx-auto"
              style={
                {
                  "--rdp-accent-color": "#036145",
                  "--rdp-accent-background-color": "#cefa90",
                  "--rdp-today-color": "#036145",
                } as CSSProperties
              }
            />
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <Clock className="size-4 shrink-0 text-muted" aria-hidden />
              <label className="sr-only" htmlFor={`${uid}-hour`}>
                Hour
              </label>
              <select
                id={`${uid}-hour`}
                className="min-h-10 flex-1 rounded-2xl border border-line bg-white px-2 text-sm outline-none focus-visible:border-accent"
                value={hour}
                onChange={(event) => setHour(event.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHourLabel(h)}
                  </option>
                ))}
              </select>
              <span className="text-muted" aria-hidden>
                :
              </span>
              <label className="sr-only" htmlFor={`${uid}-minute`}>
                Minute
              </label>
              <select
                id={`${uid}-minute`}
                className="min-h-10 w-[4.5rem] rounded-2xl border border-line bg-white px-2 text-sm outline-none focus-visible:border-accent"
                value={minute}
                onChange={(event) => setMinute(event.target.value)}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Popover.Close asChild>
                <button
                  type="button"
                  className="min-h-10 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink"
                >
                  Cancel
                </button>
              </Popover.Close>
              <Popover.Close asChild>
                <button
                  type="button"
                  className="min-h-10 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-50"
                  disabled={!date}
                >
                  Done
                </button>
              </Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
