export function campaignAfterReply(status: string): "REPLIED" | "STOPPED" | "SENT" | "QUEUED" | "BOUNCED" {
  if (status === "REPLIED" || status === "STOPPED" || status === "BOUNCED") return status;
  return "REPLIED";
}

export function campaignAfterBounce(status: string): "BOUNCED" | "STOPPED" | "REPLIED" {
  if (status === "STOPPED" || status === "REPLIED") return status;
  return "BOUNCED";
}

export function canConvert(consent: string): { ok: true } | { ok: false; error: string } {
  if (consent === "YES") return { ok: true };
  return { ok: false, error: "This person has not agreed to be contacted as an applicant." };
}

export const BOARDS = ["sandbox-board", "careers-page"] as const;

export function boardStatus(board: string, configured: boolean, action: "publish" | "unpublish"): { status: string; detail: string } {
  if (board === "careers-page") {
    return action === "publish"
      ? { status: "PUBLISHED", detail: "The job stays on this company's careers page." }
      : { status: "UNPUBLISHED", detail: "Unpublishing a job is done from the job editor. This record notes the request." };
  }
  if (board === "sandbox-board") {
    return action === "publish"
      ? { status: "PUBLISHED", detail: "Published on the sandbox board inside this workspace. No outside job board was called." }
      : { status: "UNPUBLISHED", detail: "Removed from the sandbox board. No outside job board was called." };
  }
  if (!configured) {
    return { status: "CONFIG_REQUIRED", detail: `${board} is not connected. Nothing was published.` };
  }
  return { status: "FAILED", detail: `${board} has no adapter in this workspace.` };
}
