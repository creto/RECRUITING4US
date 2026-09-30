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
