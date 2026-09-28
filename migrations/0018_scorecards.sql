-- Job attributes the recruiter wants interviewers to rate, and the subset
-- assigned to one interview. Ratings stay on interview_feedback. This is not a model.

alter table jobs add column if not exists scorecard_attributes jsonb not null default '[]'::jsonb;
alter table interviews add column if not exists focus_attributes jsonb not null default '[]'::jsonb;
