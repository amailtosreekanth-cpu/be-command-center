-- ═══════════════════════════════════════════════════════════════
-- FRESH START · wipe the old sheet-imported records
-- The 153 students you see came from a ONE-TIME import of the old
-- Google Sheet into Supabase. The sheet is disconnected — these are
-- just leftover DB rows. Run this to clear them and start clean;
-- from now on everything is manual entry through the logins.
--
-- ⚠️ DESTRUCTIVE — deletes all students, attendance, sessions, payments,
--    and derived batches. Trainers, courses, roles, logins are KEPT.
--    There is no undo. Only run if you truly want a clean slate.
--
-- Project baazubvfsrpmbfmrzumw (check the URL bar!)
-- ═══════════════════════════════════════════════════════════════

begin;

delete from attendance;
delete from payment_entries;
delete from payments;
delete from class_sessions;
delete from sessions;          -- old session logs (if table exists)
delete from students;
delete from batches;           -- batches are re-created as you add students/batches

commit;

-- Verify everything is zero:
select 'students' t, count(*) from students
union all select 'batches', count(*) from batches
union all select 'attendance', count(*) from attendance
union all select 'payments', count(*) from payments;
