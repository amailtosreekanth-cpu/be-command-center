-- Phase 4: payment installments (sales team splits a fee into scheduled dues).
-- Run once in the Supabase SQL editor. Idempotent.
create table if not exists public.payment_installments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  seq int,
  amount numeric,
  due_date date,
  paid boolean default false,
  paid_at date,
  method text,
  note text,
  entered_by text,
  created_at timestamptz default now()
);
alter table public.payment_installments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='payment_installments' and policyname='all') then
    create policy "all" on public.payment_installments for all using (true) with check (true);
  end if;
end $$;
