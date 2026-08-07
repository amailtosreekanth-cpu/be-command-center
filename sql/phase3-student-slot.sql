-- Phase 3: preferred time slot on students.
-- Run once in the Supabase SQL editor. Idempotent.
alter table if exists public.students
  add column if not exists preferred_slot text;
