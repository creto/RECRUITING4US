import { scoreExpertise } from "@/domain/expertise";
import { rankTopHalf } from "@/domain/half";
import { termsFromJson } from "@/domain/screen";
import { readResume } from "./resume-text";
import { loadFileBytes } from "./object-store.server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { enterTenant } from "@/lib/tenant";
import { allow, audit, db, json, nid, requireActor, sha256 } from "./db.server";
import { rememberEvent } from "./workflows.server";
import { assessmentInviteHref } from "@/domain/assessment-invite";

const LADDER = [
  ["Applied", "APPLIED"],
  ["Expertise rank", "SCREEN"],
  ["Coding screen", "ASSESSMENT"],
  ["Math and personality", "ASSESSMENT"],
  ["Final problems", "ASSESSMENT"],
  ["Interview", "INTERVIEW"],
  ["Offer", "OFFER"],
  ["Decision", "DECISION"],
] as const;

const BEFORE_CODING = new Set(["Applied", "Expertise rank", "Recruiter review"]);
const BEFORE_MATH = new Set(["Coding screen", "Assessment"]);
const BEFORE_FINAL = new Set(["Math and personality"]);

function ladderId(companyId: string, name: string) {
  return sha256(`${companyId}:ladder:${name}`).slice(0, 24);
}

type Paper = { id: string; versionId: string; name: string; seconds: number };

/** Idempotent stages and the three pipeline papers. Math and personality already exist. */
export async function ensureLadder(companyId: string, jobId: string) {
  enterTenant({ companyId, publicSlug: "" });
  const { ensureCodingBank } = await import("./bank.server");
  const { ensurePersonalityAssessment } = await import("./personality.server");
  const { ensureMentalMath } = await import("./mental.server");
  await ensureCodingBank(companyId);
  const { ensureReadCodeBank } = await import("./read-code.server");
  await ensureReadCodeBank(companyId);
  await ensurePersonalityAssessment(companyId);
  await ensureMentalMath(companyId);
  await ensureStages(companyId, jobId);
  await ensurePaper(companyId, "coding", "Pipeline · Coding screen", 75 * 60, [
    { key: "medium", title: "Medium", pick: 3, points: 2, weight: 4000 },
    { key: "hard", title: "Hard", pick: 2, points: 3, weight: 6000 },
  ], "Seventy-five minutes. Three medium problems and two hard problems are drawn from the bank and stay fixed for this attempt. They are not auto-judged. A person scores them. The key is not in the page.");
  await ensurePaper(companyId, "final", "Pipeline · Final problems", 60 * 60, [
    { key: "hard", title: "Hard", pick: 3, points: 3, weight: 10000 },
  ], "Sixty minutes. Three hard problems are drawn from the bank. They are not auto-judged.");
}

async function ensureStages(companyId: string, jobId: string) {
  const sql = await db();
  const jobs = await sql<{ id: string }>`select id from jobs where id = ${jobId} and company_id = ${companyId}`;
  if (!jobs[0]) return;
  await sql`
    update pipeline_stages set name = 'Expertise rank'
    where company_id = ${companyId} and job_id = ${jobId} and name = 'Recruiter review'
      and not exists (
        select 1 from pipeline_stages
        where company_id = ${companyId} and job_id = ${jobId} and name = 'Expertise rank'
      )
  `;
  await sql`
    update pipeline_stages set name = 'Coding screen'
    where company_id = ${companyId} and job_id = ${jobId} and name = 'Assessment'
      and not exists (
        select 1 from pipeline_stages
        where company_id = ${companyId} and job_id = ${jobId} and name = 'Coding screen'
      )
  `;
  const have = await sql<{ name: string }>`
    select name from pipeline_stages where company_id = ${companyId} and job_id = ${jobId}
  `;
  const names = new Set(have.map((row) => row.name));
  let position = have.length;
  for (const [name, category] of LADDER) {
    if (names.has(name)) continue;
    await sql`
      insert into pipeline_stages (id, company_id, job_id, name, category, position)
      values (${nid()}, ${companyId}, ${jobId}, ${name}, ${category}, ${position})
    `;
    names.add(name);
    position += 1;
  }
  const ordered = await sql<{ id: string; name: string }>`
    select id, name from pipeline_stages
    where company_id = ${companyId} and job_id = ${jobId}
    order by position, name
  `;
  const wanted = LADDER.map((stage) => stage[0]);
  const known = ordered.filter((row) => wanted.includes(row.name as (typeof LADDER)[number][0]));
  const rest = ordered.filter((row) => !wanted.includes(row.name as (typeof LADDER)[number][0]));
  const sequence = [
    ...wanted.map((name) => known.find((row) => row.name === name)).filter((row): row is { id: string; name: string } => Boolean(row)),
    ...rest,
  ];
  for (let index = 0; index < sequence.length; index += 1) {
    await sql`
      update pipeline_stages set position = ${index}
      where id = ${sequence[index]!.id} and company_id = ${companyId}
    `;
  }
}

async function ensurePaper(
  companyId: string,
  key: string,
  name: string,
  seconds: number,
  sections: { key: string; title: string; pick: number; points: number; weight: number }[],
  instructions: string,
) {
  const sql = await db();
  const assessmentId = ladderId(companyId, key);
  const versionId = ladderId(companyId, `${key}-version`);
  const ready = await sql<{ n: number }>`
    select count(*)::int as n
    from assessment_items i
    join assessment_sections s on s.id = i.section_id and s.company_id = i.company_id
    where i.company_id = ${companyId} and s.version_id = ${versionId}
  `;
  const exam = await sql<{ id: string }>`
    select id from assessment_versions where id = ${versionId} and company_id = ${companyId}
  `;
  // Each pipeline paper pools from the coding bank; once linked, skip rebuild.
  if (exam[0] && Number(ready[0]?.n ?? 0) > 0) {
    let expected = 0;
    for (const section of sections) {
      const count = await sql<{ n: number }>`
        select count(*)::int as n from questions q
        join question_versions v on v.question_id = q.id and v.company_id = q.company_id
        where q.company_id = ${companyId} and q.logical_key like 'bank:%'
          and v.payload->>'difficulty' = ${section.key}
      `;
      expected += Number(count[0]?.n ?? 0);
    }
    if (Number(ready[0]?.n ?? 0) >= expected && expected > 0) return;
  }
  await sql`
    insert into assessments (id, company_id, name, description, auto_send)
    values (
      ${assessmentId}, ${companyId}, ${name},
      ${"Sent by the hiring pipeline to the top half of the previous gate. A recruiter can still pass or reject."},
      false
    )
    on conflict (id) do nothing
  `;
  await sql`
    insert into assessment_versions (
      id, company_id, assessment_id, version_number, status, duration_seconds,
      instructions, score_release, published_at, content_hash, proctored
    ) values (
      ${versionId}, ${companyId}, ${assessmentId}, 1, 'PUBLISHED', ${seconds},
      ${instructions}, 'AGGREGATE', now(), ${`pipeline-${key}`}, false
    )
    on conflict (id) do nothing
  `;
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index]!;
    const sectionId = ladderId(companyId, `${key}-sec-${section.key}`);
    await sql`
      insert into assessment_sections (id, company_id, version_id, title, position, weight_basis_points, pool_pick)
      values (${sectionId}, ${companyId}, ${versionId}, ${section.title}, ${index}, ${section.weight}, ${section.pick})
      on conflict (id) do nothing
    `;
    const items = await sql<{ id: string; logical_key: string }>`
      select v.id, q.logical_key from questions q
      join question_versions v on v.question_id = q.id and v.company_id = q.company_id
      where q.company_id = ${companyId} and q.logical_key like 'bank:%'
        and v.payload->>'difficulty' = ${section.key}
      order by q.logical_key
    `;
    const have = await sql<{ n: number }>`
      select count(*)::int as n from assessment_items
      where company_id = ${companyId} and section_id = ${sectionId}
    `;
    if (Number(have[0]?.n ?? 0) === items.length && items.length > 0) continue;
    if (Number(have[0]?.n ?? 0) !== items.length) {
      await sql`
        delete from assessment_items
        where company_id = ${companyId} and section_id = ${sectionId}
      `;
    }
    for (let position = 0; position < items.length; position += 1) {
      const item = items[position]!;
      await sql`
        insert into assessment_items (id, company_id, section_id, question_version_id, points, position)
        values (
          ${ladderId(companyId, `${key}-item-${section.key}-${item.logical_key}`)},
          ${companyId}, ${sectionId}, ${item.id}, ${section.points}, ${position}
        )
        on conflict (id) do nothing
      `;
    }
  }
}

async function paper(companyId: string, contentHash: string): Promise<Paper | null> {
  const sql = await db();
  const rows = await sql<{ id: string; version_id: string; name: string; duration_seconds: number }>`
    select s.id, v.id as version_id, s.name, v.duration_seconds
    from assessment_versions v
    join assessments s on s.id = v.assessment_id and s.company_id = v.company_id
    where v.company_id = ${companyId} and v.content_hash = ${contentHash} and v.status = 'PUBLISHED'
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, versionId: row.version_id, name: row.name, seconds: Number(row.duration_seconds) };
}

async function stageId(companyId: string, jobId: string, name: string) {
  const sql = await db();
  const rows = await sql<{ id: string }>`
    select id from pipeline_stages
    where company_id = ${companyId} and job_id = ${jobId} and name = ${name} and archived = false
    limit 1
  `;
  return rows[0]?.id ?? null;
}

/** Re-rank one job and send the next paper to the top half. Does not withdraw a paper already sent. */
export async function advanceJob(companyId: string, jobId: string) {
  enterTenant({ companyId, publicSlug: "" });
  await ensureLadder(companyId, jobId);
  await rankExpertise(companyId, jobId);
  await rankScoredGate(companyId, jobId, "CODING", "pipeline-coding", "Math and personality", ["mental-math-15", "work-style-25"]);
  await rankScoredGate(companyId, jobId, "MATH", "mental-math-15", "Final problems", ["pipeline-final"]);
}

async function rankExpertise(companyId: string, jobId: string) {
  const sql = await db();
  const job = await sql<{ required: unknown; preferred: unknown }>`
    select screen_required as required, screen_preferred as preferred
    from jobs where id = ${jobId} and company_id = ${companyId}
  `;
  if (!job[0]) return;
  const required = termsFromJson(job[0].required);
  const preferred = termsFromJson(job[0].preferred);
  const apps = await sql<{ id: string; stage_name: string; email: string; indexed_text: string | null }>`
    select a.id, s.name as stage_name, c.email, p.indexed_text
    from applications a
    join pipeline_stages s on s.id = a.current_stage_id and s.company_id = a.company_id
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    left join candidate_profiles p on p.application_id = a.id and p.company_id = a.company_id
    where a.company_id = ${companyId} and a.job_id = ${jobId} and a.lifecycle = 'ACTIVE'
  `;
  const scored: { id: string; score: number; lines: string[]; email: string; stageName: string }[] = [];
  const unread: { id: string; lines: string[] }[] = [];
  for (const app of apps) {
    let text = app.indexed_text;
    let readable = Boolean(text && text.trim());
    if (!readable) {
      const files = await sql<{ mime: string; content: string; scan_state: string; display_name: string }>`
        select mime, content, scan_state, display_name from file_objects
        where company_id = ${companyId} and owner_id = ${app.id}
        order by created_at desc limit 1
      `;
      const file = files[0];
      const clean = file?.scan_state === "CLEAN";
      const extracted = file && clean
        ? await readResume(file.mime, await loadFileBytes(file.content), file.display_name)
        : { text: null, readable: false };
      text = extracted.text;
      readable = extracted.readable;
    }
    const expertise = scoreExpertise({
      text,
      readable,
      required,
      preferred,
    });
    if (!expertise.ranked) unread.push({ id: app.id, lines: expertise.lines });
    else scored.push({ id: app.id, score: expertise.score, lines: expertise.lines, email: app.email, stageName: app.stage_name });
  }
  const half = rankTopHalf(scored.map((row) => ({ id: row.id, score: row.score })));
  for (const row of unread) {
    await saveRank(companyId, jobId, row.id, "EXPERTISE", {
      score: null, rank: 0, pool: half.pool, cutoff: half.cutoff, advanced: false, reasons: row.lines,
    });
  }
  const coding = await paper(companyId, "pipeline-coding");
  const codingStage = await stageId(companyId, jobId, "Coding screen");
  for (const row of scored) {
    const place = half.byId.get(row.id);
    const advanced = place?.advanced === true;
    const reasons = [...row.lines, half.note];
    if (!advanced) reasons.push("Below the cutoff. No coding screen was sent. A recruiter can still pass this person.");
    await saveRank(companyId, jobId, row.id, "EXPERTISE", {
      score: row.score,
      rank: place?.rank ?? 0,
      pool: half.pool,
      cutoff: half.cutoff,
      advanced,
      reasons,
    });
    if (!advanced || !coding || !codingStage || !BEFORE_CODING.has(row.stageName)) continue;
    await assignPaper(
      companyId,
      row.id,
      row.email,
      coding,
      `You placed ${place?.rank} of ${half.pool} on expertise (score ${row.score}). ${half.note} The message is kept in RECRUIT4US and is not sent through an outside mail server.`,
    );
    await moveStage(companyId, row.id, codingStage, `Expertise rank ${place?.rank} of ${half.pool}. ${half.note}`);
  }
}

async function rankScoredGate(
  companyId: string,
  jobId: string,
  gate: "CODING" | "MATH",
  sourceHash: string,
  nextStageName: string,
  nextHashes: string[],
) {
  const sql = await db();
  const source = await paper(companyId, sourceHash);
  if (!source) return;
  const rows = await sql<{ id: string; email: string; stage_name: string; basis_points: number | null; status: string | null }>`
    select a.id, c.email, st.name as stage_name, e.basis_points, e.status
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join pipeline_stages st on st.id = a.current_stage_id and st.company_id = a.company_id
    join assignments g on g.application_id = a.id and g.company_id = a.company_id and g.assessment_version_id = ${source.versionId}
    join attempts t on t.id = (
      select t2.id from attempts t2
      where t2.assignment_id = g.id and t2.company_id = g.company_id
        and t2.status in ('SUBMITTED', 'GRADING', 'AWAITING_REVIEW', 'COMPLETED')
      order by t2.ordinal desc limit 1
    )
    left join lateral (
      select basis_points, status from evaluations
      where attempt_id = t.id and company_id = t.company_id and status = 'FINAL' and basis_points is not null
      order by revision desc limit 1
    ) e on true
    where a.company_id = ${companyId} and a.job_id = ${jobId} and a.lifecycle = 'ACTIVE'
  `;
  const ready = rows.filter((row) => row.basis_points != null);
  const half = rankTopHalf(ready.map((row) => ({ id: row.id, score: Number(row.basis_points) })));
  const nextStage = await stageId(companyId, jobId, nextStageName);
  const nextPapers: Paper[] = [];
  for (const hash of nextHashes) {
    const found = await paper(companyId, hash);
    if (found) nextPapers.push(found);
  }
  const allowed = gate === "CODING" ? BEFORE_MATH : BEFORE_FINAL;
  for (const row of rows) {
    if (row.basis_points == null) {
      const held = gate === "CODING"
        ? "Submitted. These problems have no automatic score, so this person is not ranked. Pass sends math and personality. Reject closes the application."
        : "Submitted. There is no numeric score yet, so this person is not ranked.";
      await saveRank(companyId, jobId, row.id, gate, {
        score: null, rank: 0, pool: half.pool, cutoff: half.cutoff, advanced: false, reasons: [held],
      });
      continue;
    }
    const place = half.byId.get(row.id);
    const advanced = place?.advanced === true;
    const reasons = [
      `Score ${row.basis_points} basis points. Rank ${place?.rank ?? 0} of ${half.pool}.`,
      half.note,
    ];
    if (!advanced) reasons.push("Below the cutoff. Nothing further was sent. A recruiter can still pass this person.");
    await saveRank(companyId, jobId, row.id, gate, {
      score: Number(row.basis_points),
      rank: place?.rank ?? 0,
      pool: half.pool,
      cutoff: half.cutoff,
      advanced,
      reasons,
    });
    if (!advanced || !nextStage || !allowed.has(row.stage_name)) continue;
    for (const next of nextPapers) {
      await assignPaper(companyId, row.id, row.email, next, `${half.note} The message is kept here and is not sent through an outside mail server.`);
    }
    await moveStage(companyId, row.id, nextStage, `${gate === "CODING" ? "Coding" : "Math"} rank ${place?.rank} of ${half.pool}. ${half.note}`);
  }
}

async function saveRank(
  companyId: string,
  jobId: string,
  applicationId: string,
  gate: string,
  row: { score: number | null; rank: number; pool: number; cutoff: number | null; advanced: boolean; reasons: string[] },
) {
  const sql = await db();
  await sql`
    insert into pipeline_ranks (
      id, company_id, application_id, job_id, gate, score, rank, pool, cutoff, advanced, reasons
    ) values (
      ${nid()}, ${companyId}, ${applicationId}, ${jobId}, ${gate}, ${row.score}, ${row.rank},
      ${row.pool}, ${row.cutoff}, ${row.advanced}, ${json(row.reasons)}::jsonb
    )
    on conflict (company_id, application_id, gate) do update set
      score = excluded.score,
      rank = excluded.rank,
      pool = excluded.pool,
      cutoff = excluded.cutoff,
      advanced = excluded.advanced,
      reasons = excluded.reasons,
      created_at = now()
  `;
}

async function assignPaper(companyId: string, applicationId: string, email: string, item: Paper, body: string) {
  const sql = await db();
  const existing = await sql<{ id: string }>`
    select id from assignments
    where company_id = ${companyId} and application_id = ${applicationId} and assessment_version_id = ${item.versionId}
    limit 1
  `;
  if (existing[0]) return existing[0].id;
  const id = nid();
  const inviteToken = crypto.randomUUID();
  const inviteHref = assessmentInviteHref(inviteToken, (process.env.BETTER_AUTH_URL ?? process.env.APP_ORIGIN ?? "").trim().replace(/\/$/, ""));
  const startBy = new Date(Date.now() + 14 * 86400000).toISOString();
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by,
      duration_seconds, multiplier_basis_points, extra_seconds, invite_token
    ) values (
      ${id}, ${companyId}, ${applicationId}, ${item.versionId}, 'INVITED', ${startBy},
      ${item.seconds}, 10000, 0, ${inviteToken}
    )
  `;
  await sql`
    insert into mail_messages (id, company_id, to_email, subject, body, status, related_id)
    values (
      ${nid()}, ${companyId}, ${email}, ${"Assessment: " + item.name},
      ${`${body} Open your assessment invite to start (opening this record does not start the timer): ${inviteHref}`},
      'CAPTURED', ${id}
    )
  `;
  await rememberEvent(companyId, "ASSESSMENT_ASSIGNED", id, { applicationId, assignmentId: id, source: "pipeline" });
  return id;
}

async function moveStage(companyId: string, applicationId: string, toStageId: string, reason: string) {
  const sql = await db();
  const current = await sql<{ stage_id: string }>`
    select current_stage_id as stage_id from applications
    where id = ${applicationId} and company_id = ${companyId} and lifecycle = 'ACTIVE'
  `;
  if (!current[0] || current[0].stage_id === toStageId) return;
  const updated = await sql`
    update applications set current_stage_id = ${toStageId}, version = version + 1
    where id = ${applicationId} and company_id = ${companyId} and lifecycle = 'ACTIVE'
      and current_stage_id = ${current[0].stage_id}
    returning id
  `;
  if (!updated[0]) return;
  await sql`
    insert into stage_events (id, company_id, application_id, from_stage_id, to_stage_id, reason)
    values (${nid()}, ${companyId}, ${applicationId}, ${current[0].stage_id}, ${toStageId}, ${reason.slice(0, 400)})
  `;
}

const NEXT: Record<string, { stage: string; hashes: string[] }> = {
  Applied: { stage: "Coding screen", hashes: ["pipeline-coding"] },
  "Expertise rank": { stage: "Coding screen", hashes: ["pipeline-coding"] },
  "Recruiter review": { stage: "Coding screen", hashes: ["pipeline-coding"] },
  "Coding screen": { stage: "Math and personality", hashes: ["mental-math-15", "work-style-25"] },
  Assessment: { stage: "Math and personality", hashes: ["mental-math-15", "work-style-25"] },
  "Math and personality": { stage: "Final problems", hashes: ["pipeline-final"] },
  "Final problems": { stage: "Decision", hashes: [] },
  Interview: { stage: "Offer", hashes: [] },
  Offer: { stage: "Decision", hashes: [] },
};

/** Recruiter override. Sends the next paper even when the person is below the cutoff. */
export async function passApplicant(userId: string, input: { slug: string; applicationId: string }) {
  assertSameSiteRequest();
  const actor = await requireActor(userId, input.slug);
  allow(actor, "application.move");
  allow(actor, "assessment.assign");
  const sql = await db();
  const apps = await sql<{ id: string; job_id: string; email: string; stage_name: string; lifecycle: string }>`
    select a.id, a.job_id, c.email, s.name as stage_name, a.lifecycle
    from applications a
    join candidates c on c.id = a.candidate_id and c.company_id = a.company_id
    join pipeline_stages s on s.id = a.current_stage_id and s.company_id = a.company_id
    where a.id = ${input.applicationId} and a.company_id = ${actor.companyId}
  `;
  const app = apps[0];
  if (!app) throw new Error("Not found.");
  if (app.lifecycle !== "ACTIVE") throw new Error("Only an active application can be passed.");
  await ensureLadder(actor.companyId, app.job_id);
  const next = NEXT[app.stage_name];
  if (!next) throw new Error("This stage has no next paper. Move the person with the stage menu.");
  const destination = await stageId(actor.companyId, app.job_id, next.stage);
  if (!destination) throw new Error("The next stage is missing.");
  for (const hash of next.hashes) {
    const item = await paper(actor.companyId, hash);
    if (!item) throw new Error("The next assessment is not published.");
    await assignPaper(actor.companyId, app.id, app.email, item, "A recruiter passed this person. The cutoff was not required.");
  }
  await moveStage(actor.companyId, app.id, destination, "Recruiter passed this stage. The cutoff was not required.");
  await audit(actor, "application.move", "application", app.id, "Recruiter passed the pipeline stage.");
  return { ok: true };
}
