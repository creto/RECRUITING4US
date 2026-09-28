import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const Slug = z.string().regex(/^[a-z0-9-]{2,48}$/);

export const listMyCompanies = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await import("./talent/workspace.server");
    return api.listMyCompanies(context.userId);
  });

export const createCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ name: z.string().trim().min(2).max(80), timezone: z.string().min(1).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.createCompany(userId, data);
  });

export const seedDemo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await import("./talent/seed.server");
    return api.seedDemo(context.userId);
  });

export const getWorkspace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.getWorkspace(userId, data.slug);
  });

export const updateCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    name: z.string().trim().min(2).max(80),
    timezone: z.string().min(1).max(80),
    retentionDays: z.number().int().min(30).max(3650),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.updateCompany(userId, data);
  });

export const listMembers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.listMembers(userId, data.slug);
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, email: z.string().trim().max(200), role: z.string().max(40) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.inviteMember(userId, data);
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, inviteId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.revokeInvite(userId, data);
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ token: z.string().min(20).max(200) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.acceptInvite(userId, data.token);
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, membershipId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.removeMember(userId, data);
  });

export const listJobs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.listJobs(userId, data.slug);
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, jobId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.getJob(userId, data.slug, data.jobId) as any;
  });

export const createJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    title: z.string().trim().min(2).max(140),
    department: z.string().max(80),
    locations: z.string().max(120),
    workArrangement: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
    description: z.string().max(20000),
    skills: z.string().max(400),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.createJob(userId, data);
  });

export const updateJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    jobId: z.string().min(8).max(80),
    title: z.string().trim().min(2).max(140),
    department: z.string().max(80),
    locations: z.string().max(120),
    workArrangement: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
    description: z.string().max(20000),
    skills: z.string().max(400),
    salaryMin: z.number().int().nullable(),
    salaryMax: z.number().int().nullable(),
    salaryCurrency: z.string().max(8),
    salaryVisible: z.boolean(),
    openings: z.number().int().min(1).max(100),
    formSchema: z.array(z.record(z.string(), z.unknown())).max(30),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.updateJob(userId, data);
  });

export const setJobStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, jobId: z.string().min(8).max(80), status: z.string().max(20) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.setJobStatus(userId, data);
  });

export const archiveStage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, stageId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.archiveStage(userId, data);
  });

export const listPipeline = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, jobId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.listPipeline(userId, data.slug, data.jobId);
  });

export const moveApplication = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    applicationId: z.string().min(8).max(80),
    toStageId: z.string().min(8).max(80),
    expectedVersion: z.number().int().positive(),
    reason: z.string().max(400).optional(),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.moveApplication(userId, data);
  });

export const setLifecycle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    applicationId: z.string().min(8).max(80),
    lifecycle: z.enum(["ACTIVE", "REJECTED", "WITHDRAWN", "HIRED"]),
    expectedVersion: z.number().int().positive(),
    reason: z.string().min(1).max(400),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.setLifecycle(userId, data);
  });

export const bulkMove = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    applicationIds: z.array(z.string()).max(50),
    toStageId: z.string().min(8).max(80),
    reason: z.string().max(400),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.bulkMove(userId, data);
  });

export const listCandidates = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    query: z.string().max(120).optional(),
    source: z.string().max(40).optional(),
    tag: z.string().max(40).optional(),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.listCandidates(userId, data);
  });

export const getApplication = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, applicationId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.getApplication(userId, data.slug, data.applicationId) as any;
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, applicationId: z.string().min(8).max(80), body: z.string().max(4000) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.addNote(userId, data);
  });

export const addTag = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, applicationId: z.string().min(8).max(80), tag: z.string().max(40) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.addTag(userId, data);
  });

export const exportCsv = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.exportCsv(userId, data.slug);
  });

export const importCsv = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, csv: z.string().max(200_000), commit: z.boolean() }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.importCsv(userId, data);
  });

export const listPublicJobs = createServerFn({ method: "POST" })
  .validator(z.object({
    companySlug: Slug,
    q: z.string().max(80).optional(),
    department: z.string().max(80).optional(),
    workArrangement: z.string().max(20).optional(),
  }))
  .handler(async ({ data }) => {
    const api = await import("./talent/workspace.server");
    return api.listPublicJobs(data);
  });

export const getPublicJob = createServerFn({ method: "POST" })
  .validator(z.object({ companySlug: Slug, jobSlug: z.string().regex(/^[a-z0-9-]{2,80}$/) }))
  .handler(async ({ data }) => {
    const api = await import("./talent/workspace.server");
    return api.getPublicJob(data.companySlug, data.jobSlug);
  });

const applySchema = z.object({
  companySlug: Slug,
  jobSlug: z.string().regex(/^[a-z0-9-]{2,80}$/),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(200),
  phone: z.string().max(40).optional(),
  answers: z.record(z.string(), z.string().max(8000)),
  idempotencyKey: z.string().min(8).max(80),
  resume: z.object({
    name: z.string().max(180),
    mime: z.string().max(80),
    dataBase64: z.string().max(900_000),
  }).nullable().optional(),
});

export const submitApplicationPublic = createServerFn({ method: "POST" })
  .validator(applySchema)
  .handler(async ({ data }) => {
    const api = await import("./talent/workspace.server");
    return api.submitApplication({ ...data, sessionUserId: null });
  });

export const submitApplicationAuthed = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(applySchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.submitApplication({ ...data, sessionUserId: userId });
  });

export const listAudit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.listAudit(userId, data.slug) as any;
  });

export const listMail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.listMail(userId, data.slug) as any;
  });

export const anonymizeCandidate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, candidateId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.anonymizeCandidate(userId, data);
  });

export const listDeletionRequests = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.listDeletionRequests(userId, data.slug) as any;
  });

export const integrationStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
  return api.integrationStatus(userId, data.slug);
  });

export const readFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, fileId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/workspace.server");
    return api.readFile(userId, data.slug, data.fileId);
  });

export const readGrantedFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ grantId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/workspace.server");
    return api.readGrantedFile(context.userId, data.grantId);
  });

export const mergeCandidates = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    keepId: z.string().min(8).max(80),
    dropEmail: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    commit: z.boolean(),
  }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/workspace.server");
    return api.mergeCandidates(context.userId, data);
  });

export const runRetention = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/workspace.server");
    return api.runRetention(context.userId, data.slug);
  });

export const extendAttempt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    attemptId: z.string().min(8).max(80),
    extraSeconds: z.number().int().min(1).max(7200),
    reason: z.string().min(1).max(400),
  }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/assess.server");
    return api.extendAttempt(context.userId, data);
  });

export const importExternalScore = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    attemptId: z.string().min(8).max(80),
    provider: z.string().min(2).max(80),
    raw: z.string().min(1).max(40),
    scaleMin: z.string().min(1).max(40),
    scaleMax: z.string().min(1).max(40),
  }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/assess.server");
    return api.importExternalScore(context.userId, data);
  });

export const exportMine = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await import("./talent/assess.server");
    return api.exportMine(context.userId);
  });

export const archiveAssessment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, assessmentId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/assess.server");
    return api.archiveAssessment(context.userId, data);
  });

export const receiveWebhook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    provider: z.string().min(2).max(40),
    eventKey: z.string().min(2).max(120),
    body: z.string().max(8000),
    signature: z.string().max(200).nullable(),
  }))
  .handler(async ({ context, data }) => {
    const api = await import("./talent/workflows.server");
    return api.receiveWebhook(context.userId, data);
  });

export const listAssessments = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
  return api.listAssessments(userId, data.slug) as any;
  });

export const listQuestions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
  return api.listQuestions(userId, data.slug) as any;
  });

export const createQuestion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    type: z.enum(["single", "multi", "numeric", "text", "code", "file", "sql", "spreadsheet", "recording"]),
    prompt: z.string().min(3).max(8000),
    tags: z.string().max(120),
    points: z.number().int().min(1).max(100),
    options: z.array(z.object({ id: z.string().max(20), label: z.string().max(500) })).max(8),
    correct: z.array(z.string()).max(8),
    expected: z.string().max(40).optional(),
    absTolerance: z.string().max(20).optional(),
    relTolerance: z.string().max(20).optional(),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.createQuestion(userId, data);
  });

export const createAssessment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    name: z.string().min(2).max(160),
    description: z.string().max(2000),
    durationSeconds: z.number().int().min(60).max(14400),
    scoreRelease: z.enum(["NONE", "AGGREGATE"]),
    instructions: z.string().max(4000),
    sections: z.array(z.object({
      title: z.string().min(1).max(120),
      weightBasisPoints: z.number().int().min(0).max(10000),
      poolPick: z.number().int().min(1).max(40).nullable().optional(),
      questionVersionIds: z.array(z.string().min(8).max(80)).min(1).max(40),
    })).min(1).max(8),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.createAssessment(userId, data);
  });

export const publishAssessment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, assessmentId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.publishAssessment(userId, data);
  });

export const assignAssessment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    applicationId: z.string().min(8).max(80),
    assessmentId: z.string().min(8).max(80),
    startBy: z.string().max(40),
    multiplierBasisPoints: z.number().int().min(10000).max(30000),
    extraSeconds: z.number().int().min(0).max(7200),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.assignAssessment(userId, data);
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await import("./talent/assess.server");
    return api.listMyApplications(context.userId);
  });

export const getMyApplication = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ applicationId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.getMyApplication(userId, data.applicationId) as any;
  });

export const withdrawMine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ applicationId: z.string().min(8).max(80), reason: z.string().min(1).max(400) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.withdrawMine(userId, data.applicationId, data.reason);
  });

export const startAttempt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ assignmentId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.startAttempt(userId, data.assignmentId);
  });

export const getAttempt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ attemptId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.getAttempt(userId, data.attemptId);
  });

export const saveResponse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    attemptId: z.string().min(8).max(80),
    itemId: z.string().min(8).max(80),
    answer: z.unknown(),
    expectedRevision: z.number().int().min(0),
    mutationId: z.string().min(8).max(80),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.saveResponse(userId, data);
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    attemptId: z.string().min(8).max(80),
    expectedRevisions: z.record(z.string(), z.number().int()),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.submitAttempt(userId, data);
  });

export const listReviews = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
  return api.listReviews(userId, data.slug) as any;
  });

export const getReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, reviewId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.getReview(userId, data.slug, data.reviewId);
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    reviewId: z.string().min(8).max(80),
    ratings: z.record(z.string(), z.number()),
    notes: z.string().max(4000),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.submitReview(userId, data);
  });

export const requestSampleRun = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ attemptId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
  return api.sampleRun();
  });

export const listInterviews = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
  return api.listInterviews(userId, data.slug) as any;
  });

export const scheduleInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    applicationId: z.string().min(8).max(80),
    title: z.string().min(2).max(140),
    localStart: z.string().max(20),
    localEnd: z.string().max(20),
    timezone: z.string().max(80),
    location: z.string().max(200),
    meetingUrl: z.string().max(300),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.scheduleInterview(userId, data);
  });

export const interviewIcs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, interviewId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.interviewIcs(userId, data.slug, data.interviewId);
  });

export const cancelInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, interviewId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.cancelInterview(userId, data);
  });

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    interviewId: z.string().min(8).max(80),
    ratings: z.record(z.string(), z.number()),
    recommendation: z.string().max(40),
    notes: z.string().max(4000),
    submit: z.boolean(),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.submitFeedback(userId, data);
  });

export const feedbackFor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, interviewId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.feedbackFor(userId, data.slug, data.interviewId) as any;
  });

export const createSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    localStart: z.string().max(20),
    localEnd: z.string().max(20),
    timezone: z.string().max(80),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.createSlot(userId, data);
  });

export const listSlots = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
  return api.listSlots(userId, data.slug) as any;
  });

export const claimSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slotId: z.string().min(8).max(80), applicationId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.claimSlot(userId, data.slotId, data.applicationId);
  });

export const listOffers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
  return api.listOffers(userId, data.slug);
  });

export const createOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    applicationId: z.string().min(8).max(80),
    title: z.string().min(2).max(140),
    salaryMinor: z.number().int().min(0),
    currency: z.string().max(8),
    startDate: z.string().max(20),
    message: z.string().max(4000),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.createOffer(userId, data);
  });

export const approveOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, offerId: z.string().min(8).max(80), revision: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.approveOffer(userId, data);
  });

export const sendOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, offerId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.sendOffer(userId, data);
  });

export const getMyOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ offerId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
  return api.getMyOffer(userId, data.offerId);
  });

export const respondToOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    offerId: z.string().min(8).max(80),
    revision: z.number().int().positive(),
    decision: z.enum(["ACCEPTED", "DECLINED"]),
    comment: z.string().max(2000),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.respondToOffer(userId, data);
  });

export const getReports = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.getReports(userId, data.slug, data.from);
  });

export const listRules = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
  return api.listRules(userId, data.slug) as any;
  });

export const upsertRule = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    slug: Slug,
    id: z.string().max(80).optional(),
    name: z.string().min(2).max(140),
    enabled: z.boolean(),
    trigger: z.string().max(40),
    conditions: z.array(z.record(z.string(), z.unknown())).max(12),
    actions: z.array(z.record(z.string(), z.unknown())).max(6),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/schedule.server");
    return api.upsertRule(userId, data);
  });

export const simulateRule = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: Slug, ruleId: z.string().min(8).max(80), applicationId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const actorApi = await import("./talent/db.server");
    const actor = await actorApi.requireActor(userId, data.slug);
    const api = await import("./talent/workflows.server");
    return api.simulate(actor.companyId, data.ruleId, data.applicationId);
  });

export const requestDeletion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ applicationId: z.string().min(8).max(80) }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const api = await import("./talent/assess.server");
    return api.requestDeletion(userId, data.applicationId);
  });
