-- Sandbox limits, captured texts, and analytics extracts.
-- A sandbox is a Node process limit. A text is stored, not sent.
-- An extract is posted only when a destination has been saved.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'assessments' and column_name = 'sandbox_profile_id'
  ) then
    alter table assessments add column sandbox_profile_id text;
  end if;
end $$;

create table if not exists sandbox_profiles (
  id text primary key,
  company_id text not null,
  name text not null,
  runtime text not null default 'node' check (runtime = 'node'),
  timeout_ms integer not null check (timeout_ms between 200 and 5000),
  max_output_chars integer not null check (max_output_chars between 200 and 8000),
  network text not null default 'denied' check (network = 'denied'),
  filesystem text not null default 'denied' check (filesystem = 'denied'),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, name)
);

create table if not exists company_configs (
  company_id text primary key references companies (id),
  text_sender_label text not null default 'RECRUIT4US',
  bi_destination text not null default '',
  bi_dataset text not null default 'pipeline',
  created_at timestamptz not null default now()
);

create table if not exists text_messages (
  id text primary key,
  company_id text not null,
  to_phone text not null default '',
  body text not null,
  status text not null check (status in ('CAPTURED', 'REFUSED')),
  reason text not null,
  related_id text,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);

create table if not exists bi_deliveries (
  id text primary key,
  company_id text not null,
  dataset text not null,
  row_count integer not null,
  status text not null check (status in ('CAPTURED', 'DELIVERED', 'REFUSED', 'FAILED')),
  destination text not null default '',
  detail text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);

alter table sandbox_profiles enable row level security;
alter table sandbox_profiles force row level security;
alter table company_configs enable row level security;
alter table company_configs force row level security;
alter table text_messages enable row level security;
alter table text_messages force row level security;
alter table bi_deliveries enable row level security;
alter table bi_deliveries force row level security;

drop policy if exists tenant_isolation on sandbox_profiles;
create policy tenant_isolation on sandbox_profiles
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));
drop policy if exists tenant_isolation on company_configs;
create policy tenant_isolation on company_configs
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));
drop policy if exists tenant_isolation on text_messages;
create policy tenant_isolation on text_messages
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));
drop policy if exists tenant_isolation on bi_deliveries;
create policy tenant_isolation on bi_deliveries
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on sandbox_profiles to app_user;
    grant select, insert, update, delete on company_configs to app_user;
    grant select, insert, update, delete on text_messages to app_user;
    grant select, insert, update, delete on bi_deliveries to app_user;
  end if;
end $$;
