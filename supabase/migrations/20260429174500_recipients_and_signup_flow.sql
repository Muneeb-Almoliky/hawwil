create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  country text not null,
  country_code text not null check (country_code in ('YE', 'JO', 'EG', 'SY')),
  currency text not null check (currency in ('YER', 'JOD', 'EGP', 'SYP')),
  phone text not null,
  masked_phone text not null,
  created_at timestamptz not null default now()
);

create index if not exists recipients_user_created_at_idx
on public.recipients (user_id, created_at desc);

alter table public.recipients enable row level security;

drop policy if exists "recipients_select_own" on public.recipients;
create policy "recipients_select_own"
on public.recipients
for select
using (user_id = auth.uid());

drop policy if exists "recipients_insert_own" on public.recipients;
create policy "recipients_insert_own"
on public.recipients
for insert
with check (user_id = auth.uid());

drop policy if exists "recipients_update_own" on public.recipients;
create policy "recipients_update_own"
on public.recipients
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.seed_default_recipients(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.recipients where user_id = p_user_id) then
    insert into public.recipients (
      user_id,
      full_name,
      country,
      country_code,
      currency,
      phone,
      masked_phone
    )
    values
      (p_user_id, 'Mohammed Al-Mekhlafi', 'Yemen', 'YE', 'YER', '+96771234512', '+967 ••• ••12'),
      (p_user_id, 'Ismail Al-Sharihi', 'Jordan', 'JO', 'JOD', '+96279876543', '+962 ••• ••43'),
      (p_user_id, 'Khalid Al-Rashidi', 'Egypt', 'EG', 'EGP', '+201012345678', '+20 ••• ••78'),
      (p_user_id, 'Omar Al-Halabi', 'Syria', 'SY', 'SYP', '+963991234567', '+963 ••• ••67');
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Hawwil User'),
    coalesce(new.raw_user_meta_data->>'country', 'Saudi Arabia')
  )
  on conflict (id) do nothing;

  perform public.seed_default_recipients(new.id);
  return new;
end;
$$;

do $$
declare
  profile_row record;
begin
  for profile_row in select id from public.profiles
  loop
    perform public.seed_default_recipients(profile_row.id);
  end loop;
end;
$$;
