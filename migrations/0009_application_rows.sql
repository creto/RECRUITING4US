-- One row per application for the downloadable sheet.
-- The confirmation is stored with the row. It is not an email delivery.

create table if not exists application_rows (
  id text primary key,
  company_id text not null,
  job_id text not null,
  application_id text not null,
  receipt text not null,
  name text not null,
  email text not null,
  phone text not null default '',
  cv_name text not null default '',
  cv_result text not null default '',
  answers jsonb not null default '{}'::jsonb,
  source text not null default 'CAREERS',
  submitted_at timestamptz not null default now(),
  unique (company_id, application_id),
  unique (company_id, id),
  foreign key (company_id, job_id) references jobs (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

alter table application_rows enable row level security;
alter table application_rows force row level security;
drop policy if exists tenant_isolation on application_rows;
create policy tenant_isolation on application_rows
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on application_rows to app_user;
  end if;
end $$;
