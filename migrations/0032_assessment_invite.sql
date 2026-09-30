-- Unique invite token per assessment assignment. Candidate opens /assess/$token after sign-in.
alter table assignments add column if not exists invite_token text;

update assignments
set invite_token = gen_random_uuid()::text
where invite_token is null or invite_token = '';

alter table assignments alter column invite_token set default gen_random_uuid()::text;
alter table assignments alter column invite_token set not null;

create unique index if not exists assignments_invite_token_uidx
  on assignments (invite_token);

create or replace function app_company_for_assessment(look text)
returns text language sql stable security definer set row_security = off set search_path = public
as $$ select company_id from assignments where invite_token = look limit 1 $$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_company_for_assessment(text) to app_user;
  end if;
end $$;
