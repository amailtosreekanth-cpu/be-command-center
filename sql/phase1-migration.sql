-- ═══════════════════════════════════════════════════════════════
-- BROKEN ENGLISH · PHASE 1 MIGRATION (courses / batches / trainers /
-- payments / attendance / timeclock scaffolding)
-- Run ONCE in Supabase SQL editor · project baazubvfsrpmbfmrzumw
-- (verify the URL bar shows baazubvfsrpmbfmrzumw before running!)
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════

alter table roles drop constraint if exists roles_role_check;

-- ── Courses (fee defined here, per your spec) ──
create table if not exists courses(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_group int default 0,
  total_mc int default 0,
  total_oneonone int default 0,
  total_sessions int default 0,          -- flat-count courses (e.g. Speaking 25)
  duration_days int default 60,
  default_days text default 'Mon, Tue, Wed, Thu',
  mc_day text default 'Sat',
  fee numeric default 0,
  active boolean default true,
  created_at timestamptz default now());

-- If a courses table already existed (older build), add any missing columns:
alter table courses add column if not exists name text;
alter table courses add column if not exists total_group int default 0;
alter table courses add column if not exists total_mc int default 0;
alter table courses add column if not exists total_oneonone int default 0;
alter table courses add column if not exists total_sessions int default 0;
alter table courses add column if not exists duration_days int default 60;
alter table courses add column if not exists default_days text default 'Mon, Tue, Wed, Thu';
alter table courses add column if not exists mc_day text default 'Sat';
alter table courses add column if not exists fee numeric default 0;
alter table courses add column if not exists active boolean default true;
alter table courses add column if not exists created_at timestamptz default now();

-- ── Batches: lifecycle + course link ──
alter table batches drop constraint if exists batches_batch_type_check;
alter table batches add column if not exists sessions_total int;
alter table batches add column if not exists course_id uuid references courses(id);
alter table batches add column if not exists capacity int;
alter table batches add column if not exists completed_at timestamptz;

-- ── Trainers: FT hours / PT prep ──
alter table trainers add column if not exists work_start text;
alter table trainers add column if not exists work_end text;
alter table trainers add column if not exists weekly_hours int;

-- ── PT trainer availability → future sales slot board ──
create table if not exists trainer_slots(
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete cascade,
  weekday text, start_time text, end_time text,
  booked boolean default false,
  course_hint text, note text);

-- ── Real session calendar (replaces time-paced estimates) ──
create table if not exists class_sessions(
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batches(id) on delete cascade,
  session_no int,
  stype text default 'group',            -- group / mc / oneonone / activity
  sdate date, stime text,
  status text default 'scheduled',       -- scheduled / done / cancelled
  trainer_id uuid references trainers(id),
  notes text,
  created_at timestamptz default now());

-- ── Attendance (trainer marks per session) ──
create table if not exists attendance(
  id uuid primary key default gen_random_uuid(),
  session_id uuid references class_sessions(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  status text default 'present',         -- present / absent / late
  marked_by text,
  created_at timestamptz default now(),
  unique(session_id,student_id));

-- ── Payments: plan per student + transactions ──
create table if not exists payments(
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade unique,
  course_fee numeric default 0,
  discount numeric default 0,
  discount_by text,
  next_due date,
  note text,
  updated_at timestamptz default now());

create table if not exists payment_entries(
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  amount numeric not null,
  paid_at date default current_date,
  method text,
  entered_by text,
  created_at timestamptz default now());

-- ── HR: clock-in/out + leave ──
create table if not exists timeclock(
  id uuid primary key default gen_random_uuid(),
  username text not null,
  clock_in timestamptz default now(),
  clock_out timestamptz);

create table if not exists leaves(
  id uuid primary key default gen_random_uuid(),
  username text not null,
  from_date date, to_date date,
  reason text,
  status text default 'approved',
  created_at timestamptz default now());

-- ── Audit trail (who changed what) ──
create table if not exists audit_log(
  id uuid primary key default gen_random_uuid(),
  actor text, action text, target text, detail jsonb,
  created_at timestamptz default now());

-- ── RLS: permissive (internal tool posture, same as existing tables) ──
do $$ declare t text;
begin
  foreach t in array array['courses','trainer_slots','class_sessions','attendance',
    'payments','payment_entries','timeclock','leaves','audit_log'] loop
    execute format('alter table %I enable row level security',t);
    execute format('drop policy if exists "allow all %s" on %I',t,t);
    execute format('create policy "allow all %s" on %I for all using (true) with check (true)',t,t);
  end loop;
end $$;

-- ── Seed courses (set real fees in Admin → Courses) ──
insert into courses(name,total_group,total_mc,total_oneonone,total_sessions,duration_days,default_days,mc_day,fee)
select v.* from (values
 ('Spoken English Foundation',32,8,2,0,63,'Mon, Tue, Wed, Thu','Sat',0::numeric),
 ('Spoken English Upgrade',32,8,2,0,63,'Mon, Tue, Wed, Thu','Sat',0::numeric),
 ('Elite One-on-One',0,0,20,0,30,'','',0::numeric),
 ('IELTS Group',0,0,0,24,60,'Mon, Tue, Wed, Thu','',0::numeric),
 ('IELTS One-on-One',0,0,0,12,45,'','',0::numeric),
 ('Speaking Sessions',0,0,0,25,30,'Mon, Tue, Wed, Thu, Fri','',0::numeric)
) v(name,tg,tm,t1,ts,dd,dda,mcd,fee)
where not exists (select 1 from courses);

-- ── Seed employee logins (CHANGE PASSWORDS in Admin → Identity & Team) ──
insert into roles(name,role,username,password)
select v.* from (values
 ('Ashika','counsellor','ashika','ashika123'),
 ('Alisha','counsellor','alisha','alisha123'),
 ('Hiba','counsellor','hiba','hiba123'),
 ('Sumayya','counsellor','sumayya','sumayya123'),
 ('Diya','counsellor','diya','diya123'),
 ('Anal','media','anal','anal123'),
 ('Ali','media','ali','ali123')
) v(n,r,u,p)
where not exists (select 1 from roles where username=v.u);

-- Done. Verify:
select 'courses' t, count(*) from courses
union all select 'roles', count(*) from roles
union all select 'trainer_slots', count(*) from trainer_slots;
