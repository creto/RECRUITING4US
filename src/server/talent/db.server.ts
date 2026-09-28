import { createHash, timingSafeEqual } from "node:crypto";
import { getSql, withTransaction, type Sql } from "@/lib/db";
import {
  isRole,
  normalizeEmail,
  roleHas,
  type Permission,
  type Role,
} from "@/domain/rules";

export async function db(): Promise<Sql> {
  return getSql();
}

export { withTransaction };

export function nid(): string {
  return crypto.randomUUID();
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function canonical(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) out[key] = sortJson(record[key]);
    return out;
  }
  return value;
}

export function json(value: unknown): string {
  return JSON.stringify(value);
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function mapDbError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("duplicate") || lower.includes("unique") || message.includes("23505")) {
    throw new Error("That record already exists.");
  }
  if (lower.includes("foreign key") || message.includes("23503")) {
    throw new Error("That change conflicts with related records.");
  }
  if (lower.includes("check constraint") || message.includes("23514")) {
    throw new Error("That value is not allowed.");
  }
  console.error("talentflow db", message.slice(0, 240));
  throw new Error("Could not save that change.");
}

export type Actor = {
  userId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  membershipId: string;
  companyId: string;
  companyName: string;
  slug: string;
  timezone: string;
  role: Role;
  retentionDays: number;
  demo: boolean;
};

type UserRow = { id: string; email: string; name: string; email_verified: boolean };

export async function requireUser(userId: string): Promise<UserRow & { emailNormalized: string }> {
  const sql = await db();
  const rows = await sql<UserRow>`
    select id, email, name, "emailVerified" as email_verified
    from "user" where id = ${userId}
  `;
  const user = rows[0];
  if (!user?.email) throw new Error("You need to sign in again.");
  return { ...user, emailNormalized: normalizeEmail(user.email) };
}

const actorCache = new Map<string, { at: number; actor: Actor }>();
const actorPending = new Map<string, Promise<Actor>>();

export function requireActor(userId: string, slug: string): Promise<Actor> {
  const key = `${userId}\n${slug}`;
  const hit = actorCache.get(key);
  if (hit && Date.now() - hit.at < 2000) return Promise.resolve(hit.actor);
  const pending = actorPending.get(key);
  if (pending) return pending;
  const promise = loadActor(userId, slug).then(
    (actor) => {
      actorCache.set(key, { at: Date.now(), actor });
      actorPending.delete(key);
      return actor;
    },
    (error: unknown) => {
      actorPending.delete(key);
      throw error;
    },
  );
  actorPending.set(key, promise);
  return promise;
}

async function loadActor(userId: string, slug: string): Promise<Actor> {
  const user = await requireUser(userId);
  const sql = await db();
  const rows = await sql<{
    membership_id: string;
    role: string;
    company_id: string;
    name: string;
    slug: string;
    timezone: string;
    retention_days: number;
    demo: boolean;
  }>`
    select m.id as membership_id, m.role, c.id as company_id, c.name, c.slug, c.timezone,
           c.retention_days, c.demo
    from memberships m
    join companies c on c.id = m.company_id
    where c.slug = ${slug} and m.user_id = ${userId} and m.status = 'ACTIVE' and c.status = 'ACTIVE'
  `;
  const row = rows[0];
  if (!row || !isRole(row.role)) throw new Error("You do not have access to this company.");
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    emailVerified: Boolean(user.email_verified),
    membershipId: row.membership_id,
    companyId: row.company_id,
    companyName: row.name,
    slug: row.slug,
    timezone: row.timezone,
    role: row.role,
    retentionDays: row.retention_days,
    demo: row.demo,
  };
}

export function allow(actor: Actor, permission: Permission) {
  if (!roleHas(actor.role, permission)) {
    throw new Error("You do not have permission to do that.");
  }
}

export async function audit(
  actor: Pick<Actor, "companyId" | "userId"> | { companyId: string; userId: string | null },
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
) {
  const sql = await db();
  await sql`
    insert into audit_events (id, company_id, actor_user_id, action, entity_type, entity_id, summary)
    values (${nid()}, ${actor.companyId}, ${actor.userId}, ${action}, ${entityType}, ${entityId}, ${summary.slice(0, 400)})
  `;
}

export async function enqueue(
  companyId: string,
  eventType: string,
  aggregateId: string,
  payload: unknown,
  depth = 0,
) {
  const sql = await db();
  const eventId = nid();
  await sql`
    insert into outbox_events (id, company_id, event_type, aggregate_id, payload, depth)
    values (${eventId}, ${companyId}, ${eventType}, ${aggregateId}, ${json(payload)}::jsonb, ${depth})
  `;
  return eventId;
}

export async function dbNow(): Promise<Date> {
  const sql = await db();
  const rows = await sql<{ now_iso: string }>`
    select to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as now_iso
  `;
  return new Date(rows[0]!.now_iso);
}

export const ISO = {
  at: "to_char(created_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')",
};

export function iso(column: string): string {
  if (!/^[a-z0-9_.]+$/i.test(column)) throw new Error("Bad column");
  return `to_char(${column} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
}
