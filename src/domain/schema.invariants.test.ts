import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";

async function fresh() {
  const pg = new PGlite();
  await pg.waitReady;
  const base = await readFile(new URL("../../migrations/0002_talentflow.sql", import.meta.url), "utf8");
  const extra = await readFile(new URL("../../migrations/0003_outbox_and_question_types.sql", import.meta.url), "utf8");
  const more = await readFile(new URL("../../migrations/0004_completion.sql", import.meta.url), "utf8");
  await pg.exec(base);
  await pg.exec(extra);
  await pg.exec(more);
  await pg.exec(`
    insert into companies (id, name, slug, created_by) values
      ('co-a', 'Northstar', 'northstar', 'owner-a'),
      ('co-b', 'Harbor', 'harbor', 'owner-b');
    insert into jobs (id, company_id, title, slug, work_arrangement, employment_type, status)
      values ('job-a', 'co-a', 'Platform', 'platform', 'REMOTE', 'FULL_TIME', 'PUBLISHED');
    insert into pipeline_stages (id, company_id, job_id, name, category, position)
      values ('stage-a', 'co-a', 'job-a', 'Applied', 'APPLIED', 0);
    insert into candidates (id, company_id, name, email, email_normalized) values
      ('cand-a', 'co-a', 'Ada', 'ada@northstar.example', 'ada@northstar.example'),
      ('cand-b', 'co-b', 'Ada', 'ada@harbor.example', 'ada@harbor.example');
  `);
  return pg;
}

describe("database invariants", () => {
  it("allows one active application and rejects a second", async () => {
    const pg = await fresh();
    await pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-1', 'co-a', 'job-a', 'cand-a', 'stage-a')
    `);
    await assert.rejects(() => pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-2', 'co-a', 'job-a', 'cand-a', 'stage-a')
    `));
    await pg.exec(`update applications set lifecycle = 'WITHDRAWN' where id = 'app-1'`);
    await pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-3', 'co-a', 'job-a', 'cand-a', 'stage-a')
    `);
  });

  it("rejects a cross-company application link", async () => {
    const pg = await fresh();
    await assert.rejects(() => pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-x', 'co-a', 'job-a', 'cand-b', 'stage-a')
    `));
  });

  it("stores one idempotency receipt per key", async () => {
    const pg = await fresh();
    await pg.exec(`
      insert into idempotency_records (id, actor_key, operation, idem_key, payload_hash, result)
      values ('idem-1', 'apply:ada@northstar.example', 'apply', 'key-1', 'hash-a', '{"applicationId":"app-1"}')
    `);
    await assert.rejects(() => pg.exec(`
      insert into idempotency_records (id, actor_key, operation, idem_key, payload_hash, result)
      values ('idem-2', 'apply:ada@northstar.example', 'apply', 'key-1', 'hash-b', '{"applicationId":"other"}')
    `));
  });

  it("rejects an invented scan state and a second offer response", async () => {
    const pg = await fresh();
    await assert.rejects(() => pg.exec(`
      insert into file_objects (id, company_id, owner_scope, owner_id, display_name, mime, size_bytes, content, scan_state)
      values ('file-1', 'co-a', 'application', 'app-1', 'cv.pdf', 'application/pdf', 10, 'aa', 'APPROVED')
    `));
    await pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-1', 'co-a', 'job-a', 'cand-a', 'stage-a');
      insert into offers (id, company_id, application_id, status) values ('off-1', 'co-a', 'app-1', 'SENT');
      insert into offer_responses (id, company_id, offer_id, revision, decision)
      values ('resp-1', 'co-a', 'off-1', 1, 'ACCEPTED')
    `);
    await assert.rejects(() => pg.exec(`
      insert into offer_responses (id, company_id, offer_id, revision, decision)
      values ('resp-2', 'co-a', 'off-1', 1, 'ACCEPTED')
    `));
  });

  it("lets only one claim take an open slot and leases an outbox row once", async () => {
    const pg = await fresh();
    await pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-1', 'co-a', 'job-a', 'cand-a', 'stage-a');
      insert into interview_slots (id, company_id, starts_at, ends_at, timezone)
      values ('slot-1', 'co-a', '2026-06-15T13:00:00Z', '2026-06-15T14:00:00Z', 'America/New_York');
      insert into questions (id, company_id, logical_key, type) values ('q-sql', 'co-a', 'sql-1', 'sql');
      insert into outbox_events (id, company_id, event_type, aggregate_id, payload)
      values ('evt-1', 'co-a', 'APPLICATION_SUBMITTED', 'app-1', '{}')
    `);
    const first = await pg.query(`
      update interview_slots set claimed_application_id = 'app-1'
      where id = 'slot-1' and claimed_application_id is null returning id
    `);
    const second = await pg.query(`
      update interview_slots set claimed_application_id = 'app-1'
      where id = 'slot-1' and claimed_application_id is null returning id
    `);
    assert.equal(first.rows.length, 1);
    assert.equal(second.rows.length, 0);
    const leased = await pg.query(`
      update outbox_events e
      set lease_until = now() + interval '2 minutes', attempts = attempts + 1
      from (
        select id from outbox_events
        where status = 'PENDING' and attempts < 5 and (lease_until is null or lease_until < now())
        for update skip locked
      ) c
      where e.id = c.id
      returning e.id
    `);
    const again = await pg.query(`
      update outbox_events e
      set attempts = attempts + 1
      from (
        select id from outbox_events
        where status = 'PENDING' and (lease_until is null or lease_until < now())
        for update skip locked
      ) c
      where e.id = c.id
      returning e.id
    `);
    assert.equal(leased.rows.length, 1);
    assert.equal(again.rows.length, 0);
  });

  it("keeps cohort counts distinct, leaves the other company's files, and stores a second evaluation", async () => {
    const pg = await fresh();
    await pg.exec(`
      insert into applications (id, company_id, job_id, candidate_id, current_stage_id)
      values ('app-1', 'co-a', 'job-a', 'cand-a', 'stage-a');
      insert into stage_events (id, company_id, application_id, to_stage_id, reason) values
        ('ev-1', 'co-a', 'app-1', 'stage-a', 'one'),
        ('ev-2', 'co-a', 'app-1', 'stage-a', 'two');
      insert into file_objects (id, company_id, owner_scope, owner_id, display_name, mime, size_bytes, content, scan_state) values
        ('file-a', 'co-a', 'application', 'app-1', 'a.txt', 'text/plain', 1, 'aa', 'CLEAN'),
        ('file-b', 'co-b', 'application', 'app-1', 'b.txt', 'text/plain', 1, 'bb', 'CLEAN');
    `);
    const cohort = await pg.query<{ n: number | string }>(`
      select count(distinct application_id) as n from stage_events where company_id = 'co-a'
    `);
    assert.equal(Number(cohort.rows[0].n), 1);
    await pg.query(`delete from file_objects where company_id = 'co-a'`);
    const left = await pg.query<{ id: string }>(`select id from file_objects`);
    assert.deepEqual(left.rows.map((row) => row.id), ["file-b"]);
    await pg.exec(`
      insert into questions (id, company_id, logical_key, type) values ('q1', 'co-a', 'q1', 'text');
      insert into question_versions (id, company_id, question_id, version_number, prompt, payload, points)
        values ('qv1', 'co-a', 'q1', 1, 'Why?', '{}', 1);
      insert into assessments (id, company_id, name) values ('as1', 'co-a', 'Test');
      insert into assessment_versions (id, company_id, assessment_id, version_number, status, duration_seconds, instructions, score_release)
        values ('av1', 'co-a', 'as1', 1, 'PUBLISHED', 600, '', 'NONE');
      insert into assignments (id, company_id, application_id, assessment_version_id, status, start_by, duration_seconds)
        values ('g1', 'co-a', 'app-1', 'av1', 'INVITED', '2026-12-01T00:00:00Z', 600);
      insert into attempts (id, company_id, assignment_id, ordinal, status, started_at, deadline)
        values ('t1', 'co-a', 'g1', 1, 'SUBMITTED', '2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z');
      insert into evaluations (id, company_id, attempt_id, revision, origin, status, basis_points, raw)
        values ('e1', 'co-a', 't1', 1, 'AUTOMATIC', 'FINAL', 8000, '{}');
      insert into evaluations (id, company_id, attempt_id, revision, origin, status, basis_points, raw)
        values ('e2', 'co-a', 't1', 2, 'MANUAL', 'FINAL', 9000, '{}');
    `);
    const revisions = await pg.query<{ revision: number | string }>(`select revision from evaluations where attempt_id = 't1' order by revision`);
    assert.deepEqual(revisions.rows.map((row) => Number(row.revision)), [1, 2]);
    const extended = await pg.query(`
      update attempts set deadline = deadline + interval '5 minutes'
      where id = 't1' and status = 'IN_PROGRESS'
      returning id
    `);
    assert.equal(extended.rows.length, 0);
  });
});
