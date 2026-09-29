import { useEffect, useRef } from "react";
import { noteLiveSignal } from "@/server/talent.functions";
import { clipSignalText, type LiveSignalKind } from "@/domain/live-watch";

/** The candidate's browser reports screens, focus, and clipboard. The interviewer reads the stored notes. */
export function useCandidateSignals(token: string, enabled: boolean) {
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const recent = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) return;
    let gone = false;
    function send(kind: LiveSignalKind, detail: string) {
      if (gone) return;
      const text = clipSignalText(detail);
      const key = `${kind}:${text}`;
      const now = Date.now();
      if (now - (recent.current[key] ?? 0) < 2000) return;
      recent.current[key] = now;
      void noteLiveSignal({ data: { token: tokenRef.current, kind, detail: text } }).catch(() => undefined);
    }
    function screenLine(count: number | null, extended: boolean | null): string {
      if (count != null && count > 1) return `${count} screens connected.`;
      if (count === 1) return "1 screen connected.";
      if (extended) return "More than one screen is connected. This browser did not give the exact count.";
      if (extended === false) return "1 screen connected.";
      return "This browser does not report how many screens are connected.";
    }
    async function screens() {
      const extended = "isExtended" in screen ? Boolean((screen as Screen & { isExtended?: boolean }).isExtended) : null;
      const host = window as unknown as {
        getScreenDetails?: () => Promise<{ screens: unknown[]; addEventListener?: (type: string, fn: () => void) => void }>;
      };
      if (host.getScreenDetails) {
        try {
          const details = await host.getScreenDetails();
          send("SCREENS", screenLine(details.screens?.length ?? null, extended));
          details.addEventListener?.("screenschange", () => {
            send("SCREENS", screenLine(details.screens?.length ?? null, extended));
          });
          return;
        } catch {
          // The browser refused the screen list. Fall through to the yes/no flag.
        }
      }
      send("SCREENS", screenLine(null, extended));
    }
    void screens();

    function hidden() {
      if (document.visibilityState === "hidden") send("LEFT_APP", "The page was hidden.");
      else send("RETURNED", "The page is visible.");
    }
    function blur() {
      window.setTimeout(() => {
        if (gone || document.visibilityState === "hidden") return;
        send("LEFT_WINDOW", "The window lost focus.");
      }, 300);
    }
    function onCopy() {
      send("COPY", window.getSelection?.()?.toString() ?? "");
    }
    function onPaste(event: ClipboardEvent) {
      send("PASTE", event.clipboardData?.getData("text/plain") ?? "");
    }
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", blur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", blur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [enabled, token]);
}
