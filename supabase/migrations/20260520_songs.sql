-- ============================================================
-- Biblioteca de músicas (songs) e vínculo com eventos (event_songs)
-- ============================================================

-- songs: catálogo institucional da organização
create table public.songs (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid        not null references public.organizations (id) on delete cascade,
  title       text        not null,
  artist      text,
  default_key text,
  male_key    text,
  female_key  text,
  lyrics      text,
  chords      text,
  links       jsonb       not null default '[]',
  notes       text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.songs is 'Institutional song library for an organization.';

create index idx_songs_org_active on public.songs (org_id, is_active);
create index idx_songs_title      on public.songs (org_id, lower(title));

-- event_songs: músicas selecionadas para um evento
create table public.event_songs (
  id           uuid        primary key default gen_random_uuid(),
  event_id     uuid        not null references public.events (id) on delete cascade,
  song_id      uuid        not null references public.songs (id) on delete cascade,
  order_index  integer     not null default 0,
  selected_key text,
  created_at   timestamptz not null default now(),
  unique (event_id, song_id)
);

comment on table public.event_songs is 'Songs assigned to a specific event, with optional key override.';

create index idx_event_songs_event_id on public.event_songs (event_id);

-- ---- updated_at trigger para songs ----
create or replace function public.songs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_songs_updated_at
  before update on public.songs
  for each row execute function public.songs_set_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.songs      enable row level security;
alter table public.event_songs enable row level security;

-- songs: apenas o dono da organização gerencia
create policy "songs: org owner all"
  on public.songs for all
  to authenticated
  using  (app_private.is_org_owner(org_id))
  with check (app_private.is_org_owner(org_id));

-- event_songs: dono da org que criou o evento
create policy "event_songs: org owner all"
  on public.event_songs for all
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app_private.is_org_owner(e.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app_private.is_org_owner(e.organization_id)
    )
  );

-- ============================================================
-- Grants
-- ============================================================

grant select, insert, update, delete on public.songs       to authenticated;
grant select, insert, update, delete on public.event_songs to authenticated;

-- ============================================================
-- RPC: participante guest acessa músicas do evento pelo invite_code
-- ============================================================

create or replace function public.get_event_songs_by_invite(
  p_invite_code text,
  p_event_id    uuid
)
returns table (
  song_id      uuid,
  title        text,
  artist       text,
  default_key  text,
  selected_key text,
  order_index  integer,
  lyrics       text,
  chords       text,
  notes        text,
  links        jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.title,
    s.artist,
    s.default_key,
    es.selected_key,
    es.order_index,
    s.lyrics,
    s.chords,
    s.notes,
    s.links
  from public.event_songs es
  join public.songs s  on s.id  = es.song_id
  join public.events e on e.id  = es.event_id
  where es.event_id   = p_event_id
    and e.invite_code = p_invite_code
    and s.is_active   = true
  order by es.order_index, lower(s.title);
$$;

grant execute on function public.get_event_songs_by_invite(text, uuid)
  to anon, authenticated;
