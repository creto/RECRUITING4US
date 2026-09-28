-- Platform expansion. Rows stay inside the tenant. External mail, calendars,
-- job boards, and HR systems are used only when that company has configured them.
-- A missing provider is stored as unavailable. It is not stored as delivered.

create table if not exists message_intents (
  id text primary key,
  company_id text not null references companies (id),
  application_id text,
  candidate_id text,
  job_id text,
  kind text not null,
  template_name text not null default '',
  subject text not null,
  body text not null,
  to_email text not null,
  cc text not null default '',
  bcc text not null default '',
  idempotency_key text not null,
  status text not null default 'QUEUED',
  provider text not null default 'sandbox',
  provider_message_id text not null default '',
  scheduled_for timestamptz,
  thread_token text not null,
  attempt_count integer not null default 0,
  last_error text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  unique (company_id, idempotency_key),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists delivery_attempts (
  id text primary key,
  company_id text not null references companies (id),
  intent_id text not null,
  attempt_no integer not null,
  provider text not null,
  state text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, intent_id, attempt_no),
  foreign key (company_id, intent_id) references message_intents (company_id, id)
);

create table if not exists sandbox_mailbox (
  id text primary key,
  company_id text not null references companies (id),
  intent_id text not null,
  to_email text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  foreign key (company_id, intent_id) references message_intents (company_id, id)
);

create table if not exists inbound_messages (
  id text primary key,
  company_id text not null references companies (id),
  intent_id text,
  application_id text,
  provider_event_id text not null,
  from_email text not null,
  subject text not null default '',
  body text not null default '',
  matched boolean not null default false,
  quarantine_reason text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, provider_event_id)
);

create table if not exists mail_suppressions (
  company_id text not null references companies (id),
  email text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  primary key (company_id, email)
);

create table if not exists coding_questions (
  id text primary key,
  company_id text not null references companies (id),
  slug text not null,
  title text not null,
  difficulty text not null,
  skill_tags text not null default '',
  status text not null default 'DRAFT',
  current_version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (company_id, slug),
  unique (company_id, id)
);

create table if not exists coding_question_versions (
  id text primary key,
  company_id text not null references companies (id),
  question_id text not null,
  version integer not null,
  prompt text not null,
  starter text not null default '',
  entry_name text not null default 'solve',
  explanation text not null default '',
  languages text not null default 'javascript',
  unique (company_id, question_id, version),
  unique (company_id, id),
  foreign key (company_id, question_id) references coding_questions (company_id, id)
);

create table if not exists coding_cases (
  id text primary key,
  company_id text not null references companies (id),
  version_id text not null,
  name text not null,
  visibility text not null,
  args jsonb not null,
  expected jsonb not null,
  weight integer not null default 1,
  position integer not null default 0,
  foreign key (company_id, version_id) references coding_question_versions (company_id, id)
);

create table if not exists code_invites (
  id text primary key,
  company_id text not null references companies (id),
  application_id text,
  question_id text not null,
  version_id text not null,
  token text not null unique,
  candidate_email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id),
  foreign key (company_id, version_id) references coding_question_versions (company_id, id)
);

create table if not exists coding_submissions (
  id text primary key,
  company_id text not null references companies (id),
  invite_id text not null,
  application_id text,
  version_id text not null,
  language text not null default 'javascript',
  source text not null,
  kind text not null,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, invite_id) references code_invites (company_id, id)
);

create table if not exists judge_runs (
  id text primary key,
  company_id text not null references companies (id),
  submission_id text not null,
  status text not null,
  score integer,
  max_score integer,
  passed integer,
  total integer,
  infra boolean not null default false,
  detail text not null default '',
  cases jsonb not null default '[]'::jsonb,
  judge_version text not null default 'node-isolated-1',
  created_at timestamptz not null default now(),
  foreign key (company_id, submission_id) references coding_submissions (company_id, id)
);

create table if not exists live_sessions (
  id text primary key,
  company_id text not null references companies (id),
  application_id text,
  token text not null unique,
  title text not null,
  prompt text not null default '',
  language text not null default 'javascript',
  source text not null default '',
  revision integer not null default 0,
  board jsonb not null default '[]'::jsonb,
  board_revision integer not null default 0,
  meeting_url text not null default '',
  status text not null default 'WAITING',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists live_people (
  id text primary key,
  company_id text not null references companies (id),
  session_id text not null,
  role text not null,
  name text not null,
  user_id text,
  admitted boolean not null default false,
  last_seen timestamptz,
  unique (company_id, session_id, role, name),
  foreign key (company_id, session_id) references live_sessions (company_id, id)
);

create table if not exists live_chat (
  id text primary key,
  company_id text not null references companies (id),
  session_id text not null,
  author text not null,
  body text not null,
  private_note boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (company_id, session_id) references live_sessions (company_id, id)
);

create table if not exists integrity_policies (
  company_id text not null references companies (id),
  assessment_key text not null,
  consent_text text not null,
  allow_paste boolean not null default true,
  webcam_requested boolean not null default false,
  similarity_threshold integer not null default 80,
  primary key (company_id, assessment_key)
);

create table if not exists integrity_events (
  id text primary key,
  company_id text not null references companies (id),
  application_id text,
  attempt_key text not null default '',
  kind text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists integrity_cases (
  id text primary key,
  company_id text not null references companies (id),
  application_id text,
  status text not null default 'OPEN',
  summary text not null,
  score integer,
  disposition text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists prospects (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  email text not null,
  source text not null default 'MANUAL',
  consent text not null default 'UNKNOWN',
  status text not null default 'NEW',
  notes text not null default '',
  application_id text,
  created_at timestamptz not null default now(),
  unique (company_id, email),
  unique (company_id, id)
);

create table if not exists talent_pools (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  unique (company_id, name),
  unique (company_id, id)
);

create table if not exists pool_members (
  company_id text not null references companies (id),
  pool_id text not null,
  prospect_id text not null,
  primary key (company_id, pool_id, prospect_id),
  foreign key (company_id, pool_id) references talent_pools (company_id, id),
  foreign key (company_id, prospect_id) references prospects (company_id, id)
);

create table if not exists referrals (
  id text primary key,
  company_id text not null references companies (id),
  prospect_id text,
  employee_name text not null,
  employee_email text not null,
  role_title text not null,
  status text not null default 'REVIEW',
  incentive_note text not null default '',
  created_at timestamptz not null default now(),
  foreign key (company_id, prospect_id) references prospects (company_id, id)
);

create table if not exists campaigns (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  status text not null default 'DRAFT',
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);

create table if not exists campaign_enrollments (
  id text primary key,
  company_id text not null references companies (id),
  campaign_id text not null,
  prospect_id text not null,
  status text not null default 'QUEUED',
  unique (company_id, campaign_id, prospect_id),
  foreign key (company_id, campaign_id) references campaigns (company_id, id),
  foreign key (company_id, prospect_id) references prospects (company_id, id)
);

create table if not exists job_distributions (
  id text primary key,
  company_id text not null references companies (id),
  job_id text not null,
  board text not null,
  status text not null default 'CONFIG_REQUIRED',
  external_id text not null default '',
  detail text not null default '',
  unique (company_id, job_id, board),
  foreign key (company_id, job_id) references jobs (company_id, id)
);

create table if not exists calendar_connections (
  id text primary key,
  company_id text not null references companies (id),
  user_id text not null,
  provider text not null,
  status text not null,
  detail text not null default '',
  unique (company_id, user_id, provider)
);

create table if not exists booking_links (
  id text primary key,
  company_id text not null references companies (id),
  token text not null unique,
  application_id text,
  title text not null,
  duration_min integer not null default 45,
  timezone text not null,
  status text not null default 'OPEN',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);

create table if not exists booking_slots (
  id text primary key,
  company_id text not null references companies (id),
  link_id text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'OPEN',
  held_by text not null default '',
  unique (company_id, link_id, starts_at),
  foreign key (company_id, link_id) references booking_links (company_id, id)
);

create table if not exists calendar_events (
  id text primary key,
  company_id text not null references companies (id),
  slot_id text,
  provider text not null,
  external_id text not null default '',
  status text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  detail text not null default ''
);

create table if not exists hiring_plans (
  id text primary key,
  company_id text not null references companies (id),
  job_id text not null,
  version integer not null,
  name text not null,
  status text not null default 'DRAFT',
  cutoff_percent integer not null default 50,
  personality_is_cutoff boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, job_id, version),
  unique (company_id, id),
  foreign key (company_id, job_id) references jobs (company_id, id)
);

create table if not exists hiring_stages (
  id text primary key,
  company_id text not null references companies (id),
  plan_id text not null,
  name text not null,
  kind text not null,
  position integer not null,
  foreign key (company_id, plan_id) references hiring_plans (company_id, id)
);

create table if not exists stage_history (
  id text primary key,
  company_id text not null references companies (id),
  application_id text not null,
  from_stage text not null default '',
  to_stage text not null,
  actor_id text,
  reason text not null default '',
  created_at timestamptz not null default now(),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists pending_hires (
  id text primary key,
  company_id text not null references companies (id),
  application_id text not null,
  status text not null default 'PENDING',
  start_note text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, application_id),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create table if not exists onboarding_tasks (
  id text primary key,
  company_id text not null references companies (id),
  hire_id text not null,
  title text not null,
  owner_role text not null default 'RECRUITER',
  status text not null default 'OPEN',
  candidate_visible boolean not null default false,
  position integer not null default 0,
  foreign key (company_id, hire_id) references pending_hires (company_id, id)
);

create table if not exists file_extracts (
  id text primary key,
  company_id text not null references companies (id),
  application_id text,
  filename text not null,
  mime text not null,
  status text not null,
  confidence text not null default '',
  text_excerpt text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists message_intents_queue_idx on message_intents (company_id, status, created_at);
create index if not exists code_invites_token_idx on code_invites (token);
create index if not exists judge_runs_submission_idx on judge_runs (company_id, submission_id);

do $$
declare t text;
begin
  foreach t in array array[
    'message_intents','delivery_attempts','sandbox_mailbox','inbound_messages','mail_suppressions',
    'coding_questions','coding_question_versions','coding_cases','code_invites','coding_submissions','judge_runs',
    'live_sessions','live_people','live_chat',
    'integrity_policies','integrity_events','integrity_cases',
    'prospects','talent_pools','pool_members','referrals','campaigns','campaign_enrollments','job_distributions',
    'calendar_connections','booking_links','booking_slots','calendar_events',
    'hiring_plans','hiring_stages','stage_history',
    'pending_hires','onboarding_tasks','file_extracts'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format('create policy tenant_isolation on %I using (app_row_visible(company_id)) with check (app_row_visible(company_id))', t);
  end loop;
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    foreach t in array array[
      'message_intents','delivery_attempts','sandbox_mailbox','inbound_messages','mail_suppressions',
      'coding_questions','coding_question_versions','coding_cases','code_invites','coding_submissions','judge_runs',
      'live_sessions','live_people','live_chat',
      'integrity_policies','integrity_events','integrity_cases',
      'prospects','talent_pools','pool_members','referrals','campaigns','campaign_enrollments','job_distributions',
      'calendar_connections','booking_links','booking_slots','calendar_events',
      'hiring_plans','hiring_stages','stage_history',
      'pending_hires','onboarding_tasks','file_extracts'
    ]
    loop
      execute format('grant select, insert, update, delete on %I to app_user', t);
    end loop;
  end if;
end $$;

create or replace function app_company_for_booking(look text)
returns text language sql stable security definer set row_security = off set search_path = public
as $$ select company_id from booking_links where token = look limit 1 $$;

create or replace function app_company_for_live(look text)
returns text language sql stable security definer set row_security = off set search_path = public
as $$ select company_id from live_sessions where token = look limit 1 $$;

create or replace function app_company_for_code(look text)
returns text language sql stable security definer set row_security = off set search_path = public
as $$ select company_id from code_invites where token = look limit 1 $$;

create or replace function app_company_for_thread(look text)
returns text language sql stable security definer set row_security = off set search_path = public
as $$ select company_id from message_intents where thread_token = look limit 1 $$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_company_for_booking(text) to app_user;
    grant execute on function app_company_for_live(text) to app_user;
    grant execute on function app_company_for_code(text) to app_user;
    grant execute on function app_company_for_thread(text) to app_user;
  end if;
end $$;

