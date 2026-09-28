-- Lease columns so a dispatcher can recover abandoned work without Redis.
-- Question types for human-reviewed SQL, spreadsheet, and recording tasks.
-- Those answers are stored. They are not executed in this application.

alter table outbox_events add column if not exists attempts integer not null default 0;
alter table outbox_events add column if not exists lease_until timestamptz;
alter table outbox_events add column if not exists last_error text not null default '';

alter table questions drop constraint if exists questions_type_check;
alter table questions add constraint questions_type_check check (
  type in (
    'single', 'multi', 'numeric', 'text', 'code', 'file',
    'sql', 'spreadsheet', 'recording'
  )
);
