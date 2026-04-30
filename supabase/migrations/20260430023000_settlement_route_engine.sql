alter table public.transfers
  add column if not exists payout_method text not null default 'cash_pickup',
  add column if not exists settlement_rail text not null default 'local_liquidity',
  add column if not exists settlement_usdc numeric(14, 2) not null default 0,
  add column if not exists settlement_partner text not null default 'Destination Payout Network',
  add column if not exists route_reason text not null default 'Settlement route selected by transfer engine.';

alter table public.transfers
  drop constraint if exists transfers_payout_method_check;

alter table public.transfers
  add constraint transfers_payout_method_check
  check (payout_method in ('cash_pickup', 'bank_account', 'mobile_wallet'));

alter table public.transfers
  drop constraint if exists transfers_settlement_rail_check;

alter table public.transfers
  add constraint transfers_settlement_rail_check
  check (settlement_rail in ('local_liquidity', 'usdc_settlement'));

create table if not exists public.liquidity_pools (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  currency text not null,
  available_balance numeric(18, 2) not null default 0,
  updated_at timestamptz not null default now(),
  unique(country, currency)
);

insert into public.liquidity_pools (country, currency, available_balance)
values
  ('Jordan', 'JOD', 50000),
  ('Egypt', 'EGP', 500000),
  ('Yemen', 'YER', 10000000),
  ('Syria', 'SYP', 200000000)
on conflict (country, currency) do update
set available_balance = excluded.available_balance,
    updated_at = now();

alter table public.liquidity_pools enable row level security;

drop policy if exists "liquidity_select_authenticated" on public.liquidity_pools;
create policy "liquidity_select_authenticated"
on public.liquidity_pools
for select
using (auth.uid() is not null);

drop function if exists public.receiver_lookup(text);

drop function if exists public.create_transfer_and_debit(text, text, text, text, text, text, numeric, numeric, numeric, numeric);
drop function if exists public.create_transfer_and_debit(text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, text);

create or replace function public.receiver_lookup(reference text)
returns table (
  reference_id text,
  sender_name text,
  recipient_name text,
  recipient_country text,
  amount_sar numeric,
  receiver_amount numeric,
  receiver_currency text,
  transfer_purpose text,
  payout_method text,
  settlement_rail text,
  settlement_usdc numeric,
  settlement_partner text,
  route_reason text,
  pickup_code text,
  picked_up_at timestamptz,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    t.reference_id,
    t.sender_name,
    t.recipient_name,
    t.recipient_country,
    t.amount_sar,
    t.receiver_amount,
    t.receiver_currency,
    t.transfer_purpose,
    t.payout_method,
    t.settlement_rail,
    t.settlement_usdc,
    t.settlement_partner,
    t.route_reason,
    t.pickup_code,
    t.picked_up_at,
    t.status,
    t.created_at
  from public.transfers t
  where upper(t.reference_id) = upper(reference)
  order by t.created_at desc
  limit 1;
$$;

create or replace function public.create_transfer_and_debit(
  p_reference_id text,
  p_sender_name text,
  p_recipient_id text,
  p_recipient_name text,
  p_recipient_country text,
  p_receiver_currency text,
  p_amount_sar numeric,
  p_fee_sar numeric,
  p_fx_rate numeric,
  p_receiver_amount numeric,
  p_transfer_purpose text,
  p_pickup_code text,
  p_payout_method text,
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
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_transfer public.transfers;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_transfer_purpose not in ('standard', 'zakat', 'sadaqah') then
    raise exception 'Invalid transfer purpose';
  end if;

  if p_payout_method not in ('cash_pickup', 'bank_account', 'mobile_wallet') then
    raise exception 'Invalid payout method';
  end if;

  if p_settlement_rail not in ('local_liquidity', 'usdc_settlement') then
    raise exception 'Invalid settlement rail';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.balance_sar < p_amount_sar then
    raise exception 'Insufficient balance';
  end if;

  update public.profiles
  set balance_sar = balance_sar - p_amount_sar
  where id = v_user_id;

  update public.liquidity_pools
  set available_balance = greatest(0, available_balance - p_receiver_amount),
      updated_at = now()
  where country = p_recipient_country
    and currency = p_receiver_currency;

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
    settlement_rail,
    settlement_usdc,
    settlement_partner,
    route_reason,
    status
  )
  values (
    v_user_id,
    p_reference_id,
    p_sender_name,
    p_recipient_id,
    p_recipient_name,
    p_recipient_country,
    p_receiver_currency,
    p_amount_sar,
    p_fee_sar,
    p_fx_rate,
    p_receiver_amount,
    p_transfer_purpose,
    p_pickup_code,
    p_payout_method,
    p_settlement_rail,
    p_settlement_usdc,
    p_settlement_partner,
    p_route_reason,
    'processing'
  )
  returning * into v_transfer;

  return v_transfer;
end;
$$;

grant execute on function public.create_transfer_and_debit(text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, numeric, text, text) to authenticated;
grant execute on function public.receiver_lookup(text) to anon, authenticated;
