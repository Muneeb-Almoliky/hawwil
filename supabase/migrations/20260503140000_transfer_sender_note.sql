alter table public.transfers
  add column if not exists sender_note text;

drop function if exists public.create_transfer_and_debit(
  text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, numeric, text, text
);

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
  p_route_reason text,
  p_sender_note text
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
  v_note text := nullif(trim(p_sender_note), '');
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_transfer_purpose <> 'standard' then
    raise exception 'Invalid transfer purpose';
  end if;

  if p_payout_method is not null and p_payout_method not in ('cash_pickup', 'bank_account', 'mobile_wallet') then
    raise exception 'Invalid payout method';
  end if;

  if p_settlement_rail <> 'usdc_settlement' then
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
    sender_note,
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
    v_note,
    'processing'
  )
  returning * into v_transfer;

  return v_transfer;
end;
$$;

grant execute on function public.create_transfer_and_debit(
  text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, numeric, text, text, text
) to authenticated;

drop function if exists public.create_hawwil_peer_transfer(text, uuid, numeric);

create or replace function public.create_hawwil_peer_transfer(
  p_reference_id text,
  p_recipient_user_id uuid,
  p_amount_sar numeric,
  p_sender_note text default null
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_sender_profile public.profiles;
  v_receiver_profile public.profiles;
  v_transfer public.transfers;
  v_note text := nullif(trim(p_sender_note), '');
begin
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_recipient_user_id = v_sender_id then
    raise exception 'Cannot transfer to yourself';
  end if;

  if p_amount_sar is null or p_amount_sar < 1 then
    raise exception 'Invalid amount';
  end if;

  select * into v_sender_profile from public.profiles where id = v_sender_id for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  select * into v_receiver_profile from public.profiles where id = p_recipient_user_id for update;
  if not found then
    raise exception 'Recipient not found';
  end if;

  if v_sender_profile.balance_sar < p_amount_sar then
    raise exception 'Insufficient balance';
  end if;

  update public.profiles
  set balance_sar = balance_sar - p_amount_sar
  where id = v_sender_id;

  update public.profiles
  set balance_sar = balance_sar + p_amount_sar
  where id = p_recipient_user_id;

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
    sender_note,
    status
  )
  values (
    v_sender_id,
    p_reference_id,
    v_sender_profile.full_name,
    p_recipient_user_id::text,
    v_receiver_profile.full_name,
    v_receiver_profile.country,
    'SAR',
    p_amount_sar,
    0,
    1,
    p_amount_sar,
    'hawwil_peer',
    null,
    null,
    '{}'::jsonb,
    'hawwil_balance',
    0,
    'Hawwil',
    'Instant balance transfer between Hawwil accounts.',
    v_note,
    'paid_out'
  )
  returning * into v_transfer;

  return v_transfer;
end;
$$;

grant execute on function public.create_hawwil_peer_transfer(text, uuid, numeric, text) to authenticated;

drop function if exists public.receiver_lookup(text);

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
  payout_details jsonb,
  settlement_rail text,
  settlement_usdc numeric,
  settlement_partner text,
  route_reason text,
  pickup_code text,
  picked_up_at timestamptz,
  status text,
  created_at timestamptz,
  sender_note text
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
    coalesce(t.payout_details, '{}'::jsonb) as payout_details,
    t.settlement_rail,
    t.settlement_usdc,
    t.settlement_partner,
    t.route_reason,
    t.pickup_code,
    t.picked_up_at,
    t.status,
    t.created_at,
    t.sender_note
  from public.transfers t
  where upper(t.reference_id) = upper(reference)
  order by t.created_at desc
  limit 1;
$$;

grant execute on function public.receiver_lookup(text) to anon, authenticated;
