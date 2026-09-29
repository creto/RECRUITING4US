import { pendingMigrations } from "../../scripts/migration-plan.mjs";
import { bindQuery, currentQuery, runExclusive, type QueryFn } from "@/domain/exclusive";
import { getRequest } from "@tanstack/react-start/server";
import { bindRequestTenant, currentTenant, type TenantScope } from "@/lib/tenant";

const requestTenants = new WeakMap<object, TenantScope>();
if (typeof window === "undefined") {
  bindRequestTenant(
    () => {
      const request = getRequest();
      return request ? requestTenants.get(request) : undefined;
    },
    (scope) => {
      const request = getRequest();
      if (request) requestTenants.set(request, scope);
    },
  );
}

/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
const rawDatabaseUrl =
  typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl =
  rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;

/**
 * Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
 * sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
 * the app has a working database even with nothing configured — the live preview
 * included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
 */
export const dbSource: DbSource = databaseUrl ? "neon" : "pglite";

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __pgPool?: import("pg").Pool;
  __rawQuery?: QueryFn;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function tenantScope() {
  const tenant = currentTenant();
  return {
    companyId: tenant?.companyId ?? "",
    userId: tenant?.userId ?? "",
    publicSlug: tenant?.publicSlug ?? "",
  };
}

async function writeTenant(run: Run, local: boolean, scope: { companyId: string; userId: string; publicSlug: string }) {
  await run(
    "select set_config('app.company_id', $1, $4), set_config('app.user_id', $2, $4), set_config('app.public_slug', $3, $4)",
    [scope.companyId, scope.userId, scope.publicSlug, local],
  );
}

type Session = { query: Run; release: () => void };

let assumeAppRole: boolean | null = null;

/** Superusers bypass row security. Only they need to assume the restricted role. */
async function shouldAssumeAppRole(run: Run): Promise<boolean> {
  if (assumeAppRole !== null) return assumeAppRole;
  const rows = await run(
    `select
       coalesce((select rolsuper or rolbypassrls from pg_roles where rolname = current_user), false) as bypass,
       exists (select 1 from pg_roles where rolname = 'app_user') as has_role`,
    [],
  );
  const row = rows[0] as { bypass?: boolean; has_role?: boolean } | undefined;
  assumeAppRole = row?.bypass === true && row?.has_role === true;
  return assumeAppRole;
}

function gateRun(open: () => Promise<Session>): Run {
  return async <T>(text: string, params: unknown[]) => {
    const bound = currentQuery();
    if (bound) return bound(text, params) as Promise<T[]>;
    return runExclusive(async () => {
      const session = await open();
      try {
        await session.query("begin", []);
        if (await shouldAssumeAppRole(session.query)) await session.query("set local role app_user", []);
        await writeTenant(session.query, true, tenantScope());
        const rows = await session.query<T>(text, params);
        await session.query("commit", []);
        return rows;
      } catch (error) {
        try {
          await session.query("rollback", []);
        } catch {
          // The transaction may already be closed.
        }
        throw error;
      } finally {
        session.release();
      }
    });
  };
}
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

/**
 * Run `fn` in one database transaction. Nested calls join the open transaction.
 * Other queries wait, so a single PGLite connection is not interleaved.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (currentQuery()) return fn();
  return runExclusive(async () => {
    if (dbSource === "neon") {
      const pool = globalRef.__pgPool;
      if (!pool) throw new Error("Database is not ready.");
      const client = await pool.connect();
      const raw: QueryFn = async (text, params = []) => {
        const res = await client.query(text, params);
        return res.rows;
      };
      try {
        await raw("BEGIN");
        if (await shouldAssumeAppRole(raw as Run)) await raw("set local role app_user");
        await writeTenant(raw as Run, true, tenantScope());
        const result = await bindQuery(raw, fn);
        await raw("COMMIT");
        return result;
      } catch (error) {
        await raw("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
    const raw = globalRef.__rawQuery;
    if (!raw) throw new Error("Database is not ready.");
    await raw("BEGIN");
    try {
      if (await shouldAssumeAppRole(raw as Run)) await raw("set local role app_user");
      await writeTenant(raw as Run, true, tenantScope());
      const result = await bindQuery(raw, fn);
      await raw("COMMIT");
      return result;
    } catch (error) {
      await raw("ROLLBACK");
      throw error;
    }
  });
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
    // pooled endpoint. One pool per process; warm serverless instances reuse it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString: databaseUrl });
    globalRef.__pgPool = pool;
    return toSql(gateRun(async () => {
      const client = await pool.connect();
      return {
        query: async <T>(text: string, params: unknown[]) => {
          const res = await client.query(text, params);
          return res.rows as T[];
        },
        release: () => client.release(),
      };
    }));
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function createPgliteSql(): Promise<Sql> {
  // Embedded Postgres, imported on demand so it never loads on the Neon path.
  // One in-memory instance per process, shared across HMR module instances, so
  // data survives source edits (it resets on dev-server restart).
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  // Apply migrations/ (the single schema source) so preview matches production.
  // SQL is inlined by the bundler via import.meta.glob (no runtime fs). A new
  // file, including the gap-closure migration, is applied on the next reload.
  // Applied files are tracked in _migrations. The glob does not descend, so the
  // opt-in auth schema under migrations/auth/ stays out. Passes are serialized
  // so concurrent callers never double-apply.
  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
      // statement can't leave a file half-applied but untracked.
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  globalRef.__rawQuery = async (text, params = []) => {
    const result = await pg.query(text, params);
    return result.rows;
  };

  return toSql(gateRun(async () => ({
    query: async <T>(text: string, params: unknown[]) => {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
    release: () => undefined,
  })));
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}

/**
 * Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
 * otherwise the local PGLite fallback. Memoized — safe to call per request.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * both backends — define tables there, never inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}

/**
 * The shared PGLite instance (preview only), with `migrations/*.sql` applied.
 * Lets Better Auth persist to the SAME embedded DB as app data in preview (via a
 * Kysely dialect). Throws when `DATABASE_URL` is set (that path uses Neon).
 */
export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (dbSource !== "pglite") {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap before the server handles traffic.
 *
 * - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
 *   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
 * - **Neon**: no-op (pool is created lazily on first query).
 *
 * Vite `configureServer` awaits this at dev startup; production imports of this
 * module kick it off immediately (see bottom of file).
 */
export function ensureDbReady(): Promise<void> {
  if (dbSource !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}

// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && dbSource === "pglite" && typeof import.meta.glob === "function") {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}
