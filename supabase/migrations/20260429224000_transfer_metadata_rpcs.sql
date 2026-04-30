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
  p_pickup_code text
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
    'processing'
  )
  returning * into v_transfer;

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
  set picked_up_at = now()
  where upper(t.reference_id) = upper(p_reference_id)
    and t.pickup_code = p_pickup_code
    and t.picked_up_at is null
    and t.status = 'completed'
  returning t.reference_id, t.picked_up_at;
end;
$$;

grant execute on function public.create_transfer_and_debit(text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, text) to authenticated;
grant execute on function public.claim_transfer_pickup(text, text) to anon, authenticated;
