-- Likert items for the work-style questionnaire.
-- A preference is stored. It is not a correct answer.

alter table questions drop constraint if exists questions_type_check;
alter table questions add constraint questions_type_check check (
  type in (
    'single', 'multi', 'numeric', 'text', 'code', 'file',
    'sql', 'spreadsheet', 'recording', 'likert'
  )
);
