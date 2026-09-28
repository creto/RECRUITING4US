-- Gap closure. New columns are nullable or defaulted so existing rows stay valid.
-- External mail, calendars, boards, and HR systems stay unconfigured until secrets exist.

alter table calendar_connections drop constraint if exists calendar_connections_status_check;
alter table calendar_connections add column if not exists user_id text not null default '';
alter table calendar_connections add column if not exists detail text not null default '';
alter table calendar_connections drop constraint if exists calendar_connections_status_check;
alter table calendar_connections add constraint calendar_connections_status_check
  check (status in ('CONNECTED', 'RECONNECT', 'UNAVAILABLE', 'DEGRADED', 'REVOKED'));

alter table hiring_plans add column if not exists auto_cutoff boolean not null default true;
alter table hiring_stages add column if not exists reviewers integer not null default 1;
alter table hiring_stages add column if not exists entry_rule text not null default '';
alter table hiring_stages add column if not exists exit_rule text not null default '';
alter table hiring_stages add column if not exists assessment_key text not null default '';
alter table hiring_stages add column if not exists scorecard_focus text not null default '';

alter table live_sessions add column if not exists revealed boolean not null default false;
alter table live_sessions add column if not exists active_file text not null default 'solve.js';
alter table live_sessions add column if not exists files jsonb not null default '[]'::jsonb;
alter table live_people add column if not exists cursor_at integer not null default 0;
alter table live_people add column if not exists selection_to integer not null default 0;

create table if not exists live_ops (
  id text primary key,
  company_id text not null references companies (id),
  session_id text not null,
  revision integer not null,
  author text not null,
  at_pos integer not null,
  del_count integer not null,
  insert_text text not null,
  created_at timestamptz not null default now(),
  unique (company_id, session_id, revision),
  foreign key (company_id, session_id) references live_sessions (company_id, id)
);

alter table integrity_policies add column if not exists accommodation_text text not null default '';
alter table integrity_policies add column if not exists retention_days integer not null default 30;
alter table integrity_cases add column if not exists false_positive boolean not null default false;

alter table referrals add column if not exists application_id text;
alter table referrals add column if not exists hired_at timestamptz;

alter table pending_hires add column if not exists location text not null default '';
alter table pending_hires add column if not exists role_title text not null default '';
alter table onboarding_tasks add column if not exists due_at timestamptz;
alter table onboarding_tasks add column if not exists depends_on text not null default '';

create table if not exists hris_pushes (
  id text primary key,
  company_id text not null references companies (id),
  application_id text not null,
  idempotency_key text not null,
  status text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, idempotency_key),
  foreign key (company_id, application_id) references applications (company_id, id)
);

alter table live_ops enable row level security;
alter table live_ops force row level security;
drop policy if exists tenant_isolation on live_ops;
create policy tenant_isolation on live_ops using (app_row_visible(company_id)) with check (app_row_visible(company_id));

alter table hris_pushes enable row level security;
alter table hris_pushes force row level security;
drop policy if exists tenant_isolation on hris_pushes;
create policy tenant_isolation on hris_pushes using (app_row_visible(company_id)) with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on live_ops to app_user;
    grant select, insert, update, delete on hris_pushes to app_user;
  end if;
end $$;
