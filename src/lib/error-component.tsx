import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { reportClientError } from "@/lib/observe";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => {
    reportClientError(error, "router");
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f4f7f5] px-6 text-center text-[#17211c]">
      <span className="text-[#9f1239]" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-[#44574e]">{errorMessage(error)}</p>
      <Link to="/status" className="mt-2 text-sm text-link">
        Health and errors
      </Link>
    </main>
  );
}

export function ObserveBoot() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError(event.error ?? event.message, "window");
    }
    function onRejection(event: PromiseRejectionEvent) {
      reportClientError(event.reason, "promise");
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
