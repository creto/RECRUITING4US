-- Link a live pad to an in-progress assessment attempt so recruiters can watch.
alter table live_sessions add column if not exists attempt_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'live_sessions_attempt_fk'
  ) then
    alter table live_sessions
      add constraint live_sessions_attempt_fk
      foreign key (company_id, attempt_id) references attempts (company_id, id);
  end if;
end $$;

create unique index if not exists live_sessions_attempt_uidx
  on live_sessions (company_id, attempt_id)
  where attempt_id is not null;

create index if not exists attempts_in_progress_idx
  on attempts (company_id, status, started_at desc)
  where status = 'IN_PROGRESS';
