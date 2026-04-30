alter table public.transfers
  add column if not exists payout_details jsonb;

update public.transfers
set payout_details = '{}'::jsonb
where payout_details is null;

alter table public.transfers
  alter column payout_details set default '{}'::jsonb,
  alter column payout_details set not null;

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
    coalesce(t.payout_details, '{}'::jsonb) as payout_details,
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

create or replace function public.select_receiver_payout_method(
  p_reference_id text,
  p_payout_method text,
  p_payout_details jsonb default '{}'::jsonb
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transfer public.transfers;
  v_details jsonb := coalesce(p_payout_details, '{}'::jsonb);
begin
  if p_payout_method not in ('cash_pickup', 'bank_account', 'mobile_wallet') then
    raise exception 'Invalid payout method';
  end if;

  update public.transfers
  set payout_method = p_payout_method,
      payout_details = v_details,
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

grant execute on function public.receiver_lookup(text) to anon, authenticated;
grant execute on function public.select_receiver_payout_method(text, text, jsonb) to anon, authenticated;
