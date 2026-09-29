-- Public progress lookup. The caller does not choose a company. The function
-- returns only the stage bar: no notes, pay, scores, or contact fields.

create or replace function app_track_applications(kind text, value text)
returns table (
  job_title text,
  company_name text,
  stage_name text,
  category text,
  lifecycle text,
  stages text
)
language sql
stable
security definer
set row_security = off
set search_path = public
as $$
  select j.title, co.name, s.name, s.category, a.lifecycle,
    coalesce((
      select json_agg(json_build_object('name', ps.name) order by ps.position)::text
      from pipeline_stages ps
      where ps.company_id = a.company_id and ps.job_id = a.job_id and ps.archived = false
    ), '[]')
  from applications a
  join candidates c on c.company_id = a.company_id and c.id = a.candidate_id
  join jobs j on j.company_id = a.company_id and j.id = a.job_id
  join companies co on co.id = a.company_id and co.status = 'ACTIVE'
  join pipeline_stages s on s.company_id = a.company_id and s.id = a.current_stage_id
  where (
      kind = 'email' and c.email_normalized = lower(trim(value))
    ) or (
      kind = 'id' and a.id = trim(value)
    ) or (
      kind = 'receipt'
      and upper(substr(regexp_replace(a.id, '[^a-zA-Z0-9]', '', 'g'), 1, 8)) = upper(trim(value))
    )
  order by a.submitted_at desc
  limit 20
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function app_track_applications(text, text) to app_user;
  end if;
end $$;
