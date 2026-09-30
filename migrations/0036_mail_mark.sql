-- Which identity the company card shows: both, logo only, or name only.
alter table companies add column if not exists mail_mark text not null default 'both';

alter table companies drop constraint if exists companies_mail_mark;
alter table companies add constraint companies_mail_mark check (mail_mark in ('both', 'logo', 'name'));
