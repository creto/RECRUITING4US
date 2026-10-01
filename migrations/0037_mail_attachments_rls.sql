-- mail_attachments was created after the tenant grant. The app role could not
-- read it, so every drain that looked for files failed closed.
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
