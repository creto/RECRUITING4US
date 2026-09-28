-- Structured fields taken from CV text. The original file stays in file_objects.
-- A missing word means the person does not match a Boolean search. It is not a model score.

create table if not exists candidate_profiles (
  id text primary key,
  company_id text not null,
  application_id text not null,
  file_id text,
  titles jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  locations jsonb not null default '[]'::jsonb,
  years integer,
  history jsonb not null default '[]'::jsonb,
  indexed_text text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, application_id),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create index if not exists candidate_profiles_company_idx
  on candidate_profiles (company_id, application_id);

alter table candidate_profiles enable row level security;
alter table candidate_profiles force row level security;
drop policy if exists tenant_isolation on candidate_profiles;
create policy tenant_isolation on candidate_profiles
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on candidate_profiles to app_user;
  end if;
end $$;
