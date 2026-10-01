alter table jobs add column if not exists closes_on date;
alter table jobs add column if not exists screen_strictness integer not null default 50;

alter table jobs drop constraint if exists jobs_screen_strictness_range;
alter table jobs add constraint jobs_screen_strictness_range check (screen_strictness between 0 and 100);
