-- Phase 4: Guest event-level attendance confirmation

-- Add attendance_status to participant_events
alter table public.participant_events
  add column if not exists attendance_status text not null default 'pending'
  check (attendance_status in ('pending', 'confirmed', 'declined'));

-- ---- get_participant_event_details ----
-- Returns event info + participant's schedules for a specific event
create or replace function public.get_participant_event_details(
  p_participant_id           uuid,
  p_participant_access_token text,
  p_event_id                 uuid
)
returns table (
  event_id            uuid,
  event_title         text,
  event_description   text,
  event_location      text,
  event_start_date    timestamptz,
  event_end_date      timestamptz,
  event_color         text,
  organization_name   text,
  attendance_status   text,
  schedule_id         uuid,
  team_name           text,
  role                text,
  start_time          timestamptz,
  end_time            timestamptz,
  notes               text,
  confirmation_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_hash text;
begin
  v_token_hash := encode(digest(p_participant_access_token, 'sha256'), 'hex');

  if not exists (
    select 1 from public.participants
    where id = p_participant_id
      and participant_access_token_hash = v_token_hash
  ) then
    raise exception 'FORBIDDEN';
  end if;

  update public.participants
  set last_seen_at = now()
  where id = p_participant_id;

  return query
  select
    e.id,
    e.title,
    e.description,
    e.location,
    e.start_date,
    e.end_date,
    e.color,
    o.name,
    pe.attendance_status,
    s.id,
    t.name,
    s.role,
    s.start_time,
    s.end_time,
    s.notes,
    c.status
  from public.events e
  join public.organizations o on o.id = e.organization_id
  join public.participant_events pe
    on  pe.event_id       = e.id
    and pe.participant_id = p_participant_id
  left join public.schedules s
    on  s.event_id       = e.id
    and s.participant_id = p_participant_id
  left join public.teams t on t.id = s.team_id
  left join public.confirmations c
    on  c.schedule_id    = s.id
    and c.participant_id = p_participant_id
  where e.id = p_event_id
    and e.status = 'active'
  order by coalesce(s.start_time, e.start_date);
end;
$$;

-- ---- set_event_attendance ----
-- Participant confirms or declines attendance at the event level
create or replace function public.set_event_attendance(
  p_participant_id           uuid,
  p_participant_access_token text,
  p_event_id                 uuid,
  p_status                   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_hash text;
begin
  if p_status not in ('confirmed', 'declined') then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_token_hash := encode(digest(p_participant_access_token, 'sha256'), 'hex');

  if not exists (
    select 1 from public.participants
    where id = p_participant_id
      and participant_access_token_hash = v_token_hash
  ) then
    raise exception 'FORBIDDEN';
  end if;

  update public.participant_events
  set attendance_status = p_status
  where participant_id = p_participant_id
    and event_id       = p_event_id;

  if not found then
    raise exception 'NOT_FOUND';
  end if;
end;
$$;

-- ---- get_event_participants_for_organizer ----
-- Organizer sees who joined the event and their attendance status
create or replace function public.get_event_participants_for_organizer(
  p_event_id uuid
)
returns table (
  participant_id    uuid,
  participant_name  text,
  participant_phone text,
  attendance_status text,
  joined_at         timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.events
  where id = p_event_id;

  if not app_private.is_org_owner(v_org_id) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    p.id,
    p.name,
    p.phone,
    pe.attendance_status,
    pe.joined_at
  from public.participant_events pe
  join public.participants p on p.id = pe.participant_id
  where pe.event_id = p_event_id
  order by
    case pe.attendance_status
      when 'confirmed' then 1
      when 'pending'   then 2
      when 'declined'  then 3
    end,
    pe.joined_at desc;
end;
$$;

-- Grants
grant execute on function public.get_participant_event_details        to anon, authenticated;
grant execute on function public.set_event_attendance                 to anon, authenticated;
grant execute on function public.get_event_participants_for_organizer to authenticated;
