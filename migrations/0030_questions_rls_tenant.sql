-- Ensure company-scoped RLS on question authoring tables stays usable for the
-- app_user role when app.company_id is set. Does not disable RLS.

do $$
declare t text;
begin
  foreach t in array array['questions', 'question_versions', 'assessment_items', 'assessment_sections', 'assessments', 'assessment_versions', 'candidate_profiles', 'file_objects', 'assignments']
  loop
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      execute format('alter table %I enable row level security', t);
      execute format('alter table %I force row level security', t);
      execute format('drop policy if exists tenant_isolation on %I', t);
      execute format(
        'create policy tenant_isolation on %I using (app_row_visible(company_id)) with check (app_row_visible(company_id))',
        t
      );
    end if;
  end loop;
end $$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    begin
      execute format('grant app_user to %I', current_user);
    exception
      when insufficient_privilege or duplicate_object then
        null;
    end;
    grant select, insert, update, delete on questions, question_versions, assessment_items, assessment_sections, assessments, assessment_versions, candidate_profiles, file_objects, assignments to app_user;
  end if;
end $$;
