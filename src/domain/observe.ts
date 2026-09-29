export const ERROR_BUFFER_LIMIT = 20;

export type ErrorSource = "router" | "window" | "promise" | "server" | "manual";

export type ObservedError = {
  id: string;
  at: string;
  source: ErrorSource;
  name: string;
  message: string;
};

export type ErrorSink = (event: ObservedError & { error: unknown }) => void;

export function describeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: redactMessage(error.message || "Unknown error"),
    };
  }
  if (typeof error === "string") return { name: "Error", message: redactMessage(error) };
  return { name: "Error", message: "Unknown error" };
}

/** Drop emails, bearer tokens, and DSN-shaped URLs before anything is shown or stored. */
export function redactMessage(input: string): string {
  return input
    .replace(/https?:\/\/[^\s@]+@[^\s/]+\/\d+/gi, "[dsn]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(?:password|secret|token|dsn)=([^\s&]+)/gi, (match) => match.slice(0, match.indexOf("=") + 1) + "[redacted]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function rememberError(buffer: ObservedError[], event: ObservedError): ObservedError[] {
  const next = [...buffer, event];
  return next.length > ERROR_BUFFER_LIMIT ? next.slice(next.length - ERROR_BUFFER_LIMIT) : next;
}
