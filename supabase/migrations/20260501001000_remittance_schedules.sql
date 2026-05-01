create table if not exists public.remittance_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references public.recipients (id) on delete cascade,
  amount_sar numeric(14, 2) not null check (amount_sar > 0),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  next_run_at timestamptz not null,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists remittance_schedules_user_status_next_run_idx
  on public.remittance_schedules (user_id, status, next_run_at asc);

drop trigger if exists remittance_schedules_set_updated_at on public.remittance_schedules;
create trigger remittance_schedules_set_updated_at
before update on public.remittance_schedules
for each row execute procedure public.set_updated_at();

alter table public.remittance_schedules enable row level security;

drop policy if exists "remittance_schedules_select_own" on public.remittance_schedules;
create policy "remittance_schedules_select_own"
on public.remittance_schedules
for select
using (user_id = auth.uid());

drop policy if exists "remittance_schedules_insert_own" on public.remittance_schedules;
create policy "remittance_schedules_insert_own"
on public.remittance_schedules
for insert
with check (user_id = auth.uid());

drop policy if exists "remittance_schedules_update_own" on public.remittance_schedules;
create policy "remittance_schedules_update_own"
on public.remittance_schedules
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
