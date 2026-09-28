-- Visible rank at each gate. A null score means the attempt has no automatic result yet.
-- A later rank does not withdraw an assessment that was already sent.

create table if not exists pipeline_ranks (
  id text primary key,
  company_id text not null,
  application_id text not null,
  job_id text not null,
  gate text not null check (gate in ('EXPERTISE', 'CODING', 'MATH')),
  score integer,
  rank integer not null default 0,
  pool integer not null default 0,
  cutoff integer,
  advanced boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, application_id, gate),
  unique (company_id, id),
  foreign key (company_id, application_id) references applications (company_id, id)
);

create index if not exists pipeline_ranks_job_idx
  on pipeline_ranks (company_id, job_id, gate);

alter table pipeline_ranks enable row level security;
alter table pipeline_ranks force row level security;
drop policy if exists tenant_isolation on pipeline_ranks;
create policy tenant_isolation on pipeline_ranks
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on pipeline_ranks to app_user;
  end if;
end $$;
