-- Keyword screen of an uploaded CV. The result is not a model score.
-- A later screen does not withdraw an assessment that was already sent.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'screen_required'
  ) then
    alter table jobs add column screen_required jsonb not null default '[]'::jsonb;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'screen_preferred'
  ) then
    alter table jobs add column screen_preferred jsonb not null default '[]'::jsonb;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'screen_assessment_id'
  ) then
    alter table jobs add column screen_assessment_id text;
  end if;
end $$;

create table if not exists cv_screens (
  id text primary key,
  company_id text not null,
  application_id text not null,
  file_id text,
  fit text not null check (fit in ('GOOD', 'NOT_A_FIT', 'NEEDS_A_PERSON')),
  action text not null check (action in ('SEND', 'DO_NOT_SEND')),
  matched_required jsonb not null default '[]'::jsonb,
  missing_required jsonb not null default '[]'::jsonb,
  matched_preferred jsonb not null default '[]'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  assignment_id text,
  created_at timestamptz not null default now(),
  unique (company_id, application_id),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

alter table cv_screens enable row level security;
alter table cv_screens force row level security;
drop policy if exists tenant_isolation on cv_screens;
create policy tenant_isolation on cv_screens
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on cv_screens to app_user;
  end if;
end $$;
