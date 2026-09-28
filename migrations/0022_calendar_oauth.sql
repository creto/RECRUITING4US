-- OAuth tokens stay on the connection row and are not selected into the calendar page.
-- Existing bookings remain valid. A missing token is not a confirmed external event.

alter table calendar_connections add column if not exists refresh_token text not null default '';
alter table calendar_connections add column if not exists access_token text not null default '';
alter table calendar_connections add column if not exists access_expires_at timestamptz;
