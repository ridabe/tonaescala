-- ============================================================
-- ToNaEscala - New Scope Phase 2: Event assignments
-- ============================================================
-- Adds the database foundation for invited assignments identified by
-- event invite code + invitee email.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.event_assignments (
  id                 uuid        primary key default gen_random_uuid(),
  event_id           uuid        not null references public.events (id) on delete cascade,
  team_id            uuid        references public.teams (id) on delete set null,
  participant_id     uuid        references public.participants (id) on delete set null,
  invitee_name       text        not null,
  invitee_email      text        not null,
  invitee_email_norm text        generated always as (lower(btrim(invitee_email))) stored,
  invitee_phone      text,
  role               text,
  arrival_time       timestamptz,
  start_time         timestamptz,
  end_time           timestamptz,
  notes              text,
  viewed_at          timestamptz,
  response_status    text        not null default 'pending'
                              check (response_status in ('pending', 'accepted', 'declined')),
  decline_reason     text,
  responded_at       timestamptz,
  created_by         uuid        references public.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint event_assignments_invitee_name_not_blank
    check (btrim(invitee_name) <> ''),
  constraint event_assignments_invitee_email_not_blank
    check (btrim(invitee_email) <> ''),
  constraint event_assignments_decline_reason_required
    check (
      response_status <> 'declined'
      or decline_reason is not null
      and btrim(decline_reason) <> ''
    ),
  constraint event_assignments_response_timestamp_required
    check (
      response_status = 'pending'
      or responded_at is not null
    )
);

comment on table public.event_assignments is 'Planned event assignment/invitation for a person identified by email.';
comment on column public.event_assignments.invitee_email_norm is 'Lower-trimmed email used for lookup by invite code + email.';
comment on column public.event_assignments.viewed_at is 'When the invitee first opened this assignment.';
comment on column public.event_assignments.response_status is 'Invitee response: pending, accepted, declined.';
comment on column public.event_assignments.decline_reason is 'Required justification when response_status is declined.';

create table if not exists public.admin_notifications (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.users (id) on delete cascade,
  event_id      uuid        references public.events (id) on delete cascade,
  assignment_id uuid        references public.event_assignments (id) on delete cascade,
  type          text        not null check (type in ('assignment_accepted', 'assignment_declined')),
  title         text        not null,
  body          text,
  data          jsonb       not null default '{}'::jsonb,
  read          boolean     not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.admin_notifications is 'Notifications for organizers/admins about assignment responses.';

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists event_assignments_event_id_idx
  on public.event_assignments (event_id);

create index if not exists event_assignments_team_id_idx
  on public.event_assignments (team_id);

create index if not exists event_assignments_participant_id_idx
  on public.event_assignments (participant_id);

create index if not exists event_assignments_event_email_idx
  on public.event_assignments (event_id, invitee_email_norm);

create index if not exists event_assignments_response_status_idx
  on public.event_assignments (response_status);

create index if not exists event_assignments_event_response_idx
  on public.event_assignments (event_id, response_status);

create index if not exists admin_notifications_user_created_idx
  on public.admin_notifications (user_id, created_at desc);

create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (user_id)
  where read = false;

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists trg_event_assignments_updated_at on public.event_assignments;
create trigger trg_event_assignments_updated_at
  before update on public.event_assignments
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.event_assignments enable row level security;
alter table public.admin_notifications enable row level security;

drop policy if exists "event_assignments: org owner all" on public.event_assignments;
create policy "event_assignments: org owner all"
  on public.event_assignments for all
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_assignments.event_id
        and app_private.is_org_owner(e.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_assignments.event_id
        and app_private.is_org_owner(e.organization_id)
    )
  );

drop policy if exists "admin_notifications: read own" on public.admin_notifications;
create policy "admin_notifications: read own"
  on public.admin_notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admin_notifications: update own read status" on public.admin_notifications;
create policy "admin_notifications: update own read status"
  on public.admin_notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.event_assignments to authenticated;
grant select, update on public.admin_notifications to authenticated;

-- ============================================================
-- RPCS - ORGANIZER
-- ============================================================

create or replace function public.create_event_assignment(
  p_event_id       uuid,
  p_team_id        uuid default null,
  p_invitee_name   text default null,
  p_invitee_email  text default null,
  p_invitee_phone  text default null,
  p_role           text default null,
  p_arrival_time   timestamptz default null,
  p_start_time     timestamptz default null,
  p_end_time       timestamptz default null,
  p_notes          text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_id     uuid;
begin
  select organization_id into v_org_id
  from public.events
  where id = p_event_id;

  if v_org_id is null or not app_private.is_org_owner(v_org_id) then
    raise exception 'FORBIDDEN';
  end if;

  if p_team_id is not null and not exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and t.organization_id = v_org_id
  ) then
    raise exception 'VALIDATION_ERROR: team does not belong to event organization';
  end if;

  if p_invitee_name is null or btrim(p_invitee_name) = '' then
    raise exception 'VALIDATION_ERROR: invitee name is required';
  end if;

  if p_invitee_email is null or btrim(p_invitee_email) = '' then
    raise exception 'VALIDATION_ERROR: invitee email is required';
  end if;

  insert into public.event_assignments (
    event_id,
    team_id,
    invitee_name,
    invitee_email,
    invitee_phone,
    role,
    arrival_time,
    start_time,
    end_time,
    notes,
    created_by
  )
  values (
    p_event_id,
    p_team_id,
    btrim(p_invitee_name),
    lower(btrim(p_invitee_email)),
    nullif(btrim(coalesce(p_invitee_phone, '')), ''),
    nullif(btrim(coalesce(p_role, '')), ''),
    p_arrival_time,
    p_start_time,
    p_end_time,
    nullif(btrim(coalesce(p_notes, '')), ''),
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.get_event_assignments_for_organizer(
  p_event_id uuid
)
returns table (
  assignment_id      uuid,
  event_id           uuid,
  team_id            uuid,
  team_name          text,
  participant_id     uuid,
  invitee_name       text,
  invitee_email      text,
  invitee_phone      text,
  role               text,
  arrival_time       timestamptz,
  start_time         timestamptz,
  end_time           timestamptz,
  notes              text,
  viewed_at          timestamptz,
  response_status    text,
  decline_reason     text,
  responded_at       timestamptz,
  created_at         timestamptz,
  updated_at         timestamptz
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

  if v_org_id is null or not app_private.is_org_owner(v_org_id) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    ea.id,
    ea.event_id,
    ea.team_id,
    t.name,
    ea.participant_id,
    ea.invitee_name,
    ea.invitee_email,
    ea.invitee_phone,
    ea.role,
    ea.arrival_time,
    ea.start_time,
    ea.end_time,
    ea.notes,
    ea.viewed_at,
    ea.response_status,
    ea.decline_reason,
    ea.responded_at,
    ea.created_at,
    ea.updated_at
  from public.event_assignments ea
  left join public.teams t on t.id = ea.team_id
  where ea.event_id = p_event_id
  order by
    coalesce(t.name, ''),
    coalesce(ea.arrival_time, ea.start_time, ea.created_at),
    ea.invitee_name;
end;
$$;

create or replace function public.get_admin_notifications()
returns table (
  id            uuid,
  event_id      uuid,
  assignment_id uuid,
  type          text,
  title         text,
  body          text,
  data          jsonb,
  read          boolean,
  created_at    timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    n.id,
    n.event_id,
    n.assignment_id,
    n.type,
    n.title,
    n.body,
    n.data,
    n.read,
    n.created_at
  from public.admin_notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit 50;
$$;

create or replace function public.mark_admin_notification_read(
  p_notification_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_notifications
  set read = true
  where id = p_notification_id
    and user_id = auth.uid();
end;
$$;

-- ============================================================
-- RPCS - GUEST
-- ============================================================

create or replace function public.get_assignments_by_invite_email(
  p_invite_code text,
  p_email       text
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
  v_event_id uuid;
  v_email    text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  if p_invite_code is null or btrim(p_invite_code) = '' or v_email = '' then
    raise exception 'VALIDATION_ERROR';
  end if;

  select e.id into v_event_id
  from public.events e
  where upper(e.invite_code) = upper(btrim(p_invite_code))
    and e.status = 'active';

  if v_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = v_event_id
      and ea.invitee_email_norm = v_email
  ) then
    raise exception 'NOT_INVITED';
  end if;

  update public.event_assignments ea
  set viewed_at = coalesce(ea.viewed_at, now())
  where ea.event_id = v_event_id
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
  where ea.event_id = v_event_id
    and ea.invitee_email_norm = v_email
  order by coalesce(ea.arrival_time, ea.start_time, e.start_date), ea.created_at;
end;
$$;

create or replace function public.get_assignment_roster_by_invite_email(
  p_invite_code text,
  p_email       text
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
  v_event_id uuid;
  v_email    text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  select e.id into v_event_id
  from public.events e
  where upper(e.invite_code) = upper(btrim(coalesce(p_invite_code, '')))
    and e.status = 'active';

  if v_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = v_event_id
      and ea.invitee_email_norm = v_email
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
  where ea.event_id = v_event_id
  order by coalesce(t.name, ''), ea.invitee_name;
end;
$$;

create or replace function public.respond_event_assignment(
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
  v_event_id       uuid;
  v_org_owner_id   uuid;
  v_email          text;
  v_assignment     public.event_assignments%rowtype;
  v_event_title    text;
  v_notif_type     text;
  v_notif_title    text;
  v_notif_body     text;
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

  select e.id, e.title, o.owner_id
  into v_event_id, v_event_title, v_org_owner_id
  from public.events e
  join public.organizations o on o.id = e.organization_id
  where upper(e.invite_code) = upper(btrim(coalesce(p_invite_code, '')))
    and e.status = 'active';

  if v_event_id is null then
    raise exception 'NOT_FOUND';
  end if;

  select *
  into v_assignment
  from public.event_assignments ea
  where ea.id = p_assignment_id
    and ea.event_id = v_event_id
    and ea.invitee_email_norm = v_email;

  if v_assignment.id is null then
    raise exception 'NOT_INVITED';
  end if;

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
    v_event_id,
    p_assignment_id,
    v_notif_type,
    v_notif_title,
    v_notif_body,
    jsonb_build_object(
      'event_id', v_event_id,
      'assignment_id', p_assignment_id,
      'response_status', p_response,
      'invitee_name', v_assignment.invitee_name,
      'role', v_assignment.role,
      'decline_reason', case when p_response = 'declined' then btrim(p_decline_reason) else null end
    )
  );
end;
$$;

-- ============================================================
-- GRANTS - RPCS
-- ============================================================

grant execute on function public.create_event_assignment to authenticated;
grant execute on function public.get_event_assignments_for_organizer to authenticated;
grant execute on function public.get_admin_notifications to authenticated;
grant execute on function public.mark_admin_notification_read to authenticated;
grant execute on function public.get_assignments_by_invite_email to anon, authenticated;
grant execute on function public.get_assignment_roster_by_invite_email to anon, authenticated;
grant execute on function public.respond_event_assignment to anon, authenticated;
