-- Email OTP unlock for applicant portal and assessment invite gates.
-- Challenges are always company-scoped (fail-closed multi-tenant).

create table if not exists portal_otp_challenges (
  id text primary key,
  company_id text not null references companies (id),
  email_normalized text not null,
  purpose text not null,
  code_hash text not null,
  invite_token text not null default '',
  expires_at timestamptz not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (purpose in ('portal', 'assess')),
  check (attempt_count >= 0),
  check (max_attempts >= 1),
  unique (company_id, id)
);

create index if not exists portal_otp_lookup_idx
  on portal_otp_challenges (company_id, email_normalized, purpose, created_at desc);

create index if not exists portal_otp_email_rate_idx
  on portal_otp_challenges (email_normalized, created_at desc);

-- Resolve which active companies have applications for an email (public gate).
create or replace function app_portal_companies_for_email(look text)
returns table (
  company_id text,
  company_slug text,
  company_name text
)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select distinct co.id, co.slug, co.name
  from candidates c
  join companies co on co.id = c.company_id and co.status = 'ACTIVE'
  join applications a on a.company_id = c.company_id and a.candidate_id = c.id
  where c.email_normalized = lower(trim(look))
  order by co.name
  limit 20
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_portal_companies_for_email(text) to app_user;
  end if;
end $$;

do $$
begin
  alter table portal_otp_challenges enable row level security;
  alter table portal_otp_challenges force row level security;
  drop policy if exists tenant_isolation on portal_otp_challenges;
  create policy tenant_isolation on portal_otp_challenges
    using (app_row_visible(company_id))
    with check (app_row_visible(company_id));
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on portal_otp_challenges to app_user;
  end if;
end $$;
