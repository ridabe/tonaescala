-- Allow a guest who entered with one valid invite code + email to see and switch
-- between every active event where that same email is assigned.

create or replace function public.get_guest_events_by_invite_email(
  p_invite_code text,
  p_email       text
)
returns table (
  event_id          uuid,
  event_title       text,
  event_location    text,
  event_start_date  timestamptz,
  event_end_date    timestamptz,
  event_color       text,
  organization_name text,
  assignment_count  integer,
  pending_count     integer,
  accepted_count    integer,
  declined_count    integer,
  is_current_invite boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor_event_id uuid;
  v_email           text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  if p_invite_code is null or btrim(p_invite_code) = '' or v_email = '' then
    raise exception 'VALIDATION_ERROR';
  end if;

  select e.id into v_anchor_event_id
  from public.events e
  where upper(e.invite_code) = upper(btrim(p_invite_code))
    and e.status = 'active';

  if v_anchor_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = v_anchor_event_id
      and ea.invitee_email_norm = v_email
  ) then
    raise exception 'NOT_INVITED';
  end if;

  return query
  select
    e.id,
    e.title,
    e.location,
    e.start_date,
    e.end_date,
    e.color,
    o.name,
    count(ea.id)::integer,
    count(*) filter (where ea.response_status = 'pending')::integer,
    count(*) filter (where ea.response_status = 'accepted')::integer,
    count(*) filter (where ea.response_status = 'declined')::integer,
    e.id = v_anchor_event_id
  from public.event_assignments ea
  join public.events e on e.id = ea.event_id
  join public.organizations o on o.id = e.organization_id
  where ea.invitee_email_norm = v_email
    and e.status = 'active'
  group by e.id, e.title, e.location, e.start_date, e.end_date, e.color, o.name
  order by e.start_date, e.title;
end;
$$;

create or replace function public.get_assignments_by_guest_event_email(
  p_invite_code text,
  p_email       text,
  p_event_id    uuid default null
)
returns table (
  assignment_id     uuid,
  event_id          uuid,
  event_title       text,
  event_description text,
  event_location    text,
  event_start_date  timestamptz,
  event_end_date    timestamptz,
  event_color       text,
  organization_name text,
  team_id           uuid,
  team_name         text,
  invitee_name      text,
  invitee_email     text,
  role              text,
  arrival_time      timestamptz,
  start_time        timestamptz,
  end_time          timestamptz,
  notes             text,
  viewed_at         timestamptz,
  response_status   text,
  decline_reason    text,
  responded_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor_event_id uuid;
  v_target_event_id uuid;
  v_email           text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  if p_invite_code is null or btrim(p_invite_code) = '' or v_email = '' then
    raise exception 'VALIDATION_ERROR';
  end if;

  select e.id into v_anchor_event_id
  from public.events e
  where upper(e.invite_code) = upper(btrim(p_invite_code))
    and e.status = 'active';

  if v_anchor_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = v_anchor_event_id
      and ea.invitee_email_norm = v_email
  ) then
    raise exception 'NOT_INVITED';
  end if;

  v_target_event_id := coalesce(p_event_id, v_anchor_event_id);

  if not exists (
    select 1
    from public.event_assignments ea
    join public.events e on e.id = ea.event_id
    where ea.event_id = v_target_event_id
      and ea.invitee_email_norm = v_email
      and e.status = 'active'
  ) then
    raise exception 'NOT_INVITED';
  end if;

  update public.event_assignments ea
  set viewed_at = coalesce(ea.viewed_at, now())
  where ea.event_id = v_target_event_id
    and ea.invitee_email_norm = v_email;

  return query
  select
    ea.id,
    e.id,
    e.title,
    e.description,
    e.location,
    e.start_date,
    e.end_date,
    e.color,
    o.name,
    ea.team_id,
    t.name,
    ea.invitee_name,
    ea.invitee_email,
    ea.role,
    ea.arrival_time,
    ea.start_time,
    ea.end_time,
    ea.notes,
    ea.viewed_at,
    ea.response_status,
    ea.decline_reason,
    ea.responded_at
  from public.event_assignments ea
  join public.events e on e.id = ea.event_id
  join public.organizations o on o.id = e.organization_id
  left join public.teams t on t.id = ea.team_id
  where ea.event_id = v_target_event_id
    and ea.invitee_email_norm = v_email
  order by coalesce(ea.arrival_time, ea.start_time, e.start_date), ea.created_at;
end;
$$;

create or replace function public.get_assignment_roster_by_guest_event_email(
  p_invite_code text,
  p_email       text,
  p_event_id    uuid
)
returns table (
  assignment_id   uuid,
  team_id         uuid,
  team_name       text,
  invitee_name    text,
  role            text,
  response_status text,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor_event_id uuid;
  v_email           text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  select e.id into v_anchor_event_id
  from public.events e
  where upper(e.invite_code) = upper(btrim(coalesce(p_invite_code, '')))
    and e.status = 'active';

  if v_anchor_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = v_anchor_event_id
      and ea.invitee_email_norm = v_email
  ) then
    raise exception 'NOT_INVITED';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    join public.events e on e.id = ea.event_id
    where ea.event_id = p_event_id
      and ea.invitee_email_norm = v_email
      and e.status = 'active'
  ) then
    raise exception 'NOT_INVITED';
  end if;

  return query
  select
    ea.id,
    ea.team_id,
    t.name,
    ea.invitee_name,
    ea.role,
    ea.response_status,
    ea.invitee_email_norm = v_email
  from public.event_assignments ea
  left join public.teams t on t.id = ea.team_id
  where ea.event_id = p_event_id
  order by coalesce(t.name, ''), ea.invitee_name;
end;
$$;

create or replace function public.respond_guest_event_assignment(
  p_invite_code    text,
  p_email          text,
  p_assignment_id  uuid,
  p_response       text,
  p_decline_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor_event_id uuid;
  v_org_owner_id    uuid;
  v_email           text;
  v_assignment      public.event_assignments%rowtype;
  v_event_title     text;
  v_notif_type      text;
  v_notif_title     text;
  v_notif_body      text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  if p_response not in ('accepted', 'declined') then
    raise exception 'VALIDATION_ERROR: invalid response';
  end if;

  if p_response = 'declined' and (
    p_decline_reason is null or btrim(p_decline_reason) = ''
  ) then
    raise exception 'VALIDATION_ERROR: decline reason is required';
  end if;

  select e.id into v_anchor_event_id
  from public.events e
  where upper(e.invite_code) = upper(btrim(coalesce(p_invite_code, '')))
    and e.status = 'active';

  if v_anchor_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = v_anchor_event_id
      and ea.invitee_email_norm = v_email
  ) then
    raise exception 'NOT_INVITED';
  end if;

  select ea.*
  into v_assignment
  from public.event_assignments ea
  join public.events e on e.id = ea.event_id
  where ea.id = p_assignment_id
    and ea.invitee_email_norm = v_email
    and e.status = 'active';

  if v_assignment.id is null then
    raise exception 'NOT_INVITED';
  end if;

  select e.title, o.owner_id
  into v_event_title, v_org_owner_id
  from public.events e
  join public.organizations o on o.id = e.organization_id
  where e.id = v_assignment.event_id;

  update public.event_assignments
  set response_status = p_response,
      decline_reason = case
        when p_response = 'declined' then btrim(p_decline_reason)
        else null
      end,
      responded_at = now(),
      viewed_at = coalesce(viewed_at, now())
  where id = p_assignment_id;

  if p_response = 'accepted' then
    v_notif_type := 'assignment_accepted';
    v_notif_title := v_assignment.invitee_name || ' aceitou a convocacao';
    v_notif_body := v_event_title || coalesce(' - ' || nullif(v_assignment.role, ''), '');
  else
    v_notif_type := 'assignment_declined';
    v_notif_title := v_assignment.invitee_name || ' recusou a convocacao';
    v_notif_body := btrim(p_decline_reason);
  end if;

  insert into public.admin_notifications (
    user_id,
    event_id,
    assignment_id,
    type,
    title,
    body,
    data
  )
  values (
    v_org_owner_id,
    v_assignment.event_id,
    p_assignment_id,
    v_notif_type,
    v_notif_title,
    v_notif_body,
    jsonb_build_object(
      'event_id', v_assignment.event_id,
      'assignment_id', p_assignment_id,
      'response_status', p_response,
      'invitee_name', v_assignment.invitee_name,
      'role', v_assignment.role,
      'decline_reason', case when p_response = 'declined' then btrim(p_decline_reason) else null end
    )
  );
end;
$$;

grant execute on function public.get_guest_events_by_invite_email to anon, authenticated;
grant execute on function public.get_assignments_by_guest_event_email to anon, authenticated;
grant execute on function public.get_assignment_roster_by_guest_event_email to anon, authenticated;
grant execute on function public.respond_guest_event_assignment to anon, authenticated;
