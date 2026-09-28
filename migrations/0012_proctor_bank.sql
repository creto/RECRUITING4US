-- Delivery switches and a local proctor log.
-- auto_send defaults on so a CV that already matched still sends.
-- Proctoring stores events only. It does not store camera frames.

alter table assessments add column if not exists auto_send boolean not null default true;
alter table assessment_versions add column if not exists proctored boolean not null default false;

create table if not exists proctor_events (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  kind text not null check (kind in (
    'CAMERA_GRANTED', 'CAMERA_DENIED', 'CAMERA_ENDED',
    'TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_LEFT',
    'PASTE', 'COPY', 'NO_FACE', 'EXTRA_FACE', 'HEARTBEAT'
  )),
  detail text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

create index if not exists proctor_events_attempt_idx
  on proctor_events (company_id, attempt_id, created_at);

alter table proctor_events enable row level security;
alter table proctor_events force row level security;
drop policy if exists tenant_isolation on proctor_events;
create policy tenant_isolation on proctor_events
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on proctor_events to app_user;
  end if;
end $$;
