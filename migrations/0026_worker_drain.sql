-- Cross-tenant discovery for the outbox worker. Row security hides other
-- companies when app.company_id is unset, so the worker needs a definer scan
-- (same pattern as app_pending_outbox_count). Per-company drain still runs
-- under the normal tenant scope with outbox leases / SKIP LOCKED.

create or replace function app_companies_needing_drain()
returns table (company_id text)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select distinct company_id from outbox_events
  where status = 'PENDING'
    and attempts < 5
    and (lease_until is null or lease_until < now())
  union
  select distinct company_id from message_intents
  where status in ('QUEUED', 'DEFERRED')
    and (scheduled_for is null or scheduled_for <= now())
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_companies_needing_drain() to app_user;
  end if;
end $$;
