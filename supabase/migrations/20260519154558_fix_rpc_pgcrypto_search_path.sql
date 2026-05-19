-- Fix tokenized RPCs that call pgcrypto.digest/gen_random_bytes.
-- Supabase keeps extensions in the `extensions` schema, so security definer
-- functions must include it in the search_path or call extensions.digest().

create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.join_event_by_invite_code(
  p_invite_code text,
  p_device_id   text,
  p_name        text,
  p_phone       text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_event_id       uuid;
  v_participant_id uuid;
  v_token          text;
  v_token_hash     text;
begin
  select id into v_event_id
  from public.events
  where invite_code = p_invite_code
    and status = 'active';

  if v_event_id is null then
    raise exception 'INVITE_INVALID';
  end if;

  v_token      := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  select id into v_participant_id
  from public.participants
  where device_id = p_device_id
  limit 1;

  if v_participant_id is null then
    insert into public.participants
      (name, phone, device_id, participant_access_token_hash, last_seen_at)
    values
      (p_name, p_phone, p_device_id, v_token_hash, now())
    returning id into v_participant_id;
  else
    update public.participants
    set
      name                          = p_name,
      phone                         = coalesce(p_phone, phone),
      participant_access_token_hash = v_token_hash,
      last_seen_at                  = now()
    where id = v_participant_id;
  end if;

  insert into public.participant_events (participant_id, event_id)
  values (v_participant_id, v_event_id)
  on conflict (participant_id, event_id) do nothing;

  return json_build_object(
    'participant_id',           v_participant_id,
    'event_id',                 v_event_id,
    'participant_access_token', v_token
  );
end;
$$;

create or replace function public.confirm_schedule(
  p_schedule_id              uuid,
  p_participant_id           uuid,
  p_participant_access_token text,
  p_status                   text,
  p_response_message         text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token_hash text;
begin
  if p_status not in ('confirmed', 'declined', 'late') then
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

  insert into public.confirmations
    (schedule_id, participant_id, status, response_message, responded_at)
  values
    (p_schedule_id, p_participant_id, p_status, p_response_message, now())
  on conflict (schedule_id, participant_id)
  do update set
    status           = excluded.status,
    response_message = excluded.response_message,
    responded_at     = now();
end;
$$;

create or replace function public.get_participant_agenda(
  p_participant_id           uuid,
  p_participant_access_token text
)
returns table (
  schedule_id         uuid,
  event_id            uuid,
  event_title         text,
  event_start_date    timestamptz,
  team_name           text,
  role                text,
  start_time          timestamptz,
  end_time            timestamptz,
  notes               text,
  confirmation_status text,
  has_conflict        boolean
)
language plpgsql
security definer
set search_path = public, extensions
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
    s.id,
    e.id,
    e.title,
    e.start_date,
    t.name,
    s.role,
    s.start_time,
    s.end_time,
    s.notes,
    c.status,
    exists (
      select 1 from public.conflicts cf
      where cf.participant_id = p_participant_id
        and (cf.schedule_id_1 = s.id or cf.schedule_id_2 = s.id)
        and cf.resolved = false
    )
  from public.schedules s
  join public.events e on e.id = s.event_id
  left join public.teams t on t.id = s.team_id
  left join public.confirmations c
    on  c.schedule_id    = s.id
    and c.participant_id = p_participant_id
  where s.participant_id = p_participant_id
    and e.status = 'active'
  order by coalesce(s.start_time, e.start_date);
end;
$$;

create or replace function public.save_participant_push_token(
  p_participant_id           uuid,
  p_participant_access_token text,
  p_push_token               text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
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
  set push_token = p_push_token
  where id = p_participant_id;
end;
$$;

create or replace function public.get_participant_notifications(
  p_participant_id           uuid,
  p_participant_access_token text
)
returns table (
  id         uuid,
  type       text,
  title      text,
  body       text,
  data       jsonb,
  read       boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
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

  return query
  select n.id, n.type, n.title, n.body, n.data, n.read, n.created_at
  from public.notifications n
  where n.participant_id = p_participant_id
  order by n.created_at desc
  limit 50;
end;
$$;

create or replace function public.mark_notification_read(
  p_notification_id          uuid,
  p_participant_id           uuid,
  p_participant_access_token text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
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

  update public.notifications
  set read = true
  where id = p_notification_id
    and participant_id = p_participant_id;
end;
$$;

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
set search_path = public, extensions
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

create or replace function public.set_event_attendance(
  p_participant_id           uuid,
  p_participant_access_token text,
  p_event_id                 uuid,
  p_status                   text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
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
