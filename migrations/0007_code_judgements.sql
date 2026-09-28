-- Stored judge facts for code answers. Expected outputs are not stored.
-- A timeout leaves basis_points null. Rank is computed when the board is read.

create table if not exists code_judgements (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  attempt_item_id text not null,
  status text not null check (status in ('JUDGED', 'TIMED_OUT', 'FAILED', 'REFUSED')),
  passed integer check (passed is null or passed >= 0),
  total integer check (total is null or total >= 0),
  time_class text not null,
  space_class text not null,
  measured_ms integer check (measured_ms is null or measured_ms >= 0),
  basis_points integer check (basis_points is null or basis_points between 0 and 10000),
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, attempt_item_id),
  unique (company_id, id),
  foreign key (company_id, attempt_id) references attempts (company_id, id),
  foreign key (company_id, attempt_item_id) references attempt_items (company_id, id)
);

alter table code_judgements enable row level security;
alter table code_judgements force row level security;
drop policy if exists tenant_isolation on code_judgements;
create policy tenant_isolation on code_judgements
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on code_judgements to app_user;
  end if;
end $$;
