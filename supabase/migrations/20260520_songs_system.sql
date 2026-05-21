-- ============================================================
-- Músicas do sistema: org_id nullable + RLS por escopo
-- org_id IS NULL  → música do sistema, visível para todos
-- org_id NOT NULL → música da organização, visível apenas ao dono
-- ============================================================

-- 1. Torna org_id nullable (músicas do sistema não pertencem a nenhuma org)
alter table public.songs
  alter column org_id drop not null;

-- 2. Remove a política única que misturava leitura e escrita
drop policy if exists "songs: org owner all" on public.songs;

-- 3. Leitura: músicas do sistema (org_id IS NULL) + músicas da própria org
create policy "songs: select own and system"
  on public.songs for select
  to authenticated
  using (
    org_id is null
    or app_private.is_org_owner(org_id)
  );

-- 4. Insert: apenas músicas com org_id da própria org (não pode criar músicas do sistema)
create policy "songs: org owner insert"
  on public.songs for insert
  to authenticated
  with check (
    org_id is not null
    and app_private.is_org_owner(org_id)
  );

-- 5. Update: apenas nas músicas da própria org
create policy "songs: org owner update"
  on public.songs for update
  to authenticated
  using  (org_id is not null and app_private.is_org_owner(org_id))
  with check (org_id is not null and app_private.is_org_owner(org_id));

-- 6. Delete: apenas nas músicas da própria org
create policy "songs: org owner delete"
  on public.songs for delete
  to authenticated
  using (org_id is not null and app_private.is_org_owner(org_id));

-- 7. Índice auxiliar para buscar músicas do sistema (org_id IS NULL)
create index idx_songs_system on public.songs (is_active) where org_id is null;
