-- The auth-off workspace uses the fixed id dev-user. The restricted role cannot
-- write the auth table, so this definer creates that one row and nothing else.

create or replace function app_ensure_dev_user()
returns void
language plpgsql
security definer
set row_security = off
set search_path = public
as $$
begin
  insert into "user" (id, name, email, "emailVerified")
  values ('dev-user', 'Dev User', 'dev@example.com', true)
  on conflict (id) do nothing;
end
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_ensure_dev_user() to app_user;
  end if;
end $$;
