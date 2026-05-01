create table if not exists public.remittance_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.remittance_schedules (id) on delete cascade,
  transfer_id uuid references public.transfers (id) on delete set null,
  outcome text not null check (outcome in ('success', 'failed')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists remittance_schedule_runs_schedule_created_idx
  on public.remittance_schedule_runs (schedule_id, created_at desc);

alter table public.remittance_schedule_runs enable row level security;

drop policy if exists "remittance_schedule_runs_select_own" on public.remittance_schedule_runs;
create policy "remittance_schedule_runs_select_own"
on public.remittance_schedule_runs
for select
using (
  exists (
    select 1
    from public.remittance_schedules rs
    where rs.id = remittance_schedule_runs.schedule_id
      and rs.user_id = auth.uid()
  )
);

create or replace function public.execute_remittance_schedule(
  p_schedule_id uuid,
  p_reference_id text,
  p_sender_name text,
  p_recipient_name text,
  p_recipient_country text,
  p_receiver_currency text,
  p_amount_sar numeric,
  p_fee_sar numeric,
  p_fx_rate numeric,
  p_receiver_amount numeric,
  p_pickup_code text,
  p_settlement_rail text,
  p_settlement_usdc numeric,
  p_settlement_partner text,
  p_route_reason text
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule public.remittance_schedules;
  v_profile public.profiles;
  v_recipient public.recipients;
  v_transfer public.transfers;
  v_next_run timestamptz;
begin
  select * into v_schedule
  from public.remittance_schedules
  where id = p_schedule_id
  for update;

  if not found then
    raise exception 'Schedule not found';
  end if;

  if v_schedule.status <> 'active' then
    raise exception 'Schedule is not active';
  end if;

  if v_schedule.next_run_at > now() then
    raise exception 'Schedule is not due yet';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_schedule.user_id
  for update;

  if not found then
    raise exception 'Schedule owner profile not found';
  end if;

  select * into v_recipient
  from public.recipients
  where id = v_schedule.recipient_id
    and user_id = v_schedule.user_id;

  if not found then
    update public.remittance_schedules
    set status = 'paused'
    where id = v_schedule.id;

    insert into public.remittance_schedule_runs (schedule_id, outcome, message)
    values (v_schedule.id, 'failed', 'Recipient missing for schedule.');

    raise exception 'Recipient missing for schedule';
  end if;

  if v_profile.balance_sar < p_amount_sar then
    update public.remittance_schedules
    set status = 'paused'
    where id = v_schedule.id;

    insert into public.remittance_schedule_runs (schedule_id, outcome, message)
    values (v_schedule.id, 'failed', 'Insufficient balance. Schedule paused.');

    raise exception 'Insufficient balance for scheduled transfer';
  end if;

  update public.profiles
  set balance_sar = balance_sar - p_amount_sar
  where id = v_schedule.user_id;

  insert into public.transfers (
    user_id,
    reference_id,
    sender_name,
    recipient_id,
    recipient_name,
    recipient_country,
    receiver_currency,
    amount_sar,
    fee_sar,
    fx_rate,
    receiver_amount,
    transfer_purpose,
    pickup_code,
    payout_method,
    payout_details,
    settlement_rail,
    settlement_usdc,
    settlement_partner,
    route_reason,
    status
  )
  values (
    v_schedule.user_id,
    p_reference_id,
    p_sender_name,
    v_recipient.id,
    p_recipient_name,
    p_recipient_country,
    p_receiver_currency,
    p_amount_sar,
    p_fee_sar,
    p_fx_rate,
    p_receiver_amount,
    'standard',
    p_pickup_code,
    null,
    '{}'::jsonb,
    p_settlement_rail,
    p_settlement_usdc,
    p_settlement_partner,
    p_route_reason,
    'recipient_action_required'
  )
  returning * into v_transfer;

  if v_schedule.frequency = 'weekly' then
    v_next_run := v_schedule.next_run_at + interval '1 week';
  else
    v_next_run := v_schedule.next_run_at + interval '1 month';
  end if;

  if v_schedule.end_date is not null and v_next_run::date > v_schedule.end_date then
    update public.remittance_schedules
    set status = 'paused',
        next_run_at = v_next_run
    where id = v_schedule.id;
  else
    update public.remittance_schedules
    set next_run_at = v_next_run
    where id = v_schedule.id;
  end if;

  insert into public.remittance_schedule_runs (schedule_id, transfer_id, outcome, message)
  values (v_schedule.id, v_transfer.id, 'success', 'Scheduled transfer executed.');

  return v_transfer;
end;
$$;

grant execute on function public.execute_remittance_schedule(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text,
  numeric,
  text,
  text
) to service_role;
