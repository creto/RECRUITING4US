/** Interprets an authorized job-board HTTP response. A sandbox board never reaches this. */
export function interpretBoardResponse(status: number, body: string): { status: string; externalId: string; detail: string } {
  let parsed: { id?: string; error?: string } = {};
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    parsed = {};
  }
  if (status >= 200 && status < 300) {
    return {
      status: "PUBLISHED",
      externalId: String(parsed.id ?? "").slice(0, 120),
      detail: "The configured job board accepted the posting. This is not LinkedIn unless that board was the configured destination.",
    };
  }
  if (status === 404) return { status: "UNPUBLISHED", externalId: "", detail: "The board said the posting is gone." };
  return { status: "FAILED", externalId: "", detail: (parsed.error || `The board returned ${status}.`).slice(0, 300) };
}

export function interpretCalendarWrite(status: number, body: string): { ok: boolean; externalId: string; detail: string } {
  let parsed: { id?: string; error?: string } = {};
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    parsed = {};
  }
  if (status >= 200 && status < 300) {
    return { ok: true, externalId: String(parsed.id ?? "").slice(0, 120), detail: "The calendar provider accepted the event." };
  }
  return { ok: false, externalId: "", detail: (parsed.error || `Calendar provider returned ${status}. The local booking was kept.`).slice(0, 300) };
}

export function interpretHrisPush(status: number, body: string): { status: "PUSHED" | "FAILED"; detail: string } {
  if (status >= 200 && status < 300) return { status: "PUSHED", detail: "The HR system accepted the handoff. Acceptance is not proof the person is employed." };
  let detail = `HR system returned ${status}.`;
  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (parsed.error) detail = parsed.error;
  } catch {
    /* keep status detail */
  }
  return { status: "FAILED", detail: detail.slice(0, 300) };
}

export function googleAuthUrl(input: { clientId: string; redirectUri: string; state: string }): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function parseOAuthToken(status: number, body: string): { ok: true; accessToken: string; refreshToken: string; expiresIn: number } | { ok: false; error: string } {
  if (status < 200 || status >= 300) return { ok: false, error: "The token endpoint refused the refresh." };
  try {
    const parsed = JSON.parse(body) as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!parsed.access_token) return { ok: false, error: "The token response had no access token." };
    return {
      ok: true,
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token ?? "",
      expiresIn: Number(parsed.expires_in ?? 3600),
    };
  } catch {
    return { ok: false, error: "The token response was not JSON." };
  }
}

export function calendarTokenForm(input: { code?: string; refreshToken?: string; clientId: string; clientSecret: string; redirectUri: string }): string {
  const body = new URLSearchParams();
  if (input.refreshToken) {
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", input.refreshToken);
  } else {
    body.set("grant_type", "authorization_code");
    body.set("code", input.code ?? "");
    body.set("redirect_uri", input.redirectUri);
  }
  body.set("client_id", input.clientId);
  body.set("client_secret", input.clientSecret);
  return body.toString();
}

export function calendarSetupCopy(input: { vendor: boolean; oauthClient: boolean }): string[] {
  return [
    "An ICS download is a file, not a calendar connection.",
    input.vendor
      ? "A vendor URL and bearer token are set. Pushes can still fail and stay SYNC_FAILED until retry."
      : "Set CALENDAR_VENDOR_URL to an https endpoint and CALENDAR_REFRESH_TOKEN. Until then, bookings stay in this workspace.",
    input.oauthClient
      ? "Google client id is set. Finish connect with the authorization code. The refresh token is stored on the company connection and is not returned to the browser. A live Google calendar has not been verified in this workspace unless that exchange succeeded."
      : "Google Calendar is not connected. Set GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and CALENDAR_REDIRECT_URI to start OAuth. Do not mark it connected before that.",
  ];
}

export function integrationHealth(env: {
  smtpHost: boolean;
  mailFrom: boolean;
  inboundSecret: boolean;
  calendarVendor: boolean;
  calendarToken: boolean;
  jobBoard: boolean;
  hris: boolean;
  unshare: boolean;
}): { name: string; state: string }[] {
  return [
    {
      name: "Email",
      state: env.smtpHost && env.mailFrom
        ? "SMTP adapter is configured. A 250 is accepted, not delivered, until a provider event arrives."
        : "External delivery is blocked. Messages are stored in the workspace mailbox. Set MAIL_SMTP_HOST, MAIL_SMTP_PORT, MAIL_FROM, and optional MAIL_SMTP_USER / MAIL_SMTP_PASSWORD.",
    },
    {
      name: "Inbound mail",
      state: env.inboundSecret
        ? "Inbound webhook signature check is on."
        : "Blocked. Set MAIL_INBOUND_SECRET. Unsigned events are refused and not stored.",
    },
    {
      name: "Code judge",
      state: env.unshare
        ? "JavaScript runs in a user, mount, pid, and network namespace, with Node's permission model, a 64 MB heap, and a CPU cap. Host files and secrets are not visible. This is not a hypervisor."
        : "Isolation tool is missing. Candidate code is not executed.",
    },
    {
      name: "Calendar",
      state: env.calendarVendor && env.calendarToken
        ? "A calendar vendor URL and token are set. Bookings are pushed. ICS remains available."
        : "No calendar provider is connected. Bookings stay here. Set CALENDAR_VENDOR_URL and CALENDAR_REFRESH_TOKEN. Google OAuth is not completed.",
    },
    {
      name: "Job board",
      state: env.jobBoard
        ? "One JSON job-board endpoint is configured. The sandbox board is separate and is not that provider."
        : "No external board is connected. LinkedIn is not connected. The sandbox board is labeled and stays inside this workspace.",
    },
    {
      name: "HRIS",
      state: env.hris
        ? "An HR endpoint is configured. Pushes are idempotent. A download remains available."
        : "No HR system is connected. The handoff is a download, not a push.",
    },
  ];
}
