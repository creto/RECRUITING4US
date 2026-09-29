import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { bindRequestTenant, currentTenant, type TenantScope } from "../../lib/tenant.ts";
import { setTestSql } from "./db.server.ts";
import { acceptInvite, getApplication, inviteMember, listMembers, removeMember, revokeInvite } from "./workspace.server.ts";
import { listMyApplications } from "./assess.server.ts";

type Sql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

function restrictedSql(pg: PGlite): Sql {
  const run = async <T>(text: string, params: unknown[]): Promise<T[]> => {
    await pg.query("begin");
    try {
      await pg.query("set local role app_user");
      const tenant = currentTenant();
      await pg.query(
        "select set_config('app.company_id', $1, true), set_config('app.user_id', $2, true), set_config('app.public_slug', $3, true)",
        [tenant?.companyId ?? "", tenant?.userId ?? "", tenant?.publicSlug ?? ""],
      );
      const result = await pg.query<T>(text, params);
      await pg.query("commit");
      return result.rows;
    } catch (error) {
      await pg.query("rollback");
      throw error;
    }
  };
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ""}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = (text, params = []) => run(text, params);
  return sql;
}

async function boot() {
  let scope: TenantScope | undefined;
  bindRequestTenant(
    () => scope,
    (next) => {
      scope = next;
    },
  );
  const pg = new PGlite();
  await pg.waitReady;
  const dir = fileURLToPath(new URL("../../../migrations/", import.meta.url));
  const names = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of names) {
    await pg.exec(await readFile(new URL(`../../../migrations/${name}`, import.meta.url), "utf8"));
  }
  await pg.exec(`
    insert into "user" (id, name, email, "emailVerified") values
      ('owner-a', 'Owner A', 'owner-a@example.com', true),
      ('owner-b', 'Owner B', 'owner-b@example.com', true),
      ('admin-a', 'Admin A', 'admin-a@example.com', true),
      ('ivy', 'Ivy', 'ivy@example.com', true),
      ('revoked', 'Revoked', 'revoked@example.com', true),
      ('stale', 'Stale', 'stale@example.com', true),
      ('viewer', 'Viewer', 'viewer@example.com', true),
      ('ada', 'Ada', 'ada@northstar.example', true),
      ('unverified', 'Unverified', 'ada@harbor.example', false);
    insert into companies (id, name, slug, created_by) values
      ('co-a', 'Northstar', 'northstar', 'owner-a'),
      ('co-b', 'Harbor', 'harbor', 'owner-b');
    insert into memberships (id, company_id, user_id, role) values
      ('mem-owner-a', 'co-a', 'owner-a', 'OWNER'),
      ('mem-admin-a', 'co-a', 'admin-a', 'ADMIN'),
      ('mem-viewer', 'co-a', 'viewer', 'INTERVIEWER'),
      ('mem-owner-b', 'co-b', 'owner-b', 'OWNER');
    insert into jobs (id, company_id, title, slug, work_arrangement, employment_type, status) values
      ('job-a', 'co-a', 'Platform', 'platform', 'REMOTE', 'FULL_TIME', 'PUBLISHED'),
      ('job-b', 'co-b', 'Analyst', 'analyst', 'REMOTE', 'FULL_TIME', 'PUBLISHED');
    insert into pipeline_stages (id, company_id, job_id, name, category, position) values
      ('stage-a', 'co-a', 'job-a', 'Applied', 'APPLIED', 0),
      ('stage-b', 'co-b', 'job-b', 'Applied', 'APPLIED', 0);
    insert into candidates (id, company_id, name, email, email_normalized) values
      ('cand-a', 'co-a', 'Ada', 'ada@northstar.example', 'ada@northstar.example'),
      ('cand-b', 'co-b', 'Ada', 'ada@harbor.example', 'ada@harbor.example');
    insert into applications (id, company_id, job_id, candidate_id, current_stage_id) values
      ('app-a', 'co-a', 'job-a', 'cand-a', 'stage-a'),
      ('app-b', 'co-b', 'job-b', 'cand-b', 'stage-b');
    insert into interviews (id, company_id, application_id, title, starts_at, ends_at, timezone, ics_uid) values
      ('int-a', 'co-a', 'app-a', 'Screen', '2026-06-01T15:00:00Z', '2026-06-01T15:30:00Z', 'America/New_York', 'int-a@recruit4us');
    insert into interview_participants (id, company_id, interview_id, user_id) values
      ('part-a', 'co-a', 'int-a', 'viewer');
  `);
  setTestSql(restrictedSql(pg));
  return pg;
}

describe("T-AUTH", () => {
  it("covers invites, revoke, roles, and cross-tenant reads", async () => {
    const pg = await boot();

    await assert.rejects(() => getApplication("missing-user", "northstar", "app-a"), /sign in/i);
    await assert.rejects(() => getApplication("owner-a", "harbor", "app-b"), /do not have access/i);
    await assert.rejects(() => getApplication("owner-a", "northstar", "app-b"), /Not found/);
    const own = await getApplication("owner-a", "northstar", "app-a");
    assert.equal(own.application.id, "app-a");
    const packet = await getApplication("viewer", "northstar", "app-a");
    assert.equal(packet.application.id, "app-a");
    await assert.rejects(() => inviteMember("viewer", { slug: "northstar", email: "ivy@example.com", role: "RECRUITER" }), /permission/i);
    await assert.rejects(() => removeMember("viewer", { slug: "northstar", membershipId: "mem-admin-a" }), /permission/i);

    const invited = await inviteMember("owner-a", { slug: "northstar", email: "ivy@example.com", role: "RECRUITER" });
    const again = await acceptInvite("ivy", invited.token);
    assert.equal(again.slug, "northstar");
    await assert.rejects(() => acceptInvite("ivy", invited.token), /no longer be used/i);
    const members = await listMembers("owner-a", "northstar");
    assert.equal(members.members.filter((row) => row.email === "ivy@example.com" && row.status === "ACTIVE").length, 1);

    const doomed = await inviteMember("admin-a", { slug: "northstar", email: "revoked@example.com", role: "ANALYST" });
    await revokeInvite("owner-a", { slug: "northstar", inviteId: doomed.inviteId });
    await assert.rejects(() => acceptInvite("revoked", doomed.token), /no longer be used/i);
    const foreign = await inviteMember("owner-b", { slug: "harbor", email: "revoked@example.com", role: "ANALYST" });
    await revokeInvite("owner-a", { slug: "northstar", inviteId: foreign.inviteId });
    const stillOpen = await acceptInvite("revoked", foreign.token);
    assert.equal(stillOpen.slug, "harbor");

    const aging = await inviteMember("owner-a", { slug: "northstar", email: "stale@example.com", role: "RECRUITER" });
    await pg.query("update invitations set expires_at = now() - interval '1 day' where id = $1", [aging.inviteId]);
    await assert.rejects(() => acceptInvite("stale", aging.token), /expired/i);

    const ivy = members.members.find((row) => row.email === "ivy@example.com");
    assert.ok(ivy);
    await removeMember("admin-a", { slug: "northstar", membershipId: ivy.id });
    await assert.rejects(() => listMembers("ivy", "northstar"), /do not have access/i);
    await assert.rejects(() => removeMember("admin-a", { slug: "northstar", membershipId: "mem-owner-a" }), /last owner/i);

    const ada = await listMyApplications("ada");
    assert.deepEqual(ada.map((row) => row.id), ["app-a"]);
    const unverified = await listMyApplications("unverified");
    assert.deepEqual(unverified, []);

    const leaked = await pg.query("select id from applications");
    await pg.query("set role app_user");
    await pg.query("select set_config('app.company_id', '', false)");
    const hidden = await pg.query("select id from applications");
    await pg.query("reset role");
    assert.equal(leaked.rows.length, 2);
    assert.equal(hidden.rows.length, 0);

    setTestSql(null);
  });
});
