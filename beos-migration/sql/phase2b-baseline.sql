-- PHASE 2B · manual baseline progress for mid-way batches
-- Lets you enter "sessions already done before tracking" so a batch that's
-- already past 50% shows the right bar. Attendance adds on top going forward.
-- Run in Supabase · project baazubvfsrpmbfmrzumw. Idempotent.

alter table batches add column if not exists baseline_sessions int default 0;

select 'batches' t, count(*) from batches;
