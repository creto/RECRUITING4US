-- Per-assignment proctor flag so recruiters can require camera/focus notes when sending.
alter table assignments add column if not exists proctored boolean not null default false;
