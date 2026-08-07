-- ═══════════════════════════════════════════════════════════════
-- PHASE 1B · SYNC BATCHES FROM STUDENTS
-- Your 153 students already carry batch_name, but the formal `batches`
-- table is empty — so admin's Batches tab and headView show nothing.
-- This rebuilds `batches` from the distinct student batch_names and links
-- each student to its batch. Run AFTER phase1-migration.sql.
-- Idempotent: safe to re-run.
-- Project baazubvfsrpmbfmrzumw (check the URL bar!)
-- ═══════════════════════════════════════════════════════════════

-- Make sure the linking column exists (phase1 added it; harmless if present)
alter table batches add column if not exists course_id uuid references courses(id);
alter table batches add column if not exists capacity int;
alter table batches add column if not exists completed_at timestamptz;

-- 1) Create one batch row per distinct, non-empty student batch_name that
--    doesn't already exist. Trainer = the most common trainer for that batch.
insert into batches (name, trainer_id, batch_type, status)
select d.batch_name,
       (select t.id from trainers t
          where lower(t.name) = lower(d.top_trainer) limit 1),
       lower(coalesce(d.top_prog,'')),
       'active'
from (
  select s.batch_name,
         mode() within group (order by s.trainer_name) as top_trainer,
         mode() within group (order by s.programme)    as top_prog
  from students s
  where s.batch_name is not null and btrim(s.batch_name) <> ''
  group by s.batch_name
) d
where not exists (select 1 from batches b where b.name = d.batch_name);

-- 2) Link every student to its batch row.
update students s
set batch_id = b.id
from batches b
where b.name = s.batch_name
  and (s.batch_id is null or s.batch_id <> b.id);

-- 3) Map each batch to a course by programme keyword (fee/progress denominators).
update batches b set course_id = c.id
from courses c
where b.course_id is null and (
      (b.batch_type like '%foundation%' and c.name ilike '%Foundation%')
   or (b.batch_type like '%upgrade%'    and c.name ilike '%Upgrade%')
   or (b.batch_type like '%elite%'      and c.name ilike '%Elite%')
   or (b.batch_type like '%ielts%'      and c.name ilike '%IELTS%')
);

-- Verify:
select 'batches' t, count(*) from batches
union all select 'students linked', count(*) from students where batch_id is not null
union all select 'students total', count(*) from students;
