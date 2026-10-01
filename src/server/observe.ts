import { describeError, publicHealthError, rememberError, type ErrorSink, type ObservedError } from "@/domain/observe";

const buffer: ObservedError[] = [];
let sink: ErrorSink | null = null;
let sequence = 0;

/** Same hook as the browser. Pass Sentry.captureException here after the SDK is added. */
export function setServerErrorSink(next: ErrorSink | null) {
  sink = next;
}

export function reportServerError(error: unknown) {
  const described = describeError(error);
  const event: ObservedError = {
    id: `s${++sequence}`,
    at: new Date().toISOString(),
    source: "server",
    name: described.name,
    message: described.message || "Unknown error",
  };
  const next = rememberError(buffer, event);
  buffer.splice(0, buffer.length, ...next);
  if (!sink) return;
  try {
    sink({ ...event, error });
  } catch {
    // A broken sink must not replace the original failure.
  }
}

export async function healthSnapshot() {
  let ready = false;
  let database = "unchecked";
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`select 1 as ok`;
    ready = true;
    database = "ok";
  } catch (error) {
    database = "down";
    reportServerError(error);
  }
  const dsn = process.env.SENTRY_DSN?.trim() || process.env.VITE_SENTRY_DSN?.trim() || "";
  return {
    service: "recruit4us",
    live: true,
    ready,
    database,
    checkedAt: new Date().toISOString(),
    errors: {
      captured: buffer.length,
      last: publicHealthError(buffer.at(-1)),
    },
    sentry: {
      dsn: dsn.length > 0,
      sink: sink !== null,
    },
  };
}
