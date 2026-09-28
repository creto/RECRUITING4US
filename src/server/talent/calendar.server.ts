import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { calendarSetupCopy, calendarTokenForm, googleAuthUrl, interpretCalendarWrite, parseOAuthToken } from "@/domain/platform/adapters";
import { moveBooking } from "@/domain/platform/booking";
import { enterTenant } from "@/lib/tenant";
import { postForm, postJson } from "./outbound.server";
import { audit, db, requireActor, requireUser } from "./db.server";

type PushResult = { provider: string; externalId: string; status: string; detail: string };

function vendorUrl(): string {
  return process.env.CALENDAR_VENDOR_URL?.trim() ?? "";
}

export function calendarPublicSetup(): { steps: string[]; authUrl: string; oauthReady: boolean } {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ?? "";
  const redirect = process.env.CALENDAR_REDIRECT_URI?.trim() ?? "";
  const oauthReady = Boolean(clientId && process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim());
  return {
    steps: calendarSetupCopy({ vendor: Boolean(vendorUrl() && process.env.CALENDAR_REFRESH_TOKEN), oauthClient: oauthReady }),
    authUrl: clientId && redirect ? googleAuthUrl({ clientId, redirectUri: redirect, state: "calendar" }) : "",
    oauthReady,
  };
}

async function bearer(companyId: string): Promise<string> {
  const envToken = process.env.CALENDAR_REFRESH_TOKEN?.trim() ?? "";
  if (envToken) return envToken;
  const sql = await db();
  const rows = await sql<{ access_token: string; refresh_token: string; access_expires_at: string | null; status: string }>`
    select access_token, refresh_token, access_expires_at::text as access_expires_at, status
    from calendar_connections where company_id = ${companyId} and provider = 'external'
  `;
  const row = rows[0];
  if (!row || row.status === "REVOKED" || !row.access_token) return "";
  const expired = row.access_expires_at ? new Date(row.access_expires_at).getTime() < Date.now() + 30_000 : false;
  if (!expired) return row.access_token;
  if (!row.refresh_token) return "";
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ?? "";
  const secret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ?? "";
  const tokenUrl = process.env.CALENDAR_TOKEN_URL?.trim() || "https://oauth2.googleapis.com/token";
  if (!clientId || !secret) return "";
  try {
    const response = await postForm(tokenUrl, calendarTokenForm({ refreshToken: row.refresh_token, clientId, clientSecret: secret, redirectUri: "" }));
    const parsed = parseOAuthToken(response.status, response.body);
    if (!parsed.ok) {
      await sql`
        update calendar_connections set status = 'RECONNECT', detail = ${"The refresh was refused. Bookings stay here. Reconnect the calendar."}
        where company_id = ${companyId} and provider = 'external'
      `;
      return "";
    }
    const nextRefresh = parsed.refreshToken || row.refresh_token;
    await sql`
      update calendar_connections
      set access_token = ${parsed.accessToken}, refresh_token = ${nextRefresh}, access_expires_at = now() + make_interval(secs => ${parsed.expiresIn}), status = 'CONNECTED', refreshed_at = now()
      where company_id = ${companyId} and provider = 'external'
    `;
    return parsed.accessToken;
  } catch {
    return "";
  }
}

export async function pushCalendar(companyId: string, body: { idempotencyKey: string; title: string; startsAt: string; endsAt: string; action: string }): Promise<PushResult> {
  const url = vendorUrl();
  const token = await bearer(companyId);
  if (!url || !token) {
    return {
      provider: "sandbox",
      externalId: "",
      status: "CONFIRMED",
      detail: "Stored in this workspace. No outside calendar was changed. An ICS file is still available from Interviews.",
    };
  }
  try {
    const response = await postJson(url, token, body);
    const written = interpretCalendarWrite(response.status, response.body);
    return {
      provider: "external",
      externalId: written.externalId,
      status: written.ok ? "CONFIRMED" : "SYNC_FAILED",
      detail: written.detail,
    };
  } catch (error) {
    return {
      provider: "external",
      externalId: "",
      status: "SYNC_FAILED",
      detail: error instanceof Error ? error.message : "The calendar provider could not be reached. The time is still held here.",
    };
  }
}

export async function retryCalendarEvent(userId: string, slug: string, eventId: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  const sql = await db();
  const rows = await sql<{ id: string; title: string; starts_at: string; ends_at: string; status: string; slot_id: string | null }>`
    select id, title, starts_at::text as starts_at, ends_at::text as ends_at, status, slot_id
    from calendar_events where company_id = ${actor.companyId} and id = ${eventId}
  `;
  const row = rows[0];
  if (!row) throw new Error("That calendar event is not in this company.");
  const pushed = await pushCalendar(actor.companyId, {
    idempotencyKey: row.slot_id || row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    action: "update",
  });
  await sql`
    update calendar_events set provider = ${pushed.provider}, external_id = ${pushed.externalId}, status = ${pushed.status}, detail = ${pushed.detail}
    where company_id = ${actor.companyId} and id = ${row.id}
  `;
  await audit(actor, "calendar.retry", "calendar_event", row.id, pushed.status);
  return { status: pushed.status, detail: pushed.detail };
}

export async function rescheduleSlot(userId: string, token: string, slotId: string) {
  assertSameSiteRequest();
  const user = await requireUser(userId);
  const sql = await db();
  const found = await sql.query<{ company_id: string | null }>("select app_company_for_booking($1) as company_id", [token]);
  const companyId = found[0]?.company_id;
  if (!companyId) throw new Error("This scheduling link is not valid.");
  enterTenant({ userId: user.id, companyId });
  const links = await sql<{ id: string; title: string; status: string }>`
    select id, title, status from booking_links where company_id = ${companyId} and token = ${token}
  `;
  const link = links[0];
  if (!link || link.status !== "OPEN") throw new Error("This scheduling link is closed.");
  const held = await sql<{ id: string; status: string }>`
    select id, status from booking_slots
    where company_id = ${companyId} and link_id = ${link.id} and held_by = ${user.emailNormalized} and status = 'BOOKED'
    order by starts_at desc limit 1
  `;
  const current = held[0];
  if (!current) throw new Error("Book a time before moving it.");
  const target = await sql<{ id: string; status: string; starts_at: string; ends_at: string }>`
    select id, status, starts_at::text as starts_at, ends_at::text as ends_at
    from booking_slots where company_id = ${companyId} and link_id = ${link.id} and id = ${slotId}
  `;
  const next = target[0];
  if (!next) throw new Error("That time is not on this link.");
  const decision = moveBooking({ fromStatus: current.status, toStatus: next.status, samePerson: true });
  if (!decision.ok) throw new Error(decision.error);
  const claimed = await sql<{ id: string }>`
    update booking_slots set status = 'BOOKED', held_by = ${user.emailNormalized}
    where company_id = ${companyId} and id = ${next.id} and status = 'OPEN'
    returning id
  `;
  if (!claimed[0]) throw new Error("That time was just taken. Pick another.");
  const released = await sql<{ id: string }>`
    update booking_slots set status = 'OPEN', held_by = ''
    where company_id = ${companyId} and id = ${current.id} and held_by = ${user.emailNormalized} and status = 'BOOKED'
    returning id
  `;
  if (!released[0]) {
    await sql`
      update booking_slots set status = 'OPEN', held_by = ''
      where company_id = ${companyId} and id = ${next.id} and held_by = ${user.emailNormalized}
    `;
    throw new Error("The previous booking could not be released. The new time was put back.");
  }
  const pushed = await pushCalendar(companyId, {
    idempotencyKey: `${current.id}:move:${next.id}`,
    title: link.title,
    startsAt: next.starts_at,
    endsAt: next.ends_at,
    action: "update",
  });
  await sql`
    insert into calendar_events (id, company_id, slot_id, provider, external_id, status, title, starts_at, ends_at, detail)
    values (${crypto.randomUUID()}, ${companyId}, ${next.id}, ${pushed.provider}, ${pushed.externalId}, ${pushed.status}, ${link.title}, ${next.starts_at}, ${next.ends_at}, ${pushed.detail})
  `;
  return { booked: true, startsAt: next.starts_at, status: pushed.status, detail: pushed.detail };
}

export async function finishCalendarConnect(userId: string, slug: string, code: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ?? "";
  const secret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ?? "";
  const redirect = process.env.CALENDAR_REDIRECT_URI?.trim() ?? "";
  if (!clientId || !secret || !redirect) {
    return {
      connected: false,
      blocked: true,
      detail: "Google OAuth is not configured. Set GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and CALENDAR_REDIRECT_URI. No token was stored.",
    };
  }
  const tokenUrl = process.env.CALENDAR_TOKEN_URL?.trim() || "https://oauth2.googleapis.com/token";
  const response = await postForm(tokenUrl, calendarTokenForm({ code: code.trim(), clientId, clientSecret: secret, redirectUri: redirect }));
  const parsed = parseOAuthToken(response.status, response.body);
  if (!parsed.ok) return { connected: false, blocked: true, detail: parsed.error };
  const sql = await db();
  const detail = vendorUrl()
    ? "OAuth token stored for this company. Pushes use CALENDAR_VENDOR_URL. The token is not shown again."
    : "OAuth token stored. Set CALENDAR_VENDOR_URL before events can be created. Nothing has been pushed. The token is not shown again.";
  await sql`
    insert into calendar_connections (id, company_id, provider, status, secret_ref, detail, user_id, access_token, refresh_token, access_expires_at, refreshed_at)
    values (
      ${crypto.randomUUID()}, ${actor.companyId}, 'external', ${vendorUrl() ? "CONNECTED" : "RECONNECT"},
      'oauth', ${detail}, ${actor.userId}, ${parsed.accessToken}, ${parsed.refreshToken}, now() + make_interval(secs => ${parsed.expiresIn}), now()
    )
    on conflict (company_id, provider) do update set
      status = excluded.status, detail = excluded.detail, user_id = excluded.user_id,
      access_token = excluded.access_token, refresh_token = excluded.refresh_token,
      access_expires_at = excluded.access_expires_at, refreshed_at = now()
  `;
  await audit(actor, "calendar.connect", "calendar_connection", actor.companyId, "OAuth token stored");
  return { connected: Boolean(vendorUrl()), blocked: !vendorUrl(), detail };
}

export async function revokeCalendar(userId: string, slug: string) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, slug);
  const sql = await db();
  await sql`
    update calendar_connections
    set status = 'REVOKED', access_token = '', refresh_token = '', access_expires_at = null,
        detail = 'Disconnected. Existing bookings stay here. No further pushes use the stored token.'
    where company_id = ${actor.companyId} and provider = 'external'
  `;
  await audit(actor, "calendar.revoke", "calendar_connection", actor.companyId, "REVOKED");
  return { status: "REVOKED" };
}
