# Architecture

RECRUIT4US is a modular monolith. The browser talks to TanStack Start server functions. Those functions authenticate with Better Auth, check a company membership, and query PostgreSQL through a parameterized tagged template.

```text
Public careers / candidate portal / recruiter workspace
        |
        v
src/server/talent.functions.ts   (validated RPC, auth middleware)
        |
        v
workspace.server.ts  assess.server.ts  schedule.server.ts  workflows.server.ts
        |
        v
PostgreSQL (PGLite in preview, Neon when configured)
```

Trust boundaries:

- A company slug or id in the request is a request to access that company, not proof of membership.
- Candidate routes resolve the signed-in user and only rows linked by `candidates.user_id` or a verified email match.
- Public careers read published jobs only.
- `key_payload` is selected only inside grading and publish checks. Candidate attempt DTOs expose prompts, options, and the candidate's own answers.

State changes that should notify automation call `rememberEvent` inside `withTransaction` when the write must commit with its outbox row. Drain leases a bounded batch. Action receipts make a replay a no-op. Chain depth stops at 4. Simulation does not write. Preview uses one database connection, so queries take a process mutex and an open transaction binds that connection for its nested calls.

Deadline checks use database `now()` compared with `attempts.deadline`. The boundary is exclusive. A late submit freezes already acknowledged answers and does not accept new answer content.
