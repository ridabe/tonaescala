-- ============================================================
-- Minha Escala — Phase 3: Conflicts & Notifications
-- ============================================================

-- 1. Add push_token to participants
alter table public.participants
  add column if not exists push_token text;

-- ============================================================
-- RPCs
-- ============================================================

-- ---- save_participant_push_token ----
create or replace function public.save_participant_push_token(
  p_participant_id           uuid,
  p_participant_access_token text,
  p_push_token               text
)
returns void
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
  set push_token = p_push_token
  where id = p_participant_id;
end;
$$;

-- ---- get_participant_notifications ----
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

  return query
  select n.id, n.type, n.title, n.body, n.data, n.read, n.created_at
  from public.notifications n
  where n.participant_id = p_participant_id
  order by n.created_at desc
  limit 50;
end;
$$;

-- ---- mark_notification_read ----
create or replace function public.mark_notification_read(
  p_notification_id          uuid,
  p_participant_id           uuid,
  p_participant_access_token text
)
returns void
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

  update public.notifications
  set read = true
  where id = p_notification_id
    and participant_id = p_participant_id;
end;
$$;

-- ---- create_schedule_notification ----
-- Called by authenticated organizer after creating/updating a schedule.
-- Creates an in-app notification and returns the participant's push_token.
create or replace function public.create_schedule_notification(
  p_schedule_id uuid,
  p_type        text default 'new_schedule'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id   uuid;
  v_push_token       text;
  v_event_title      text;
  v_notif_title      text;
  v_notif_body       text;
begin
  if p_type not in ('new_schedule', 'schedule_changed') then
    raise exception 'VALIDATION_ERROR';
  end if;

  select s.participant_id, p.push_token, e.title
  into   v_participant_id, v_push_token, v_event_title
  from   public.schedules s
  join   public.events     e on e.id = s.event_id
  join   public.participants p on p.id = s.participant_id
  where  s.id = p_schedule_id
    and  app_private.is_org_owner(e.organization_id);

  if v_participant_id is null then
    raise exception 'FORBIDDEN';
  end if;

  if p_type = 'new_schedule' then
    v_notif_title := 'Nova escala';
    v_notif_body  := 'Você foi adicionado à escala de ' || v_event_title;
  else
    v_notif_title := 'Escala alterada';
    v_notif_body  := 'Sua escala em ' || v_event_title || ' foi atualizada';
  end if;

  insert into public.notifications (participant_id, type, title, body, data)
  values (
    v_participant_id,
    p_type,
    v_notif_title,
    v_notif_body,
    jsonb_build_object('schedule_id', p_schedule_id)
  );

  return json_build_object('push_token', v_push_token);
end;
$$;

-- ---- get_event_conflicts_for_organizer ----
create or replace function public.get_event_conflicts_for_organizer(p_event_id uuid)
returns table (
  conflict_id      uuid,
  participant_name text,
  schedule1_id     uuid,
  schedule1_role   text,
  schedule1_start  timestamptz,
  schedule1_event  text,
  schedule2_id     uuid,
  schedule2_role   text,
  schedule2_start  timestamptz,
  schedule2_event  text
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
    cf.id,
    par.name,
    s1.id,
    s1.role,
    s1.start_time,
    e1.title,
    s2.id,
    s2.role,
    s2.start_time,
    e2.title
  from   public.conflicts cf
  join   public.participants par on par.id = cf.participant_id
  join   public.schedules    s1  on s1.id  = cf.schedule_id_1
  join   public.events       e1  on e1.id  = s1.event_id
  join   public.schedules    s2  on s2.id  = cf.schedule_id_2
  join   public.events       e2  on e2.id  = s2.event_id
  where  (s1.event_id = p_event_id or s2.event_id = p_event_id)
    and  cf.resolved = false
  order  by cf.detected_at desc;
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================

grant execute on function public.save_participant_push_token      to anon, authenticated;
grant execute on function public.get_participant_notifications     to anon, authenticated;
grant execute on function public.mark_notification_read           to anon, authenticated;
grant execute on function public.create_schedule_notification     to authenticated;
grant execute on function public.get_event_conflicts_for_organizer to authenticated;
