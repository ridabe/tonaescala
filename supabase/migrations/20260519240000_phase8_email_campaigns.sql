-- Phase 8: email campaigns for event assignments

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists public.event_email_campaigns (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  created_by     uuid not null references auth.users(id),
  subject        text not null,
  status         text not null default 'draft'
                   check (status in ('draft','sending','sent','partial_failed','failed')),
  recipient_count int not null default 0,
  sent_count      int not null default 0,
  failed_count    int not null default 0,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz
);

create table if not exists public.event_email_recipients (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.event_email_campaigns(id) on delete cascade,
  event_id            uuid not null references public.events(id) on delete cascade,
  assignment_id       uuid not null references public.event_assignments(id) on delete cascade,
  invitee_email       text not null,
  invitee_name        text not null,
  status              text not null default 'queued'
                        check (status in ('queued','sent','failed','skipped')),
  provider_message_id text,
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────

alter table public.event_email_campaigns enable row level security;
alter table public.event_email_recipients enable row level security;

-- admin reads/manages only campaigns they created for events in their org (owner)
create policy "admin_manage_campaigns"
  on public.event_email_campaigns
  for all
  using (
    created_by = auth.uid()
    and exists (
      select 1 from public.events e
      join public.organizations o on o.id = e.organization_id
      where e.id = event_email_campaigns.event_id
        and o.owner_id = auth.uid()
    )
  );

create policy "admin_read_recipients"
  on public.event_email_recipients
  for select
  using (
    exists (
      select 1 from public.event_email_campaigns c
      where c.id = event_email_recipients.campaign_id
        and c.created_by = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

create index if not exists idx_email_campaigns_event_id on public.event_email_campaigns(event_id);
create index if not exists idx_email_recipients_campaign_id on public.event_email_recipients(campaign_id);

-- ─────────────────────────────────────────────
-- RPC: create_event_email_campaign
-- Creates campaign + queues one recipient per assignment
-- Returns campaign id
-- ─────────────────────────────────────────────

create or replace function public.create_event_email_campaign(
  p_event_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_event       public.events%rowtype;
  v_org_member  boolean;
  v_subject     text;
  v_count       int;
begin
  -- validate caller is member of the event's org
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  select exists(
    select 1 from public.organizations
    where id = v_event.organization_id
      and owner_id = auth.uid()
  ) into v_org_member;

  if not v_org_member then
    raise exception 'NOT_AUTHORIZED';
  end if;

  -- count eligible assignments (must have email)
  select count(*) into v_count
  from public.event_assignments
  where event_id = p_event_id
    and invitee_email_norm is not null
    and invitee_email_norm <> '';

  if v_count = 0 then
    raise exception 'NO_RECIPIENTS';
  end if;

  v_subject := 'Convocação para ' || v_event.title;

  -- create campaign
  insert into public.event_email_campaigns (event_id, created_by, subject, status, recipient_count)
  values (p_event_id, auth.uid(), v_subject, 'draft', v_count)
  returning id into v_campaign_id;

  -- queue recipients
  insert into public.event_email_recipients
    (campaign_id, event_id, assignment_id, invitee_email, invitee_name, status)
  select
    v_campaign_id,
    p_event_id,
    ea.id,
    ea.invitee_email,
    ea.invitee_name,
    'queued'
  from public.event_assignments ea
  where ea.event_id = p_event_id
    and ea.invitee_email_norm is not null
    and ea.invitee_email_norm <> '';

  return v_campaign_id;
end;
$$;

-- ─────────────────────────────────────────────
-- RPC: get_event_email_campaigns
-- Lists campaigns for an event (most recent first)
-- ─────────────────────────────────────────────

create or replace function public.get_event_email_campaigns(
  p_event_id uuid
)
returns table (
  campaign_id     uuid,
  subject         text,
  status          text,
  recipient_count int,
  sent_count      int,
  failed_count    int,
  created_at      timestamptz,
  finished_at     timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- validate caller belongs to the event's org
  if not exists (
    select 1 from public.events e
    join public.organizations o on o.id = e.organization_id
    where e.id = p_event_id and o.owner_id = auth.uid()
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  return query
  select
    c.id,
    c.subject,
    c.status,
    c.recipient_count,
    c.sent_count,
    c.failed_count,
    c.created_at,
    c.finished_at
  from public.event_email_campaigns c
  where c.event_id = p_event_id
  order by c.created_at desc;
end;
$$;

-- ─────────────────────────────────────────────
-- RPC: get_event_email_campaign_recipients
-- Details per recipient for a given campaign
-- ─────────────────────────────────────────────

create or replace function public.get_event_email_campaign_recipients(
  p_campaign_id uuid
)
returns table (
  recipient_id        uuid,
  invitee_name        text,
  invitee_email       text,
  status              text,
  provider_message_id text,
  error_message       text,
  sent_at             timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- validate caller owns the campaign
  if not exists (
    select 1 from public.event_email_campaigns c
    where c.id = p_campaign_id and c.created_by = auth.uid()
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  return query
  select
    r.id,
    r.invitee_name,
    r.invitee_email,
    r.status,
    r.provider_message_id,
    r.error_message,
    r.sent_at
  from public.event_email_recipients r
  where r.campaign_id = p_campaign_id
  order by r.invitee_name;
end;
$$;

-- grants
grant execute on function public.create_event_email_campaign(uuid) to authenticated;
grant execute on function public.get_event_email_campaigns(uuid) to authenticated;
grant execute on function public.get_event_email_campaign_recipients(uuid) to authenticated;
