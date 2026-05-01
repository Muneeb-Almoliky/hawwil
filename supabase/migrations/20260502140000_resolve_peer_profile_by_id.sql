create or replace function public.resolve_peer_profile_by_id(p_peer_id uuid)
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
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_peer_id is null or p_peer_id = v_uid then
    raise exception 'Invalid peer';
  end if;

  return query
  select p.id, p.full_name, p.country
  from public.profiles p
  where p.id = p_peer_id
  limit 1;
end;
$$;

grant execute on function public.resolve_peer_profile_by_id(uuid) to authenticated;
