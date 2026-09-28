import { createHash } from "node:crypto";
import { calculateWeightedScore } from "@/domain/rules";
import { enterTenant } from "@/lib/tenant";
import { audit, db, json, requireUser } from "./db.server";

const PLATFORM_DESCRIPTION = `Build reliable product infrastructure for a growing hiring and assessment platform. You will own backend and full-stack features from design through production, collaborate with product and design, review technical proposals, and improve the team's ability to deliver dependable software.

Responsibilities: design clear APIs and relational data models; implement secure multi-tenant workflows; build asynchronous processing with idempotent retries; improve database performance and observability; deliver accessible user experiences; investigate production incidents; write meaningful automated tests; and mentor colleagues through thoughtful reviews and documentation.

Required capabilities: substantial experience shipping and operating production software; strong TypeScript or a comparable typed language; practical SQL and relational database knowledge; understanding of authentication, authorization and application security; experience with testing and debugging concurrent behavior; and clear written communication about engineering tradeoffs. Equivalent professional experience is welcomed; a specific degree is not required.

Helpful experience: React, background job systems, cloud infrastructure, developer tooling, assessment platforms, and systems handling sensitive customer data.

Process: application review, a clearly described assessment, engineering discussion, collaboration interview and a final decision. Candidates can request an accommodation or an alternative assessment format through the listed recruiting contact. This demo job and assessment are fictional and do not represent a validated hiring instrument.`;

const NAMES = [
  "Amina Hassan", "Jonah Adler", "Priya Raman", "Elena Voss", "Marcus Hale", "Sofia Nguyen",
  "Kenji Mori", "Leila Farouk", "Owen Blake", "Nora Ivers", "Hugo Santos", "Maya Chen",
  "Felix Okonkwo", "Iris Berg", "Nolan Price", "Adaeze Obi", "Samir Rahman", "Ruth Keller",
  "Theo Marchetti", "Clara Singh", "Jonah Park", "Helena Costa", "Omar Farid", "June Alvarez",
  "Peter Lang", "Yara Haddad", "Chris Novak", "Mina Shah", "Elliot Brooks", "Fatima Diallo",
  "Rosa Mendel", "Ian Cho",
];

function did(seed: string, name: string) {
  return createHash("sha256").update(`${seed}:${name}`).digest("hex").slice(0, 24);
}

const JUDGMENT = [
  {
    key: "idempotency",
    prompt:
      "A browser retries an application POST after losing the response. Which design most directly prevents duplicate applications?",
    options: [
      ["a", "Hide the submit button after clicking."],
      ["b", "Give the request an idempotency key, validate its payload fingerprint, and enforce the mutation once in the database."],
      ["c", "Wait two seconds before accepting another request."],
      ["d", "Add more web servers."],
    ],
    correct: "b",
  },
  {
    key: "tenant-auth",
    prompt: "A signed-in recruiter changes an application ID in a request. What must the server verify?",
    options: [
      ["a", "Only that the ID is a UUID."],
      ["b", "Only that the user has any recruiter role."],
      ["c", "The user's company membership, permission, job scope, and ownership of the requested application."],
      ["d", "Only that the request came from the application UI."],
    ],
    correct: "c",
  },
  {
    key: "redelivery",
    prompt:
      "A worker crashes after changing an application stage but before acknowledging its message. What is the expected recovery design?",
    options: [
      ["a", "Assume messages are never redelivered."],
      ["b", "Delete the queue after restarting."],
      ["c", "Repeat every side effect without checking state."],
      ["d", "Redeliver safely using transactional state changes and durable deduplication or preconditions."],
    ],
    correct: "d",
  },
  {
    key: "grading-failure",
    prompt: "A code execution provider is unavailable after a candidate submits. What is the appropriate product state?",
    options: [
      ["a", "Give the candidate zero points."],
      ["b", "Preserve the submitted work, mark evaluation pending or failed operationally, and retry or route to review."],
      ["c", "Delete the attempt and ask the candidate to start over without explanation."],
      ["d", "Mark the assessment passed to unblock the pipeline."],
    ],
    correct: "b",
  },
] as const;

const NUMERIC = [
  { key: "fill-rate", prompt: "A team filled 48 of 60 open roles. What percent were filled? Enter a number.", expected: "80" },
  { key: "accept-rate", prompt: "3 of 12 sent offers were accepted. What is the acceptance rate in percent?", expected: "25" },
  { key: "average", prompt: "Quarterly applications were 120, 150, and 90. What is the average?", expected: "120" },
  { key: "growth", prompt: "A pipeline grew from 200 to 250. What is the percent increase?", expected: "25" },
] as const;

export async function seedDemo(userId: string) {
  const user = await requireUser(userId);
  const seed = user.id.replace(/[^a-z0-9]/gi, "").slice(0, 10).toLowerCase() || "demo";
  const sql = await db();
  const northSlug = `northstar-${seed}`;
  const existing = await sql<{ id: string | null }>`select app_company_id_for_slug(${northSlug}) as id`;
  if (existing[0]?.id) return { slug: northSlug, created: false };

  const companyId = did(seed, "northstar");
  const harborId = did(seed, "harbor");
  enterTenant({ userId: user.id, companyId, publicSlug: "" });
  await sql`
    insert into companies (id, name, slug, timezone, demo, created_by)
    values (${companyId}, 'Northstar Labs', ${northSlug}, 'America/New_York', true, ${user.id})
  `;
  await sql`
    insert into memberships (id, company_id, user_id, role)
    values (${did(seed, "owner-membership")}, ${companyId}, ${user.id}, 'OWNER')
  `;
  enterTenant({ userId: user.id, companyId: harborId, publicSlug: "" });
  await sql`
    insert into companies (id, name, slug, timezone, demo, created_by)
    values (${harborId}, 'Harbor Analytics', ${"harbor-" + seed}, 'America/Chicago', true, ${"seed-harbor-" + seed})
  `;
  await sql`
    insert into memberships (id, company_id, user_id, role)
    values (${did(seed, "harbor-owner")}, ${harborId}, ${"seed-harbor-" + seed}, 'OWNER')
  `;

  const platformStages = [
    ["Applied", "APPLIED"],
    ["Recruiter Review", "SCREEN"],
    ["Assessment", "ASSESSMENT"],
    ["Engineering Interview", "INTERVIEW"],
    ["Collaboration Interview", "INTERVIEW"],
    ["Offer", "OFFER"],
    ["Decision", "DECISION"],
  ];
  const genericStages = [
    ["Applied", "APPLIED"],
    ["Screen", "SCREEN"],
    ["Interview", "INTERVIEW"],
    ["Offer", "OFFER"],
    ["Decision", "DECISION"],
  ];

  async function makeJob(
    company: string,
    name: string,
    title: string,
    slug: string,
    department: string,
    arrangement: string,
    status: string,
    description: string,
    stages: string[][],
  ) {
    enterTenant({ userId: user.id, companyId: company, publicSlug: "" });
    const jobId = did(seed, `${company}:${name}`);
    await sql`
      insert into jobs (
        id, company_id, title, slug, department, locations, work_arrangement, employment_type,
        description, skills, status, salary_min, salary_max, salary_visible, openings
      ) values (
        ${jobId}, ${company}, ${title}, ${slug}, ${department},
        ${arrangement === "REMOTE" ? "Remote" : "New York"},
        ${arrangement}, 'FULL_TIME', ${description}, 'TypeScript, SQL', ${status === "PUBLISHED" || status === "PAUSED" || status === "CLOSED" ? "DRAFT" : status},
        160000, 210000, ${name === "platform"}, 2
      )
    `;
    const stageIds: { id: string; category: string }[] = [];
    for (let i = 0; i < stages.length; i += 1) {
      const stage = stages[i]!;
      const id = did(seed, `${jobId}:stage:${i}`);
      await sql`
        insert into pipeline_stages (id, company_id, job_id, name, category, position)
        values (${id}, ${company}, ${jobId}, ${stage[0]}, ${stage[1]}, ${i})
      `;
      stageIds.push({ id, category: stage[1]! });
    }
    if (status === "PUBLISHED" || status === "PAUSED") {
      const revisionId = did(seed, `${jobId}:rev`);
      await sql`
        insert into job_revisions (
          id, company_id, job_id, version_number, title, description, form_schema, salary_visible, salary_min, salary_max
        ) values (
          ${revisionId}, ${company}, ${jobId}, 1, ${title}, ${description},
          ${json([
            { id: "why", type: "long_text", label: "Why this role?", required: false, help: "" },
            { id: "website", type: "url", label: "Portfolio or website", required: false, help: "" },
          ])}::jsonb,
          ${name === "platform"}, 160000, 210000
        )
      `;
      await sql`
        update jobs set status = ${status}, published_revision_id = ${revisionId} where id = ${jobId}
      `;
    }
    return { jobId, stageIds };
  }

  const platform = await makeJob(
    companyId, "platform", "Senior Software Engineer — Platform", "senior-software-engineer-platform",
    "Engineering", "HYBRID", "PUBLISHED", PLATFORM_DESCRIPTION, platformStages,
  );
  const analyst = await makeJob(
    companyId, "analyst", "Data Analyst", "data-analyst", "Analytics", "REMOTE", "PUBLISHED",
    "Turn messy operational data into decisions the hiring team can trust. You will question definitions, document denominators, and keep charts attached to the query that produced them. This demo role is fictional.",
    genericStages,
  );
  const support = await makeJob(
    companyId, "support", "Customer Support Specialist", "customer-support-specialist", "Support", "REMOTE", "PUBLISHED",
    "Help fictional customers unblock assessments and interviews. Prioritize clearly, write plain replies, and escalate with evidence. This demo role is fictional.",
    genericStages,
  );
  const sales = await makeJob(
    companyId, "sales", "Account Executive", "account-executive", "Sales", "HYBRID", "PUBLISHED",
    "Run discovery with fictional buying teams. The exercise asks for questions and judgment, not a personality score. This demo role is fictional.",
    genericStages,
  );
  await makeJob(
    companyId, "design", "Product Designer", "product-designer", "Design", "HYBRID", "PAUSED",
    "Design hiring workflows that stay understandable under stress. This demo role is paused and does not accept applications.",
    genericStages,
  );
  await makeJob(
    companyId, "coord", "Recruiting Coordinator", "recruiting-coordinator", "People", "ONSITE", "DRAFT",
    "Coordinate interviews for a fictional team. This job is still a draft.",
    genericStages,
  );
  await makeJob(
    harborId, "platform", "Senior Software Engineer — Platform", "senior-software-engineer-platform",
    "Engineering", "REMOTE", "PUBLISHED",
    "Harbor Analytics is a separate employer. This role shares a title with Northstar Labs on purpose so tenant leaks are visible. It is fictional.",
    genericStages,
  );

  const jobs = [platform, analyst, support, sales];
  const candidateIds: string[] = [];
  for (let i = 0; i < NAMES.length; i += 1) {
    const id = did(seed, `cand:${i}`);
    const email = `${NAMES[i]!.toLowerCase().replace(/[^a-z]+/g, ".")}@northstar.example`;
    enterTenant({ userId: user.id, companyId, publicSlug: "" });
    await sql`
      insert into candidates (id, company_id, name, email, email_normalized, source)
      values (${id}, ${companyId}, ${NAMES[i]}, ${email}, ${email}, ${i % 5 === 0 ? "REFERRAL" : "CAREERS"})
    `;
    candidateIds.push(id);
    const harborEmail = `${NAMES[i]!.toLowerCase().replace(/[^a-z]+/g, ".")}@harbor.example`;
    enterTenant({ userId: user.id, companyId: harborId, publicSlug: "" });
    await sql`
      insert into candidates (id, company_id, name, email, email_normalized, source)
      values (${did(seed, `hcand:${i}`)}, ${harborId}, ${NAMES[i]}, ${harborEmail}, ${harborEmail}, 'CAREERS')
    `;
  }

  const pairs = new Set<string>();
  const applicationIds: string[] = [];
  enterTenant({ userId: user.id, companyId, publicSlug: "" });
  for (let i = 0; i < 40; i += 1) {
    const candidateId = candidateIds[i % candidateIds.length]!;
    const job = jobs[(i + Math.floor(i / candidateIds.length)) % jobs.length]!;
    const pair = `${candidateId}:${job.jobId}`;
    if (pairs.has(pair)) continue;
    pairs.add(pair);
    const stage = job.stageIds[i % job.stageIds.length]!;
    const id = did(seed, `app:${i}`);
    const lifecycle = i === 3 ? "HIRED" : i === 7 ? "WITHDRAWN" : i === 11 ? "REJECTED" : "ACTIVE";
    await sql`
      insert into applications (
        id, company_id, job_id, candidate_id, current_stage_id, lifecycle, source, version, rejection_reason, closed_at
      ) values (
        ${id}, ${companyId}, ${job.jobId}, ${candidateId}, ${stage.id}, ${lifecycle},
        ${i % 4 === 0 ? "REFERRAL" : "CAREERS"}, 1,
        ${lifecycle === "REJECTED" ? "Role scope changed" : null},
        ${lifecycle === "ACTIVE" ? null : "2026-06-20T15:00:00.000Z"}
      )
    `;
    await sql`
      insert into stage_events (id, company_id, application_id, to_stage_id, to_lifecycle, reason, created_at)
      values (${did(seed, `ev:${i}`)}, ${companyId}, ${id}, ${stage.id}, ${lifecycle}, 'Seeded history', '2026-06-15T15:00:00.000Z')
    `;
    applicationIds.push(id);
  }

  const rubric = {
    dimensions: [
      { id: "substance", label: "Substance", anchors: ["Missing", "Thin", "Adequate", "Strong", "Exceptional"] },
      { id: "clarity", label: "Clarity", anchors: ["Unclear", "Hard to follow", "Understandable", "Clear", "Precise"] },
    ],
  };

  async function question(logical: string, type: string, prompt: string, payload: unknown, key: unknown, points: number) {
    enterTenant({ userId: user.id, companyId, publicSlug: "" });
    const qid = did(seed, `q:${logical}`);
    const vid = did(seed, `qv:${logical}`);
    await sql`
      insert into questions (id, company_id, logical_key, type, tags)
      values (${qid}, ${companyId}, ${logical}, ${type}, 'demo')
    `;
    await sql`
      insert into question_versions (id, company_id, question_id, version_number, prompt, payload, key_payload, rubric, points)
      values (
        ${vid}, ${companyId}, ${qid}, 1, ${prompt}, ${json(payload)}::jsonb, ${json(key)}::jsonb,
        ${type === "text" || type === "code" ? json(rubric) : null}::jsonb, ${points}
      )
    `;
    return vid;
  }

  const judgmentIds = [];
  for (const item of JUDGMENT) {
    judgmentIds.push(await question(
      item.key,
      "single",
      item.prompt,
      { options: item.options.map(([id, label]) => ({ id, label })) },
      { correct: [item.correct], sentinel: "HIDDEN_SENTINEL_northstar_key_9f3a" },
      1,
    ));
  }
  const numericIds = [];
  for (const item of NUMERIC) {
    numericIds.push(await question(
      item.key,
      "numeric",
      item.prompt,
      { absTolerance: "0", relTolerance: "0", unit: "number" },
      { expected: item.expected, sentinel: "HIDDEN_SENTINEL_northstar_key_9f3a" },
      1,
    ));
  }
  const codingId = await question(
    "dedupe",
    "code",
    "Implement deduplicateEvents(events, windowMs). Keep the first event for an id. Drop a later event for that id when its timestamp is within windowMs, inclusive, of the last retained event. A dropped event must not extend the window. Submitted answers are judged in a separate process and ranked by estimated time class, then space, then measured time. A wrong answer does not rank above a correct one. A sample run is not that score.\n\nSample: [{id:a,timestampMs:0},{id:a,timestampMs:5},{id:b,timestampMs:6},{id:a,timestampMs:10},{id:a,timestampMs:11}] with a 10ms window retains the events at 0, 6, and 11.",
    { mode: "code", languages: ["typescript"] },
    {},
    1,
  );
  const designId = await question(
    "design",
    "text",
    "Design an assessment invitation workflow that commits an assignment in PostgreSQL and eventually emails a candidate, even if the web process crashes, the queue redelivers, or the mail provider times out. Explain records, transaction boundaries, idempotency, ambiguous delivery, and how withdrawal cancels future reminders.",
    { mode: "text" },
    {},
    1,
  );
  const debugId = await question(
    "debug",
    "text",
    "This function is intentionally unsafe assessment material:\n\nasync function getApplication(user, applicationId) {\n  if (!user) throw new Error('Unauthorized');\n  return db.application.findUnique({ where: { id: applicationId } });\n}\n\nIdentify the authorization flaw, propose a boundary that checks company and job access, describe a two-company regression test, and say what a candidate-facing response must omit.",
    { mode: "text" },
    {},
    1,
  );

  async function assessment(
    name: string,
    description: string,
    seconds: number,
    release: string,
    sections: { title: string; weight: number; items: string[] }[],
  ) {
    enterTenant({ userId: user.id, companyId, publicSlug: "" });
    const aid = did(seed, `asmt:${name}`);
    const vid = did(seed, `asmtv:${name}`);
    await sql`
      insert into assessments (id, company_id, name, description)
      values (${aid}, ${companyId}, ${name}, ${description})
    `;
    await sql`
      insert into assessment_versions (
        id, company_id, assessment_id, version_number, status, duration_seconds, instructions, score_release, published_at, content_hash
      ) values (
        ${vid}, ${companyId}, ${aid}, 1, 'PUBLISHED', ${seconds},
        ${"You may use a blank editor and public documentation. This demo is not a validated hiring instrument. Disconnects do not pause the timer. The server clock is authoritative."},
        ${release}, now(), 'seed'
      )
    `;
    let pos = 0;
    for (let s = 0; s < sections.length; s += 1) {
      const section = sections[s]!;
      const sid = did(seed, `sec:${name}:${s}`);
      await sql`
        insert into assessment_sections (id, company_id, version_id, title, position, weight_basis_points)
        values (${sid}, ${companyId}, ${vid}, ${section.title}, ${s}, ${section.weight})
      `;
      for (const item of section.items) {
        await sql`
          insert into assessment_items (id, company_id, section_id, question_version_id, points, position)
          values (${did(seed, `item:${name}:${pos}`)}, ${companyId}, ${sid}, ${item}, 1, ${pos})
        `;
        pos += 1;
      }
    }
    return { aid, vid };
  }

  const engineering = await assessment(
    "Senior Platform Engineering Exercise",
    "A 90-minute fictional exercise. The limit is a demo setting, not a validated recommendation.",
    5400,
    "NONE",
    [
      { title: "Engineering judgment", weight: 2000, items: judgmentIds },
      { title: "Coding work sample", weight: 3500, items: [codingId] },
      { title: "System design writing", weight: 3000, items: [designId] },
      { title: "Debugging explanation", weight: 1500, items: [debugId] },
    ],
  );
  const numerical = await assessment(
    "Numerical reasoning mini-test",
    "Original percent and ratio questions. Not a validated instrument.",
    1200,
    "AGGREGATE",
    [{ title: "Numerical reasoning", weight: 10000, items: numericIds }],
  );

  await sql`
    update jobs set
      screen_required = ${json(["TypeScript", "SQL", "PostgreSQL"])}::jsonb,
      screen_preferred = ${json(["React"])}::jsonb,
      screen_assessment_id = ${engineering.aid}
    where id = ${platform.jobId} and company_id = ${companyId}
  `;

  const invitedApp = applicationIds[0]!;
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by, duration_seconds, multiplier_basis_points, extra_seconds
    ) values (
      ${did(seed, "assign-invited")}, ${companyId}, ${invitedApp}, ${engineering.vid}, 'INVITED',
      now() + interval '14 days', 5400, 15000, 0
    )
  `;

  const progressApp = applicationIds[1]!;
  const progressAssignment = did(seed, "assign-progress");
  const progressAttempt = did(seed, "attempt-progress");
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by, duration_seconds
    ) values (
      ${progressAssignment}, ${companyId}, ${progressApp}, ${numerical.vid}, 'IN_PROGRESS', now() + interval '2 days', 1200
    )
  `;
  await sql`
    insert into attempts (id, company_id, assignment_id, ordinal, status, started_at, deadline)
    values (
      ${progressAttempt}, ${companyId}, ${progressAssignment}, 1, 'IN_PROGRESS', now() - interval '10 minutes', now() + interval '70 minutes'
    )
  `;
  const firstItem = did(seed, "progress-item");
  await sql`
    insert into attempt_items (id, company_id, attempt_id, question_version_id, section_id, position, points, option_order)
    values (
      ${firstItem}, ${companyId}, ${progressAttempt}, ${numericIds[0]}, ${did(seed, "sec:Numerical reasoning mini-test:0")},
      0, 1, '[]'::jsonb
    )
  `;
  await sql`
    insert into responses (id, company_id, attempt_item_id, answer, revision)
    values (${did(seed, "progress-response")}, ${companyId}, ${firstItem}, ${json({ value: "80" })}::jsonb, 1)
  `;

  const doneApp = applicationIds[2]!;
  const doneAssignment = did(seed, "assign-done");
  const doneAttempt = did(seed, "attempt-done");
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by, duration_seconds
    ) values (
      ${doneAssignment}, ${companyId}, ${doneApp}, ${numerical.vid}, 'COMPLETED', '2026-06-01T15:00:00.000Z', 1200
    )
  `;
  await sql`
    insert into attempts (id, company_id, assignment_id, ordinal, status, started_at, deadline, submitted_at, submission_reason)
    values (
      ${doneAttempt}, ${companyId}, ${doneAssignment}, 1, 'COMPLETED',
      '2026-06-10T15:00:00.000Z', '2026-06-10T15:20:00.000Z', '2026-06-10T15:12:00.000Z', 'MANUAL'
    )
  `;
  const answers = [];
  for (let i = 0; i < numericIds.length; i += 1) {
    const itemId = did(seed, `done-item:${i}`);
    await sql`
      insert into attempt_items (id, company_id, attempt_id, question_version_id, section_id, position, points, option_order)
      values (
        ${itemId}, ${companyId}, ${doneAttempt}, ${numericIds[i]}, ${did(seed, "sec:Numerical reasoning mini-test:0")},
        ${i}, 1, '[]'::jsonb
      )
    `;
    const answer = { value: NUMERIC[i]!.expected };
    await sql`
      insert into responses (id, company_id, attempt_item_id, answer, revision)
      values (${did(seed, `done-response:${i}`)}, ${companyId}, ${itemId}, ${json(answer)}::jsonb, 1)
    `;
    answers.push({ attempt_item_id: itemId, answer, revision: 1 });
  }
  const weighted = calculateWeightedScore([
    { earned: 4, possible: 4, weightBasisPoints: 10000, status: "FINAL" },
  ]);
  await sql`
    insert into submission_snapshots (id, company_id, attempt_id, answers, content_hash, receipt_id, reason, submitted_at)
    values (
      ${did(seed, "snap")}, ${companyId}, ${doneAttempt}, ${json(answers)}::jsonb, 'seed', ${did(seed, "receipt")},
      'MANUAL', '2026-06-10T15:12:00.000Z'
    )
  `;
  await sql`
    insert into evaluations (
      id, company_id, attempt_id, revision, origin, status, basis_points, numerator, denominator, raw, created_by
    ) values (
      ${did(seed, "eval")}, ${companyId}, ${doneAttempt}, 1, 'AUTOMATIC', 'FINAL', ${weighted.basisPoints},
      ${weighted.numerator}, ${weighted.denominator}, ${json({ sections: [{ title: "Numerical reasoning", earned: 4, possible: 4 }] })}::jsonb,
      'seed'
    )
  `;

  const interviewApp = applicationIds[4]!;
  const interviewId = did(seed, "interview");
  await sql`
    insert into interviews (
      id, company_id, application_id, title, starts_at, ends_at, timezone, location, meeting_url, ics_uid
    ) values (
      ${interviewId}, ${companyId}, ${interviewApp}, 'Engineering interview',
      now() + interval '2 days', now() + interval '2 days 1 hour', 'America/New_York',
      'Northstar — conference room 4', 'https://meet.example/northstar-demo', ${interviewId + "@talentflow.example"}
    )
  `;
  await sql`
    insert into interview_participants (id, company_id, interview_id, user_id)
    values (${did(seed, "participant")}, ${companyId}, ${interviewId}, ${user.id})
  `;

  const offerApp = applicationIds[5]!;
  const offerId = did(seed, "offer");
  await sql`
    insert into offers (id, company_id, application_id, status, current_revision)
    values (${offerId}, ${companyId}, ${offerApp}, 'PENDING_APPROVAL', 1)
  `;
  await sql`
    insert into offer_revisions (
      id, company_id, offer_id, revision, title, salary_minor, currency, start_date, message, created_by
    ) values (
      ${did(seed, "offer-rev")}, ${companyId}, ${offerId}, 1, 'Senior Software Engineer', 18500000, 'USD',
      '2026-11-02', 'Fictional demo terms. Not an employment contract.', ${user.id}
    )
  `;

  await sql`
    insert into workflow_rules (id, company_id, name, enabled, trigger_name, conditions, actions)
    values (
      ${did(seed, "rule-review")}, ${companyId}, 'Ask for review when an assessment is completed', true,
      'ASSESSMENT_COMPLETED', '[]'::jsonb, ${json([{ type: "create_review" }])}::jsonb
    )
  `;
  await sql`
    insert into workflow_rules (id, company_id, name, enabled, trigger_name, conditions, actions)
    values (
      ${did(seed, "rule-off")}, ${companyId}, 'Do not auto-reject on a low score', false,
      'ASSESSMENT_COMPLETED', ${json([{ field: "score", op: "gte", value: "8000" }])}::jsonb,
      ${json([{ type: "move_stage", category: "DECISION" }])}::jsonb
    )
  `;
  await sql`
    insert into mail_messages (id, company_id, to_email, subject, body, status)
    values (
      ${did(seed, "mail")}, ${companyId}, ${user.email}, 'Northstar Labs workspace is ready',
      'This message was captured inside RECRUIT4US. It was not delivered to the public internet.', 'CAPTURED'
    )
  `;
  await sql`
    insert into tags (id, company_id, name) values (${did(seed, "tag")}, ${companyId}, 'Referral')
  `;

  const selfId = did(seed, "self-cand");
  await sql`
    insert into candidates (id, company_id, name, email, email_normalized, source, user_id)
    values (${selfId}, ${companyId}, ${user.name || "You"}, ${user.email}, ${user.emailNormalized}, 'CAREERS', ${user.id})
  `;
  const selfApp = did(seed, "self-app");
  const assessmentStage = platform.stageIds.find((stage) => stage.category === "ASSESSMENT") ?? platform.stageIds[0]!;
  await sql`
    insert into applications (
      id, company_id, job_id, candidate_id, current_stage_id, lifecycle, source, version
    ) values (
      ${selfApp}, ${companyId}, ${platform.jobId}, ${selfId}, ${assessmentStage.id}, 'ACTIVE', 'CAREERS', 1
    )
  `;
  await sql`
    insert into assignments (
      id, company_id, application_id, assessment_version_id, status, start_by, duration_seconds,
      multiplier_basis_points, extra_seconds
    ) values (
      ${did(seed, "self-assign")}, ${companyId}, ${selfApp}, ${numerical.vid}, 'INVITED',
      now() + interval '14 days', 1200, 15000, 120
    )
  `;
  const offerStage = analyst.stageIds.find((stage) => stage.category === "OFFER") ?? analyst.stageIds[0]!;
  const selfOfferApp = did(seed, "self-offer-app");
  const selfOffer = did(seed, "self-offer");
  await sql`
    insert into applications (
      id, company_id, job_id, candidate_id, current_stage_id, lifecycle, source, version
    ) values (
      ${selfOfferApp}, ${companyId}, ${analyst.jobId}, ${selfId}, ${offerStage.id}, 'ACTIVE', 'CAREERS', 1
    )
  `;
  await sql`
    insert into offers (id, company_id, application_id, status, current_revision)
    values (${selfOffer}, ${companyId}, ${selfOfferApp}, 'SENT', 1)
  `;
  await sql`
    insert into offer_revisions (
      id, company_id, offer_id, revision, title, salary_minor, currency, start_date, message, created_by
    ) values (
      ${did(seed, "self-offer-rev")}, ${companyId}, ${selfOffer}, 1, 'Data Analyst', 12800000, 'USD',
      '2026-11-16', 'Fictional demo terms for the signed-in person. Not an employment contract or an e-signature.', ${user.id}
    )
  `;

  await audit(
    { companyId, userId: user.id },
    "demo.seed",
    "company",
    companyId,
    "Northstar Labs demo workspace created. Harbor Analytics was created as a separate employer.",
  );
  return { slug: northSlug, created: true };
}
