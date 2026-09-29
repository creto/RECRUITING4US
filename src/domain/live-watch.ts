export const LIVE_SIGNAL_KINDS = ["SCREENS", "LEFT_APP", "RETURNED", "LEFT_WINDOW", "COPY", "PASTE"] as const;

export type LiveSignalKind = (typeof LIVE_SIGNAL_KINDS)[number];

export function liveSignalKind(value: string): LiveSignalKind | null {
  return (LIVE_SIGNAL_KINDS as readonly string[]).includes(value) ? (value as LiveSignalKind) : null;
}

/** One line an interviewer can read. Clipboard text is shortened. Empty copy still says that a copy happened. */
export function clipSignalText(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
}

export function describeLiveSignal(kind: string, detail: string): string {
  const text = clipSignalText(detail);
  switch (kind) {
    case "SCREENS":
      return text || "Screen count was not available.";
    case "LEFT_APP":
      return "Left the page or switched tabs.";
    case "RETURNED":
      return "Came back to the page.";
    case "LEFT_WINDOW":
      return "The window lost focus.";
    case "COPY":
      return text ? `Copied: ${text}` : "Copied, but the text was not available.";
    case "PASTE":
      return text ? `Pasted: ${text}` : "Pasted, but the text was not available.";
    default:
      return "Noted.";
  }
}
