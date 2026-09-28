-- One line on the public careers page. Empty means the page keeps its plain description.

alter table companies
  add column if not exists careers_headline text not null default '';
