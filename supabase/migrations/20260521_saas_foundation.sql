-- ============================================================
-- ToNaEscala - SaaS foundation
-- ============================================================
-- This migration keeps the current app experience unchanged while
-- preparing the backend for plans, subscriptions, and multi-admin orgs.

-- ------------------------------------------------------------
-- Organizations: classify current/future tenants
-- ------------------------------------------------------------

alter table public.organizations
  add column if not exists account_type text not null default 'personal'
    check (account_type in ('personal', 'business'));

-- ------------------------------------------------------------
-- Plans and subscriptions
-- ------------------------------------------------------------

create table if not exists public.plans (
  code text primary key,
  name text not null,
  audience text not null check (audience in ('individual', 'organization')),
  monthly_event_limit integer check (monthly_event_limit is null or monthly_event_limit >= 0),
  allows_multi_admin boolean not null default false,
  is_active boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plans is 'Internal SaaS plan catalog. Plans may exist before being public in the app.';

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_code text not null references public.plans (code),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'inactive', 'past_due', 'cancelled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  external_provider text,
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

comment on table public.organization_subscriptions is 'Current billing/subscription state for an organization.';

create index if not exists idx_org_subscriptions_plan
  on public.organization_subscriptions (plan_code);

create index if not exists idx_org_subscriptions_status
  on public.organization_subscriptions (status);

insert into public.plans (
  code,
  name,
  audience,
  monthly_event_limit,
  allows_multi_admin,
  is_active,
  is_public
)
values
  ('individual_free', 'Free Individual', 'individual', 10, false, true, false),
  ('individual_pro', 'Pro Individual', 'individual', null, false, false, false),
  ('organization_business', 'Business Organization', 'organization', null, true, false, false)
on conflict (code) do update
set
  name = excluded.name,
  audience = excluded.audience,
  monthly_event_limit = excluded.monthly_event_limit,
  allows_multi_admin = excluded.allows_multi_admin,
  is_active = excluded.is_active,
  is_public = excluded.is_public,
  updated_at = now();

-- ------------------------------------------------------------
-- Organization members
-- ------------------------------------------------------------

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'admin'
    check (role in ('owner', 'admin', 'editor', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'removed')),
  invited_by uuid references public.users (id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.organization_members is 'Users who can access or administer an organization.';

create index if not exists idx_org_members_user_status
  on public.organization_members (user_id, status);

create index if not exists idx_org_members_org_status
  on public.organization_members (organization_id, status);

insert into public.organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at
)
select
  o.id,
  o.owner_id,
  'owner',
  'active',
  o.created_at
from public.organizations o
on conflict (organization_id, user_id) do update
set
  role = case
    when public.organization_members.role = 'owner' then public.organization_members.role
    else excluded.role
  end,
  status = 'active',
  joined_at = coalesce(public.organization_members.joined_at, excluded.joined_at),
  updated_at = now();

insert into public.organization_subscriptions (
  organization_id,
  plan_code,
  status,
  current_period_start
)
select
  o.id,
  'individual_free',
  'active',
  date_trunc('month', now())
from public.organizations o
on conflict (organization_id) do nothing;

-- ------------------------------------------------------------
-- Updated_at triggers
-- ------------------------------------------------------------

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_org_subscriptions_updated_at on public.organization_subscriptions;
create trigger trg_org_subscriptions_updated_at
  before update on public.organization_subscriptions
  for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_org_members_updated_at on public.organization_members;
create trigger trg_org_members_updated_at
  before update on public.organization_members
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- Auto-provision SaaS records for newly created organizations
-- ------------------------------------------------------------

create or replace function app_private.handle_new_organization_saas_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    new.id,
    new.owner_id,
    'owner',
    'active',
    now()
  )
  on conflict (organization_id, user_id) do nothing;

  insert into public.organization_subscriptions (
    organization_id,
    plan_code,
    status,
    current_period_start
  )
  values (
    new.id,
    'individual_free',
    'active',
    date_trunc('month', now())
  )
  on conflict (organization_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_organization_created_saas_defaults on public.organizations;
create trigger on_organization_created_saas_defaults
  after insert on public.organizations
  for each row execute procedure app_private.handle_new_organization_saas_defaults();

-- ------------------------------------------------------------
-- Authorization helpers
-- ------------------------------------------------------------

create or replace function app_private.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function app_private.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role = any (allowed_roles)
  );
$$;

create or replace function app_private.can_admin_org(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.has_org_role(org_id, array['owner', 'admin', 'editor']);
$$;

-- Compatibility shim. Existing policies and RPCs still call this helper.
-- Its behavior now means "can administer organization data", not only owner.
create or replace function app_private.is_org_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.can_admin_org(org_id);
$$;

create or replace function app_private.current_org_plan_code(org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select os.plan_code
    from public.organization_subscriptions os
    where os.organization_id = org_id
      and os.status in ('active', 'trialing')
    limit 1
  ), 'individual_free');
$$;

create or replace function app_private.get_org_monthly_event_usage(
  org_id uuid,
  reference_at timestamptz default now()
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.events e
  where e.organization_id = org_id
    and e.created_at >= date_trunc('month', reference_at)
    and e.created_at < date_trunc('month', reference_at) + interval '1 month';
$$;

create or replace function app_private.can_create_event_for_plan(
  org_id uuid,
  reference_at timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.monthly_event_limit is null
      or app_private.get_org_monthly_event_usage(org_id, reference_at) < p.monthly_event_limit
    from public.plans p
    where p.code = app_private.current_org_plan_code(org_id)
    limit 1
  ), true);
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "plans: authenticated select" on public.plans;
create policy "plans: authenticated select"
  on public.plans for select
  to authenticated
  using (true);

drop policy if exists "organization_members: select same org" on public.organization_members;
create policy "organization_members: select same org"
  on public.organization_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or app_private.is_org_member(organization_id)
  );

drop policy if exists "organization_subscriptions: members select" on public.organization_subscriptions;
create policy "organization_subscriptions: members select"
  on public.organization_subscriptions for select
  to authenticated
  using (app_private.is_org_member(organization_id));

drop policy if exists "organizations: owner select" on public.organizations;
create policy "organizations: members select"
  on public.organizations for select
  to authenticated
  using (app_private.is_org_member(id));

drop policy if exists "organizations: owner update" on public.organizations;
create policy "organizations: admins update"
  on public.organizations for update
  to authenticated
  using (app_private.has_org_role(id, array['owner', 'admin']))
  with check (app_private.has_org_role(id, array['owner', 'admin']));

drop policy if exists "organizations: owner delete" on public.organizations;
create policy "organizations: owners delete"
  on public.organizations for delete
  to authenticated
  using (app_private.has_org_role(id, array['owner']));

grant select on public.plans to authenticated;
grant select on public.organization_subscriptions to authenticated;
grant select on public.organization_members to authenticated;
