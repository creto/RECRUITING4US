do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then
    begin
      create role app_user nosuperuser nobypassrls nologin;
    exception
      when insufficient_privilege then
        null;
    end;
  end if;
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant usage on schema public to app_user;
    grant select, insert, update, delete on all tables in schema public to app_user;
    grant execute on all functions in schema public to app_user;
  end if;
end $$;
