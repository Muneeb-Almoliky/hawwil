alter table public.transfers
  alter column payout_method drop not null,
  alter column payout_method drop default;

alter table public.transfers
  drop constraint if exists transfers_payout_method_check;

alter table public.transfers
  add constraint transfers_payout_method_check
  check (
    payout_method is null
    or payout_method in ('cash_pickup', 'bank_account', 'mobile_wallet')
  );

alter table public.transfers
  drop constraint if exists transfers_status_check;

update public.transfers
set status = 'paid_out'
where status = 'completed';

update public.transfers
set status = 'failed'
where status not in (
  'processing',
  'recipient_action_required',
  'payout_pending',
  'paid_out',
  'failed'
);

alter table public.transfers
  add constraint transfers_status_check
  check (
    status in (
      'processing',
      'recipient_action_required',
      'payout_pending',
      'paid_out',
      'failed'
    )
  );

create or replace function public.complete_transfer(
  p_reference_id text
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_transfer public.transfers;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.transfers
  set status = 'recipient_action_required'
  where user_id = v_user_id
    and reference_id = p_reference_id
    and status = 'processing'
  returning * into v_transfer;

  if not found then
    raise exception 'Transfer not found';
  end if;

  return v_transfer;
end;
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

create or replace function public.select_receiver_payout_method(
  p_reference_id text,
  p_payout_method text
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transfer public.transfers;
begin
  if p_payout_method not in ('cash_pickup', 'bank_account', 'mobile_wallet') then
    raise exception 'Invalid payout method';
  end if;

  update public.transfers
  set payout_method = p_payout_method,
      status = case
        when p_payout_method = 'cash_pickup' then 'payout_pending'
        else 'paid_out'
      end
  where upper(reference_id) = upper(p_reference_id)
    and status = 'recipient_action_required'
  returning * into v_transfer;

  if not found then
    raise exception 'Transfer not ready for payout selection';
  end if;

  return v_transfer;
end;
$$;

create or replace function public.claim_transfer_pickup(
  p_reference_id text,
  p_pickup_code text
)
returns table (
  reference_id text,
  picked_up_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.transfers t
  set picked_up_at = now(),
      status = 'paid_out'
  where upper(t.reference_id) = upper(p_reference_id)
    and t.pickup_code = p_pickup_code
    and t.picked_up_at is null
    and t.status = 'payout_pending'
  returning t.reference_id, t.picked_up_at;
end;
$$;

grant execute on function public.complete_transfer(text) to authenticated;
grant execute on function public.create_transfer_and_debit(text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, numeric, text, text) to authenticated;
grant execute on function public.select_receiver_payout_method(text, text) to anon, authenticated;
grant execute on function public.claim_transfer_pickup(text, text) to anon, authenticated;
