# Build plan

The specification's eight phases were adapted to the TanStack runtime.

1. Foundation — auth, companies, memberships, invitations, composite foreign keys. Done.
2. Hiring — jobs, careers pages, applications, pipeline, notes, tags, CSV. Done for the demo scope.
3. Assessments — question versions, publish checks, assignments, start, autosave, submit, objective grading. Done.
4. Human review and execution — rubrics and review tasks done. Isolated execution is an explicit unavailable state, not a fake score.
5. Workflows — versioned rules, simulation, outbox, captured mail. Done without a separate queue.
6. Interviews and offers — scheduling, ICS, feedback release, approval, candidate response. Done.
7. Reports, privacy, seed. Reports and anonymize/deletion requests are in. Load tests and retention sweeps across backups are not.
8. Hardening — domain tests, typecheck, production build, and a browser pass of the main journeys. The specification's Playwright, RLS, and load suites are not present.

Overall delivery against the original master prompt is **incomplete**. The in-browser product covers the hiring loop. The infrastructure the prompt required (Docker, Redis, MinIO, RLS, Judge0, Playwright journeys) is not this runtime.
