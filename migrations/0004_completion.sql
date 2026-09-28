-- Pools, deadline history, short-lived downloads, webhook receipts, and bulk progress.
-- No remote services are configured by this migration.

alter table assessment_sections add column if not exists pool_pick integer;
alter table assessment_sections drop constraint if exists assessment_sections_pool_pick_check;
alter table assessment_sections add constraint assessment_sections_pool_pick_check
  check (pool_pick is null or pool_pick > 0);

create table if not exists attempt_extensions (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  previous_deadline timestamptz not null,
  deadline timestamptz not null,
  reason text not null,
  actor_user_id text,
  created_at timestamptz not null default now(),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

create table if not exists file_grants (
  id text primary key,
  company_id text not null,
  file_id text not null,
  user_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists file_grants_lookup_idx on file_grants (id, user_id, expires_at);

create table if not exists webhook_receipts (
  id text primary key,
  company_id text not null,
  provider text not null,
  event_key text not null,
  created_at timestamptz not null default now(),
  unique (company_id, provider, event_key)
);

create table if not exists bulk_runs (
  id text primary key,
  company_id text not null,
  cursor_index integer not null default 0,
  total integer not null,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
