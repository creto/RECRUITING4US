-- Per-company outbound mail identity. Empty fields fall back to the company name
-- and no logo. The logo bytes are a small PNG or JPEG, not a document.

alter table companies
  add column if not exists mail_from_name text not null default '',
  add column if not exists mail_footer text not null default '',
  add column if not exists mail_logo_url text not null default '',
  add column if not exists mail_logo_mime text not null default '',
  add column if not exists mail_logo_bytes text not null default '';
