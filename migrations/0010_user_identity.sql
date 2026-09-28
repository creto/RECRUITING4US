-- The restricted role cannot read auth tables. Identity lookups go through
-- this definer so a signed-in person can still be resolved by id.

create or replace function app_user_identity(look text)
returns table (
  id text,
  email text,
  name text,
  email_verified boolean
)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select u.id, u.email, u.name, u."emailVerified"
  from "user" u
  where u.id = look
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_user_identity(text) to app_user;
  end if;
end $$;
