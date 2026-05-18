-- ============================================================
-- ToNaEscala — Initial Schema
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- PRIVATE SCHEMA (security functions — never exposed via API)
-- ============================================================

create schema if not exists app_private;

-- ============================================================
-- TABLES
-- ============================================================

-- users: mirrors auth.users for profile data
create table public.users (
  id          uuid        primary key references auth.users (id) on delete cascade,
  name        text,
  email       text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.users is 'Organizer profile data, mirroring auth.users.';

-- organizations: top-level multi-tenant unit
create table public.organizations (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null references public.users (id) on delete restrict,
  name        text        not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.organizations is 'Church, ministry or group that owns events.';

-- events: individual occurrences (culto, ensaio, conferencia...)
create table public.events (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations (id) on delete cascade,
  title           text        not null,
  description     text,
  category        text,
  location        text,
  start_date      timestamptz not null,
  end_date        timestamptz,
  color           text        not null default '#2563EB',
  invite_code     text        unique,
  status          text        not null default 'active'
                              check (status in ('active', 'cancelled', 'archived')),
  created_by      uuid        not null references public.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.events is 'Event created by an organizer inside an organization.';

-- teams: functional groups within an organization (Vocal, Midia, Recepcao...)
create table public.teams (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations (id) on delete cascade,
  name            text        not null,
  type            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.teams is 'Team (ministry group) scoped to an organization.';

-- participants: people who join events without a mandatory account
create table public.participants (
  id                            uuid        primary key default gen_random_uuid(),
  name                          text        not null,
  phone                         text,
  device_id                     text,
  participant_access_token_hash text,
  last_seen_at                  timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
comment on table public.participants is 'Accountless person who participates in events via invite code.';

-- participant_events: which participants entered which events
create table public.participant_events (
  id             uuid        primary key default gen_random_uuid(),
  participant_id uuid        not null references public.participants (id) on delete cascade,
  event_id       uuid        not null references public.events (id) on delete cascade,
  joined_at      timestamptz not null default now(),
  unique (participant_id, event_id)
);
comment on table public.participant_events is 'Join record between a participant and an event.';

-- schedules: assignment of a participant to a role/team/timeslot in an event
create table public.schedules (
  id             uuid        primary key default gen_random_uuid(),
  event_id       uuid        not null references public.events (id) on delete cascade,
  participant_id uuid        not null references public.participants (id) on delete cascade,
  team_id        uuid        references public.teams (id) on delete set null,
  role           text,
  start_time     timestamptz,
  end_time       timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.schedules is 'Participant assignment to a specific role and time within an event.';

-- confirmations: participant response to a schedule (confirmed / declined / late)
create table public.confirmations (
  id               uuid        primary key default gen_random_uuid(),
  schedule_id      uuid        not null references public.schedules (id) on delete cascade,
  participant_id   uuid        not null references public.participants (id) on delete cascade,
  status           text        not null check (status in ('confirmed', 'declined', 'late')),
  response_message text,
  responded_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (schedule_id, participant_id)
);
comment on table public.confirmations is 'Participant response to a schedule assignment.';

-- conflicts: overlapping schedule assignments for the same participant
create table public.conflicts (
  id             uuid        primary key default gen_random_uuid(),
  participant_id uuid        not null references public.participants (id) on delete cascade,
  schedule_id_1  uuid        not null references public.schedules (id) on delete cascade,
  schedule_id_2  uuid        not null references public.schedules (id) on delete cascade,
  detected_at    timestamptz not null default now(),
  resolved       boolean     not null default false,
  resolved_at    timestamptz
);
comment on table public.conflicts is 'Detected time overlap between two schedules for the same participant.';

-- notifications: in-app messages for participants
create table public.notifications (
  id             uuid        primary key default gen_random_uuid(),
  participant_id uuid        not null references public.participants (id) on delete cascade,
  type           text        not null check (type in (
                               'new_schedule', 'schedule_changed',
                               'event_cancelled', 'reminder', 'conflict_detected'
                             )),
  title          text        not null,
  body           text,
  data           jsonb,
  read           boolean     not null default false,
  created_at     timestamptz not null default now()
);
comment on table public.notifications is 'System notifications delivered to participants.';

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.organizations (owner_id);

create index on public.events (organization_id);
create index on public.events (invite_code);
create index on public.events (status);

create index on public.teams (organization_id);

create index on public.participant_events (participant_id);
create index on public.participant_events (event_id);

create index on public.schedules (event_id);
create index on public.schedules (participant_id);
create index on public.schedules (team_id);
create index on public.schedules (start_time, end_time);

create index on public.confirmations (schedule_id);
create index on public.confirmations (participant_id);

create index on public.conflicts (participant_id);
create index on public.conflicts (schedule_id_1);
create index on public.conflicts (schedule_id_2);
create index on public.conflicts (resolved) where resolved = false;

create index on public.notifications (participant_id);
create index on public.notifications (read) where read = false;

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.handle_updated_at();

create trigger trg_events_updated_at
  before update on public.events
  for each row execute procedure public.handle_updated_at();

create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute procedure public.handle_updated_at();

create trigger trg_participants_updated_at
  before update on public.participants
  for each row execute procedure public.handle_updated_at();

create trigger trg_schedules_updated_at
  before update on public.schedules
  for each row execute procedure public.handle_updated_at();

create trigger trg_confirmations_updated_at
  before update on public.confirmations
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PRIVATE HELPER FUNCTIONS (app_private schema)
-- ============================================================

create or replace function app_private.is_org_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = org_id
      and o.owner_id = auth.uid()
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users              enable row level security;
alter table public.organizations      enable row level security;
alter table public.events             enable row level security;
alter table public.teams              enable row level security;
alter table public.participants       enable row level security;
alter table public.participant_events enable row level security;
alter table public.schedules          enable row level security;
alter table public.confirmations      enable row level security;
alter table public.conflicts          enable row level security;
alter table public.notifications      enable row level security;

-- ---- users ----
create policy "users: read own profile"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "users: update own profile"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- organizations ----
create policy "organizations: owner select"
  on public.organizations for select
  to authenticated
  using (owner_id = auth.uid());

create policy "organizations: owner insert"
  on public.organizations for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "organizations: owner update"
  on public.organizations for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "organizations: owner delete"
  on public.organizations for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---- events ----
create policy "events: org owner select"
  on public.events for select
  to authenticated
  using (app_private.is_org_owner(organization_id));

create policy "events: org owner insert"
  on public.events for insert
  to authenticated
  with check (
    app_private.is_org_owner(organization_id)
    and created_by = auth.uid()
  );

create policy "events: org owner update"
  on public.events for update
  to authenticated
  using (app_private.is_org_owner(organization_id))
  with check (app_private.is_org_owner(organization_id));

create policy "events: org owner delete"
  on public.events for delete
  to authenticated
  using (app_private.is_org_owner(organization_id));

-- ---- teams ----
create policy "teams: org owner all"
  on public.teams for all
  to authenticated
  using (app_private.is_org_owner(organization_id))
  with check (app_private.is_org_owner(organization_id));

-- ---- participants ----
-- No direct anon access. Org owners read participants via their events.
create policy "participants: org owner select via events"
  on public.participants for select
  to authenticated
  using (
    exists (
      select 1
      from public.participant_events pe
      join public.events e on e.id = pe.event_id
      where pe.participant_id = participants.id
        and app_private.is_org_owner(e.organization_id)
    )
  );

-- ---- participant_events ----
create policy "participant_events: org owner select"
  on public.participant_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = participant_events.event_id
        and app_private.is_org_owner(e.organization_id)
    )
  );

-- ---- schedules ----
create policy "schedules: org owner all"
  on public.schedules for all
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = schedules.event_id
        and app_private.is_org_owner(e.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = schedules.event_id
        and app_private.is_org_owner(e.organization_id)
    )
  );

-- ---- confirmations ----
create policy "confirmations: org owner select"
  on public.confirmations for select
  to authenticated
  using (
    exists (
      select 1
      from public.schedules s
      join public.events e on e.id = s.event_id
      where s.id = confirmations.schedule_id
        and app_private.is_org_owner(e.organization_id)
    )
  );

-- ---- conflicts ----
create policy "conflicts: org owner select"
  on public.conflicts for select
  to authenticated
  using (
    exists (
      select 1
      from public.schedules s
      join public.events e on e.id = s.event_id
      where s.id = conflicts.schedule_id_1
        and app_private.is_org_owner(e.organization_id)
    )
  );

-- notifications: participants access only via tokenized RPC

-- ============================================================
-- GRANTS
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update         on public.users              to authenticated;
grant select, insert, update, delete on public.organizations      to authenticated;
grant select, insert, update, delete on public.events             to authenticated;
grant select, insert, update, delete on public.teams              to authenticated;
grant select                         on public.participants        to authenticated;
grant select                         on public.participant_events  to authenticated;
grant select, insert, update, delete on public.schedules          to authenticated;
grant select, insert, update, delete on public.confirmations      to authenticated;
grant select                         on public.conflicts           to authenticated;

-- ============================================================
-- RPCs
-- ============================================================

-- ---- create_organization ----
create or replace function public.create_organization(
  p_name        text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  insert into public.organizations (owner_id, name, description)
  values (auth.uid(), p_name, p_description)
  returning id into v_org_id;

  return v_org_id;
end;
$$;

-- ---- generate_event_invite ----
create or replace function public.generate_event_invite(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code   text;
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.events
  where id = p_event_id;

  if not app_private.is_org_owner(v_org_id) then
    raise exception 'FORBIDDEN';
  end if;

  loop
    v_code := 'TNE-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1 from public.events where invite_code = v_code
    );
  end loop;

  update public.events set invite_code = v_code where id = p_event_id;

  return v_code;
end;
$$;

-- ---- get_public_event_by_invite_code ----
create or replace function public.get_public_event_by_invite_code(p_invite_code text)
returns table (
  event_id          uuid,
  title             text,
  organization_name text,
  category          text,
  location          text,
  start_date        timestamptz,
  end_date          timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    e.id,
    e.title,
    o.name,
    e.category,
    e.location,
    e.start_date,
    e.end_date
  from public.events e
  join public.organizations o on o.id = e.organization_id
  where e.invite_code = p_invite_code
    and e.status = 'active';
end;
$$;

-- ---- join_event_by_invite_code ----
create or replace function public.join_event_by_invite_code(
  p_invite_code text,
  p_device_id   text,
  p_name        text,
  p_phone       text default null
)
returns json
language plpgsql
security definer
set search_path = public
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

-- ---- confirm_schedule ----
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
set search_path = public
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

-- ---- detect_schedule_conflicts ----
create or replace function public.detect_schedule_conflicts(p_participant_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  delete from public.conflicts
  where participant_id = p_participant_id
    and resolved = false;

  insert into public.conflicts (participant_id, schedule_id_1, schedule_id_2)
  select distinct
    p_participant_id,
    s1.id,
    s2.id
  from public.schedules s1
  join public.schedules s2
    on  s2.participant_id = p_participant_id
    and s2.id > s1.id
    and s1.start_time < s2.end_time
    and s1.end_time   > s2.start_time
  where s1.participant_id = p_participant_id
    and s1.start_time is not null
    and s1.end_time   is not null
    and s2.start_time is not null
    and s2.end_time   is not null;

  get diagnostics v_count = row_count;

  return json_build_object('conflicts_created', v_count);
end;
$$;

-- ---- get_participant_agenda ----
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

-- ---- grant execute on all RPCs ----
grant execute on function public.create_organization             to authenticated;
grant execute on function public.generate_event_invite           to authenticated;
grant execute on function public.get_public_event_by_invite_code to anon, authenticated;
grant execute on function public.join_event_by_invite_code       to anon, authenticated;
grant execute on function public.confirm_schedule                to anon, authenticated;
grant execute on function public.detect_schedule_conflicts       to authenticated;
grant execute on function public.get_participant_agenda          to anon, authenticated;
