-- Tenant isolation for a non-superuser role.
-- The table owner and any superuser bypass row security even when it is forced,
-- so preview sets a local role that cannot bypass it. A missing tenant setting
-- matches no employer row. No vendor credential is stored here.

do $$
declare r record;
begin
  for r in
    select c.relname, p.polname
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and p.polname in ('tenant_isolation', 'context_required')
  loop
    execute format('drop policy if exists %I on %I', r.polname, r.relname);
  end loop;
end $$;

drop function if exists app_row_visible(text);
drop function if exists app_slug_taken(text);
drop function if exists app_company_id_for_slug(text);
drop function if exists app_invite(text);
drop function if exists app_attempt_owner(text);
drop function if exists app_pending_outbox_count();

create or replace function app_row_visible(row_company text)
returns boolean
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select case
    when nullif(current_setting('app.company_id', true), '') is not null then
      row_company is not distinct from current_setting('app.company_id', true)
    when nullif(current_setting('app.public_slug', true), '') is not null then
      exists (
        select 1 from companies c
        where c.id = row_company
          and c.slug = current_setting('app.public_slug', true)
          and c.status = 'ACTIVE'
      )
    when nullif(current_setting('app.user_id', true), '') is not null then
      exists (
        select 1 from memberships m
        where m.company_id = row_company
          and m.user_id = current_setting('app.user_id', true)
          and m.status = 'ACTIVE'
      )
      or exists (
        select 1
        from candidates cand
        join "user" u on u.id = current_setting('app.user_id', true)
        where cand.company_id = row_company
          and u."emailVerified" = true
          and (
            cand.user_id = u.id
            or lower(cand.email_normalized) = lower(u.email)
          )
      )
    else false
  end
$$;

create or replace function app_slug_taken(look text)
returns boolean
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select exists (select 1 from companies where slug = look)
$$;

create or replace function app_company_id_for_slug(look text)
returns text
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select id from companies where slug = look
$$;

create or replace function app_invite(look text)
returns table (
  id text,
  company_id text,
  email text,
  role text,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  slug text
)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select i.id, i.company_id, i.email, i.role, i.expires_at, i.accepted_at, i.revoked_at, c.slug
  from invitations i
  join companies c on c.id = i.company_id
  where i.token_hash = look
$$;

create or replace function app_attempt_owner(look text)
returns table (
  company_id text,
  assignment_id text,
  status text
)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select company_id, assignment_id, status from attempts where id = look
$$;

create or replace function app_pending_outbox_count()
returns bigint
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select count(*) from outbox_events where status = 'PENDING'
$$;

create table if not exists calendar_connections (
  id text primary key,
  company_id text not null references companies (id),
  provider text not null,
  status text not null check (status in ('CONNECTED', 'RECONNECT')),
  secret_ref text not null default '',
  last_error text not null default '',
  refreshed_at timestamptz,
  unique (company_id, provider)
);

create table if not exists code_runs (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  status text not null check (status in ('SUCCEEDED', 'TIMED_OUT', 'FAILED', 'REFUSED')),
  truncated boolean not null default false,
  timed_out boolean not null default false,
  output_excerpt text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

create table if not exists provider_callbacks (
  id text primary key,
  company_id text not null,
  attempt_id text not null,
  event_key text not null,
  status text not null check (status in ('RUNNING', 'SUCCEEDED', 'FAILED')),
  created_at timestamptz not null default now(),
  unique (company_id, event_key),
  foreign key (company_id, attempt_id) references attempts (company_id, id)
);

do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and exists (
        select 1 from pg_attribute a
        where a.attrelid = c.oid and a.attname = 'company_id' and not a.attisdropped
      )
  loop
    execute format('alter table %I enable row level security', r.relname);
    execute format('alter table %I force row level security', r.relname);
    execute format('drop policy if exists tenant_isolation on %I', r.relname);
    execute format(
      'create policy tenant_isolation on %I using (app_row_visible(company_id)) with check (app_row_visible(company_id))',
      r.relname
    );
  end loop;

  execute 'alter table companies enable row level security';
  execute 'alter table companies force row level security';
  execute 'drop policy if exists tenant_isolation on companies';
  execute 'create policy tenant_isolation on companies using (app_row_visible(id)) with check (app_row_visible(id))';

  execute 'alter table idempotency_records enable row level security';
  execute 'alter table idempotency_records force row level security';
  execute 'drop policy if exists context_required on idempotency_records';
  execute $policy$
    create policy context_required on idempotency_records
    using (
      nullif(current_setting('app.company_id', true), '') is not null
      or nullif(current_setting('app.public_slug', true), '') is not null
      or nullif(current_setting('app.user_id', true), '') is not null
    )
    with check (
      nullif(current_setting('app.company_id', true), '') is not null
      or nullif(current_setting('app.public_slug', true), '') is not null
      or nullif(current_setting('app.user_id', true), '') is not null
    )
  $policy$;
end $$;

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
    begin
      execute format('grant app_user to %I', current_user);
    exception
      when insufficient_privilege or duplicate_object then
        null;
    end;
    grant usage on schema public to app_user;
    grant select, insert, update, delete on all tables in schema public to app_user;
    revoke all on table "user", "session", "account", "verification" from app_user;
    grant execute on all functions in schema public to app_user;
  end if;
end $$;
