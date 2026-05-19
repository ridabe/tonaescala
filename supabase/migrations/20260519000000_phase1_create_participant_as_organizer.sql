-- Phase 1: Allow authenticated organizers to create participants when building schedules.
-- Direct INSERT on participants is not granted to authenticated; this RPC uses security definer.

create or replace function public.create_participant_as_organizer(
  p_name  text,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_name is null or trim(p_name) = '' then
    raise exception 'VALIDATION_ERROR: name is required';
  end if;

  insert into public.participants (name, phone)
  values (trim(p_name), nullif(trim(coalesce(p_phone, '')), ''))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_participant_as_organizer to authenticated;
