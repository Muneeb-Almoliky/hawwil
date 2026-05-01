-- Hawwil-to-Hawwil (internal SAR balance) transfers

alter table public.transfers
  drop constraint if exists transfers_transfer_purpose_check;

alter table public.transfers
  add constraint transfers_transfer_purpose_check
  check (transfer_purpose in ('standard', 'zakat', 'sadaqah', 'hawwil_peer'));

alter table public.transfers
  drop constraint if exists transfers_settlement_rail_check;

alter table public.transfers
  add constraint transfers_settlement_rail_check
  check (settlement_rail in ('local_liquidity', 'usdc_settlement', 'hawwil_balance'));

create or replace function public.resolve_peer_profile_by_email(p_email text)
returns table (
  peer_id uuid,
  full_name text,
  country text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_email := lower(trim(p_email));
  if v_email is null or length(v_email) < 5 or position('@' in v_email) = 0 then
    raise exception 'Invalid email';
  end if;

  return query
  select
    u.id,
    p.full_name,
    p.country
  from auth.users u
  inner join public.profiles p on p.id = u.id
  where lower(u.email::text) = v_email
    and u.id <> v_uid
  limit 1;
end;
$$;

grant execute on function public.resolve_peer_profile_by_email(text) to authenticated;

create or replace function public.create_hawwil_peer_transfer(
  p_reference_id text,
  p_recipient_user_id uuid,
  p_amount_sar numeric
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
    'paid_out'
  )
  returning * into v_transfer;

  return v_transfer;
end;
$$;

grant execute on function public.create_hawwil_peer_transfer(text, uuid, numeric) to authenticated;
