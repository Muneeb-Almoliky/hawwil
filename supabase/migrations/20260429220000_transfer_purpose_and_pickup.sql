alter table public.transfers
  add column if not exists transfer_purpose text not null default 'standard',
  add column if not exists pickup_code text,
  add column if not exists picked_up_at timestamptz;

alter table public.transfers
  drop constraint if exists transfers_transfer_purpose_check;

alter table public.transfers
  add constraint transfers_transfer_purpose_check
  check (transfer_purpose in ('standard', 'zakat', 'sadaqah'));

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
    t.pickup_code,
    t.picked_up_at,
    t.status,
    t.created_at
  from public.transfers t
  where upper(t.reference_id) = upper(reference)
  order by t.created_at desc
  limit 1;
$$;

grant execute on function public.receiver_lookup(text) to anon, authenticated;
