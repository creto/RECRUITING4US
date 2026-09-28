-- TalentFlow employer data. Tenant isolation is enforced in server queries by
-- membership, and cross-company links are rejected by composite foreign keys.

create table if not exists companies (
  id text primary key,
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/New_York',
  retention_days integer not null default 365 check (retention_days between 30 and 3650),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  demo boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id)
);

create table if not exists memberships (
  id text primary key,
  company_id text not null references companies (id),
  user_id text not null,
  role text not null check (role in (
    'OWNER', 'ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER',
    'ASSESSMENT_AUTHOR', 'ASSESSMENT_REVIEWER', 'ANALYST'
  )),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REMOVED')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id),
  unique (company_id, id)
);

create table if not exists invitations (
  id text primary key,
  company_id text not null references companies (id),
  email text not null,
  role text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id text primary key,
  company_id text not null references companies (id),
  title text not null,
  slug text not null,
  department text not null default '',
  locations text not null default '',
  work_arrangement text not null check (work_arrangement in ('REMOTE', 'HYBRID', 'ONSITE')),
  employment_type text not null check (employment_type in ('FULL_TIME', 'PART_TIME', 'CONTRACT')),
  description text not null default '',
  skills text not null default '',
  salary_min integer,
  salary_max integer,
  salary_currency text not null default 'USD',
  salary_visible boolean not null default false,
  openings integer not null default 1 check (openings > 0),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED')),
  form_schema jsonb not null default '[]'::jsonb,
  published_revision_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, slug)
);

create table if not exists job_revisions (
  id text primary key,
  company_id text not null,
  job_id text not null,
  version_number integer not null check (version_number > 0),
  title text not null,
  description text not null,
  form_schema jsonb not null,
  salary_visible boolean not null default false,
  salary_min integer,
  salary_max integer,
  salary_currency text not null default 'USD',
  published_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, job_id, version_number),
  foreign key (company_id, job_id) references jobs (company_id, id)
);

create table if not exists pipeline_stages (
  id text primary key,
  company_id text not null,
  job_id text not null,
  name text not null,
  category text not null check (category in ('APPLIED', 'SCREEN', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'DECISION')),
  position integer not null check (position >= 0),
  archived boolean not null default false,
  unique (company_id, id),
  foreign key (company_id, job_id) references jobs (company_id, id)
);

create table if not exists candidates (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  email text not null,
  email_normalized text not null,
  phone text,
  source text not null default 'CAREERS',
  user_id text,
  anonymized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, email_normalized)
);

create table if not exists applications (
  id text primary key,
  company_id text not null,
  job_id text not null,
  candidate_id text not null,
  job_revision_id text,
  lifecycle text not null default 'ACTIVE' check (lifecycle in ('ACTIVE', 'REJECTED', 'WITHDRAWN', 'HIRED')),
  current_stage_id text not null,
  version integer not null default 1 check (version > 0),
  source text not null default 'CAREERS',
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  closed_at timestamptz,
  foreign key (company_id, job_id) references jobs (company_id, id),
  foreign key (company_id, candidate_id) references candidates (company_id, id),
  foreign key (company_id, current_stage_id) references pipeline_stages (company_id, id),
  foreign key (company_id, job_revision_id) references job_revisions (company_id, id),
  unique (company_id, id)
);

create unique index if not exists applications_one_active
  on applications (company_id, job_id, candidate_id)
  where lifecycle = 'ACTIVE';

create index if not exists applications_pipeline_idx
  on applications (company_id, job_id, current_stage_id);

create table if not exists application_answers (
  id text primary key,
  company_id text not null,
  application_id text not null,
  field_id text not null,
  value jsonb not null,
  foreign key (company_id, application_id) references applications (company_id, id),
  unique (company_id, application_id, field_id)
);

create table if not exists stage_events (
  id text primary key,
  company_id text not null,
  application_id text not null,
  from_stage_id text,
  to_stage_id text,
  from_lifecycle text,
  to_lifecycle text,
  actor_user_id text,
  reason text,
  created_at timestamptz not null default now(),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create index if not exists stage_events_app_idx on stage_events (company_id, application_id, created_at);

create table if not exists notes (
  id text primary key,
  company_id text not null,
  application_id text not null,
  author_user_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists tags (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  unique (company_id, name),
  unique (company_id, id)
);

create table if not exists candidate_tags (
  company_id text not null,
  candidate_id text not null,
  tag_id text not null,
  primary key (company_id, candidate_id, tag_id),
  foreign key (company_id, candidate_id) references candidates (company_id, id),
  foreign key (company_id, tag_id) references tags (company_id, id)
);

create table if not exists saved_views (
  id text primary key,
  company_id text not null references companies (id),
  user_id text not null,
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id text primary key,
  company_id text not null references companies (id),
  logical_key text not null,
  type text not null check (type in ('single', 'multi', 'numeric', 'text', 'code', 'file')),
  tags text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, logical_key),
  unique (company_id, id)
);

create table if not exists question_versions (
  id text primary key,
  company_id text not null,
  question_id text not null,
  version_number integer not null check (version_number > 0),
  prompt text not null,
  payload jsonb not null,
  key_payload jsonb not null default '{}'::jsonb,
  rubric jsonb,
  points integer not null check (points > 0),
  unique (company_id, id),
  unique (company_id, question_id, version_number),
  foreign key (company_id, question_id) references questions (company_id, id)
);

create table if not exists assessments (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  description text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);

create table if not exists assessment_versions (
  id text primary key,
  company_id text not null,
  assessment_id text not null,
  version_number integer not null check (version_number > 0),
  status text not null check (status in ('DRAFT', 'PUBLISHED')),
  duration_seconds integer not null check (duration_seconds > 0),
  instructions text not null default '',
  score_release text not null default 'NONE' check (score_release in ('NONE', 'AGGREGATE')),
  content_hash text not null default '',
  published_at timestamptz,
  unique (company_id, id),
  unique (company_id, assessment_id, version_number),
  foreign key (company_id, assessment_id) references assessments (company_id, id)
);

create table if not exists assessment_sections (
  id text primary key,
  company_id text not null,
  version_id text not null,
  title text not null,
  position integer not null check (position >= 0),
  weight_basis_points integer not null check (weight_basis_points > 0 and weight_basis_points <= 10000),
  instructions text not null default '',
  unique (company_id, id),
  foreign key (company_id, version_id) references assessment_versions (company_id, id)
);

create table if not exists assessment_items (
  id text primary key,
  company_id text not null,
  section_id text not null,
  question_version_id text not null,
  points integer not null check (points > 0),
  position integer not null check (position >= 0),
  foreign key (company_id, section_id) references assessment_sections (company_id, id),
  foreign key (company_id, question_version_id) references question_versions (company_id, id)
);

create table if not exists assignments (
  id text primary key,
  company_id text not null,
  application_id text not null,
  assessment_version_id text not null,
  status text not null check (status in ('PENDING', 'INVITED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  start_by timestamptz not null,
  hard_finish_by timestamptz,
  duration_seconds integer not null check (duration_seconds > 0),
  multiplier_basis_points integer not null default 10000 check (multiplier_basis_points > 0),
  extra_seconds integer not null default 0 check (extra_seconds >= 0),
  attempt_allowance integer not null default 1 check (attempt_allowance between 1 and 5),
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id),
  foreign key (company_id, assessment_version_id) references assessment_versions (company_id, id)
);

create index if not exists assignments_due_idx on assignments (company_id, status, start_by);

create table if not exists attempts (
  id text primary key,
  company_id text not null,
  assignment_id text not null,
  ordinal integer not null check (ordinal > 0),
  status text not null check (status in (
    'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADING', 'AWAITING_REVIEW', 'COMPLETED', 'VOIDED'
  )),
  started_at timestamptz not null,
  deadline timestamptz not null,
  submitted_at timestamptz,
  submission_reason text,
  unique (company_id, id),
  unique (company_id, assignment_id, ordinal),
  foreign key (company_id, assignment_id) references assignments (company_id, id)
);

create unique index if not exists attempts_one_active
  on attempts (company_id, assignment_id)
  where status in ('NOT_STARTED', 'IN_PROGRESS');

create index if not exists attempts_deadline_idx on attempts (company_id, status, deadline);

create table if not exists attempt_items (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  question_version_id text not null,
  section_id text not null,
  position integer not null,
  points integer not null check (points > 0),
  option_order jsonb not null default '[]'::jsonb,
  unique (company_id, id),
  foreign key (company_id, attempt_id) references attempts (company_id, id),
  foreign key (company_id, question_version_id) references question_versions (company_id, id),
  foreign key (company_id, section_id) references assessment_sections (company_id, id)
);

create table if not exists responses (
  id text primary key,
  company_id text not null,
  attempt_item_id text not null,
  answer jsonb not null,
  revision integer not null default 1 check (revision > 0),
  mutation_id text,
  payload_hash text,
  updated_at timestamptz not null default now(),
  unique (company_id, attempt_item_id),
  foreign key (company_id, attempt_item_id) references attempt_items (company_id, id)
);

create table if not exists response_mutations (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  mutation_id text not null,
  payload_hash text not null,
  attempt_item_id text not null,
  revision integer not null,
  unique (company_id, attempt_id, mutation_id),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

create table if not exists submission_snapshots (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  answers jsonb not null,
  content_hash text not null,
  receipt_id text not null unique,
  reason text not null,
  submitted_at timestamptz not null,
  unique (company_id, attempt_id),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

create table if not exists evaluations (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  revision integer not null check (revision > 0),
  origin text not null check (origin in ('AUTOMATIC', 'MANUAL', 'EXTERNAL')),
  status text not null check (status in ('PENDING', 'FINAL', 'FAILED')),
  basis_points integer,
  numerator text,
  denominator text,
  raw jsonb not null,
  reason text,
  superseded_id text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (company_id, attempt_id, revision),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

create table if not exists review_tasks (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  application_id text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'SUBMITTED')),
  ratings jsonb not null default '{}'::jsonb,
  notes text not null default '',
  assignee_user_id text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  foreign key (company_id, attempt_id) references attempts (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists interviews (
  id text primary key,
  company_id text not null,
  application_id text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  location text not null default '',
  meeting_url text not null default '',
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'CANCELLED', 'COMPLETED')),
  ics_uid text not null,
  ics_sequence integer not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists interview_participants (
  id text primary key,
  company_id text not null,
  interview_id text not null,
  user_id text not null,
  unique (company_id, interview_id, user_id),
  foreign key (company_id, interview_id) references interviews (company_id, id)
);

create table if not exists interview_feedback (
  id text primary key,
  company_id text not null,
  interview_id text not null,
  reviewer_user_id text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED')),
  ratings jsonb not null default '{}'::jsonb,
  recommendation text,
  notes text not null default '',
  submitted_at timestamptz,
  unique (company_id, interview_id, reviewer_user_id),
  foreign key (company_id, interview_id) references interviews (company_id, id)
);

create table if not exists interview_slots (
  id text primary key,
  company_id text not null references companies (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  claimed_application_id text,
  unique (company_id, id)
);

create table if not exists offers (
  id text primary key,
  company_id text not null,
  application_id text not null,
  status text not null check (status in (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'
  )),
  current_revision integer not null default 1,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists offer_revisions (
  id text primary key,
  company_id text not null,
  offer_id text not null,
  revision integer not null check (revision > 0),
  title text not null,
  salary_minor integer not null check (salary_minor >= 0),
  currency text not null,
  start_date date,
  message text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (company_id, offer_id, revision),
  unique (company_id, id),
  foreign key (company_id, offer_id) references offers (company_id, id)
);

create table if not exists offer_approvals (
  id text primary key,
  company_id text not null,
  offer_id text not null,
  revision integer not null,
  approver_user_id text not null,
  decision text not null check (decision in ('APPROVED', 'REJECTED')),
  reason text,
  created_at timestamptz not null default now(),
  unique (company_id, offer_id, revision, approver_user_id),
  foreign key (company_id, offer_id) references offers (company_id, id)
);

create table if not exists offer_responses (
  id text primary key,
  company_id text not null,
  offer_id text not null,
  revision integer not null,
  decision text not null check (decision in ('ACCEPTED', 'DECLINED')),
  comment text,
  responded_at timestamptz not null default now(),
  unique (company_id, offer_id),
  foreign key (company_id, offer_id) references offers (company_id, id)
);

create table if not exists workflow_rules (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  enabled boolean not null default false,
  trigger_name text not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists outbox_events (
  id text primary key,
  company_id text not null,
  event_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSED', 'FAILED')),
  depth integer not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists outbox_pending_idx on outbox_events (status, created_at);

create table if not exists workflow_action_receipts (
  id text primary key,
  company_id text not null,
  event_id text not null,
  rule_id text not null,
  action_index integer not null,
  status text not null,
  detail text not null default '',
  unique (company_id, event_id, rule_id, action_index)
);

create table if not exists audit_events (
  id text primary key,
  company_id text not null,
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_company_idx on audit_events (company_id, created_at);

create table if not exists idempotency_records (
  id text primary key,
  actor_key text not null,
  operation text not null,
  idem_key text not null,
  payload_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (actor_key, operation, idem_key)
);

create table if not exists mail_messages (
  id text primary key,
  company_id text not null references companies (id),
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null check (status in ('CAPTURED', 'FAILED', 'UNKNOWN')),
  related_id text,
  created_at timestamptz not null default now()
);

create table if not exists file_objects (
  id text primary key,
  company_id text not null references companies (id),
  owner_scope text not null,
  owner_id text not null,
  display_name text not null,
  mime text not null,
  size_bytes integer not null,
  content text not null,
  scan_state text not null check (scan_state in ('QUARANTINE', 'CLEAN', 'INFECTED')),
  scan_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists deletion_requests (
  id text primary key,
  company_id text not null,
  candidate_id text not null,
  requested_by text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'COMPLETED')),
  created_at timestamptz not null default now(),
  foreign key (company_id, candidate_id) references candidates (company_id, id)
);

create index if not exists candidates_email_idx on candidates (company_id, email_normalized);
create index if not exists jobs_company_status_idx on jobs (company_id, status);
