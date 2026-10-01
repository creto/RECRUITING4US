-- Files queued with a message. Bytes are base64. The drain attaches them on send.
create table if not exists mail_attachments (
  id text primary key,
  company_id text not null references companies (id),
  intent_id text not null,
  filename text not null,
  mime text not null,
  bytes text not null,
  unique (company_id, id),
  foreign key (company_id, intent_id) references message_intents (company_id, id)
);

create index if not exists mail_attachments_intent_idx on mail_attachments (company_id, intent_id);

do $$
begin
  alter table mail_attachments enable row level security;
  alter table mail_attachments force row level security;
  drop policy if exists tenant_isolation on mail_attachments;
  create policy tenant_isolation on mail_attachments
    using (app_row_visible(company_id))
    with check (app_row_visible(company_id));
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant select, insert, update, delete on mail_attachments to app_user;
  end if;
end $$;
