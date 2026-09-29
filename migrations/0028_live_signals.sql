-- Interviewer-only notes from the live pad: screens, leaving the page, and clipboard text.
-- A signal does not change a score.

create table if not exists live_signals (
  id text primary key,
  company_id text not null references companies (id),
  session_id text not null,
  author text not null default '',
  kind text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  foreign key (company_id, session_id) references live_sessions (company_id, id)
);

create index if not exists live_signals_session_idx
  on live_signals (company_id, session_id, created_at desc);

alter table live_signals enable row level security;
alter table live_signals force row level security;
drop policy if exists tenant_isolation on live_signals;
create policy tenant_isolation on live_signals
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on live_signals to app_user;
  end if;
end $$;
