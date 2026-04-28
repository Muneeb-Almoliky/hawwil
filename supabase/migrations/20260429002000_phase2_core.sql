create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Hawwil User',
  country text not null default 'Saudi Arabia',
  currency text not null default 'SAR',
  verified boolean not null default true,
  role text not null default 'sender' check (role in ('sender', 'ops_admin')),
  balance_sar numeric(14, 2) not null default 12500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reference_id text not null unique,
  sender_name text not null,
  recipient_id text,
  recipient_name text not null,
  recipient_country text not null,
  receiver_currency text not null,
  amount_sar numeric(14, 2) not null check (amount_sar > 0),
  fee_sar numeric(14, 2) not null check (fee_sar >= 0),
  fx_rate numeric(18, 6) not null check (fx_rate > 0),
  receiver_amount numeric(18, 2) not null check (receiver_amount >= 0),
  status text not null default 'completed' check (status in ('completed')),
  created_at timestamptz not null default now()
);

create index if not exists transfers_user_created_at_idx on public.transfers (user_id, created_at desc);
create index if not exists transfers_reference_id_idx on public.transfers (reference_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Hawwil User'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_ops_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ops_admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.transfers enable row level security;

drop policy if exists "profiles_select_own_or_ops" on public.profiles;
create policy "profiles_select_own_or_ops"
on public.profiles
for select
using (id = auth.uid() or public.is_ops_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "transfers_select_own_or_ops" on public.transfers;
create policy "transfers_select_own_or_ops"
on public.transfers
for select
using (user_id = auth.uid() or public.is_ops_admin());

drop policy if exists "transfers_insert_own" on public.transfers;
create policy "transfers_insert_own"
on public.transfers
for insert
with check (user_id = auth.uid());

create or replace function public.receiver_lookup(reference text)
returns table (
  reference_id text,
  sender_name text,
  recipient_name text,
  recipient_country text,
  amount_sar numeric,
  receiver_amount numeric,
  receiver_currency text,
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
    t.status,
    t.created_at
  from public.transfers t
  where upper(t.reference_id) = upper(reference)
  order by t.created_at desc
  limit 1;
$$;

grant execute on function public.receiver_lookup(text) to anon, authenticated;

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
  p_receiver_amount numeric
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
    'completed'
  )
  returning * into v_transfer;

  return v_transfer;
end;
$$;

grant execute on function public.create_transfer_and_debit(text, text, text, text, text, text, numeric, numeric, numeric, numeric) to authenticated;
