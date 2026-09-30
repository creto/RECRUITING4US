-- Applicant portal unlock: resolve company + candidate email from application id
-- without requiring a Better Auth session (same pattern as app_attempt_owner /
-- app_company_for_assessment).

create or replace function app_application_gate(look text)
returns table (
  company_id text,
  email_normalized text,
  candidate_name text
)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select a.company_id, c.email_normalized, c.name
  from applications a
  join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
  join companies co on co.id = a.company_id and co.status = 'ACTIVE'
  where a.id = trim(look)
  limit 1
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_application_gate(text) to app_user;
  end if;
end $$;
