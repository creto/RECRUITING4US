-- Candidate mail written inside the product. Status stays CAPTURED.
-- Nothing here is handed to an outside mail server.

alter table mail_messages add column if not exists from_name text not null default '';
alter table mail_messages add column if not exists from_email text not null default '';
alter table mail_messages add column if not exists application_id text;
alter table mail_messages add column if not exists cc text not null default '';
alter table mail_messages add column if not exists author text not null default 'STAFF';

alter table mail_messages drop constraint if exists mail_messages_author_check;
alter table mail_messages add constraint mail_messages_author_check check (author in ('STAFF', 'CANDIDATE'));

alter table mail_messages drop constraint if exists mail_messages_application_fk;
alter table mail_messages
  add constraint mail_messages_application_fk
  foreign key (company_id, application_id) references applications (company_id, id);

create index if not exists mail_messages_application_idx
  on mail_messages (company_id, application_id);

create table if not exists email_templates (
  id text primary key,
  company_id text not null references companies (id),
  name text not null,
  subject text not null,
  body text not null,
  created_by text,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, name)
);

alter table email_templates enable row level security;
alter table email_templates force row level security;
drop policy if exists tenant_isolation on email_templates;
create policy tenant_isolation on email_templates
  using (app_row_visible(company_id))
  with check (app_row_visible(company_id));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on email_templates to app_user;
  end if;
end $$;
