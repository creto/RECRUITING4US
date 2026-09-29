import { describeError, rememberError, type ErrorSink, type ErrorSource, type ObservedError } from "@/domain/observe";

const buffer: ObservedError[] = [];
let sink: ErrorSink | null = null;
let sequence = 0;

/**
 * Sentry is not installed. When you add it, init the SDK and then:
 *   setErrorSink((event) => Sentry.captureException(event.error))
 * Leave this function as the only place the product reports errors.
 */
export function setErrorSink(next: ErrorSink | null) {
  sink = next;
}

export function errorSinkConnected() {
  return sink !== null;
}

export function sentryDsnPresent() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  return typeof dsn === "string" && dsn.trim().length > 0;
}

export function reportClientError(error: unknown, source: ErrorSource) {
  const described = describeError(error);
  const event: ObservedError = {
    id: `c${++sequence}`,
    at: new Date().toISOString(),
    source,
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

export function clientErrors(): ObservedError[] {
  return [...buffer];
}
