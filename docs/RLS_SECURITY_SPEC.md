# RLS SECURITY SPEC - ToNaEscala

## 1. Objetivo

Definir o modelo de segurança do ToNaEscala em Supabase/PostgreSQL, garantindo isolamento entre organizações, proteção de dados de participantes e suporte controlado à entrada sem cadastro.

## 2. Atores

| Ator | Autenticação | Role Supabase | Acesso esperado |
|---|---|---|---|
| Organizador | Supabase Auth | `authenticated` | Organizações que possui ou administra. |
| Participante sem conta | Device/token local | `anon` ou rota mediada | Apenas eventos/escalas associados ao convite/token. |
| Sistema | Service key em Edge Function | `service_role` no servidor | Operações internas, notificações e rotinas. |

## 3. Princípios de segurança

- RLS obrigatória em todas as tabelas do schema `public`.
- Grants mínimos para `anon` e `authenticated`.
- Nenhuma chave `service_role` no app.
- Dados de autorização não devem depender de `user_metadata`.
- Funções `security definer` devem ficar em schema privado, não exposto.
- Views expostas devem usar `security_invoker = true` quando aplicável.
- UPDATE precisa de SELECT policy compatível, porque o Postgres precisa selecionar a linha antes de alterá-la.

## 4. Modelo de ownership

### `users`

- `users.id` deve espelhar `auth.users.id`.
- Organizadores autenticados podem ler e atualizar apenas o próprio perfil.

### `organizations`

- `owner_id` define o proprietário.
- Futuro: criar tabela `organization_members` para múltiplos líderes.

Policy MVP:

```sql
create policy "owners can read own organizations"
on public.organizations
for select
to authenticated
using (owner_id = auth.uid());
```

```sql
create policy "owners can update own organizations"
on public.organizations
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
```

## 5. Helper functions recomendadas

Criar funções em schema privado, por exemplo `app_private`.

### `app_private.is_org_owner(org_id uuid)`

```sql
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
```

Uso:

```sql
using (app_private.is_org_owner(organization_id))
```

## 6. Policies por tabela

### `events`

Organizadores podem gerenciar eventos da própria organização.

```sql
create policy "org owners can read events"
on public.events
for select
to authenticated
using (app_private.is_org_owner(organization_id));
```

```sql
create policy "org owners can insert events"
on public.events
for insert
to authenticated
with check (
  app_private.is_org_owner(organization_id)
  and created_by = auth.uid()
);
```

```sql
create policy "org owners can update events"
on public.events
for update
to authenticated
using (app_private.is_org_owner(organization_id))
with check (app_private.is_org_owner(organization_id));
```

Leitura pública por convite:

- Evitar SELECT aberto direto em `events`.
- Criar RPC `get_public_event_by_invite_code` que retorna somente campos públicos.

Campos públicos sugeridos:

- `title`
- `organization_name`
- `category`
- `location`
- `start_date`
- `end_date`

### `teams`

```sql
create policy "org owners can manage teams"
on public.teams
for all
to authenticated
using (app_private.is_org_owner(organization_id))
with check (app_private.is_org_owner(organization_id));
```

### `participants`

Risco principal: participantes sem login não podem ter SELECT aberto por `device_id`, pois isso é fácil de falsificar.

Recomendação MVP:

- Não dar grants diretos de SELECT amplo para `anon`.
- Criar/atualizar participante por RPC `join_event_by_invite_code`.
- Armazenar `participant_access_token_hash`, nunca o token puro.

Campos recomendados adicionais:

- `participant_access_token_hash text`
- `last_seen_at timestamptz`
- `created_at timestamptz`

### `participant_events`

Define quais participantes entraram em quais eventos.

Organizadores podem ler participantes dos eventos de suas organizações:

```sql
create policy "org owners can read participant events"
on public.participant_events
for select
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = participant_events.event_id
      and app_private.is_org_owner(e.organization_id)
  )
);
```

Participantes entram via RPC, não por INSERT direto.

### `schedules`

Organizadores podem gerenciar escalas dos eventos de suas organizações:

```sql
create policy "org owners can manage schedules"
on public.schedules
for all
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
```

Participantes consultam agenda por RPC validando token:

- `get_participant_agenda(participant_id, participant_access_token)`

### `confirmations`

Organizadores podem ler confirmações de eventos sob sua organização.

Participantes confirmam via RPC:

- `confirm_schedule(schedule_id, participant_id, participant_access_token, status, response_message)`

### `conflicts`

Organizadores podem ler conflitos que envolvem escalas dos eventos que administram.

Participantes podem consultar conflitos próprios via RPC tokenizada.

### `notifications`

Participantes leem e marcam notificações próprias via RPC tokenizada.

Organizadores não precisam ler notificações pessoais, exceto métricas agregadas futuras.

## 7. Grants recomendados

Exemplo-base, a ajustar por tabela:

```sql
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.schedules to authenticated;
grant select, insert, update, delete on public.confirmations to authenticated;

grant execute on function public.join_event_by_invite_code to anon, authenticated;
grant execute on function public.get_public_event_by_invite_code to anon, authenticated;
grant execute on function public.confirm_schedule to anon, authenticated;
```

Evitar no MVP:

```sql
grant select on public.participants to anon;
grant select on public.schedules to anon;
```

## 8. Entrada sem cadastro

Fluxo seguro recomendado:

1. Participante informa `invite_code`.
2. RPC valida se evento existe e convite está ativo.
3. RPC cria ou reutiliza participante com base em `device_id`, telefone e evento.
4. Backend gera `participant_access_token` opaco.
5. App armazena token localmente em storage seguro.
6. Futuras leituras/ações usam token em RPCs específicas.

Regras:

- Token deve poder ser rotacionado.
- Token puro não deve ficar no banco.
- Rate limit por IP/device para tentativas de convite.
- `invite_code` deve poder ser desativado ou rotacionado pelo organizador.

## 9. Auditoria mínima

Adicionar no MVP ou logo após:

- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Para fase futura:

- `audit_logs`
- registro de alterações críticas em eventos, escalas e convites.

## 10. Checklist de implementação

- [ ] RLS habilitada em todas as tabelas públicas.
- [ ] Grants revisados para `anon` e `authenticated`.
- [ ] `service_role` usado apenas em ambiente servidor.
- [ ] RPCs de participante validam token.
- [ ] `invite_code` único, rotacionável e com proteção contra brute force.
- [ ] Policies testadas com usuário organizador A, organizador B e participante sem login.
- [ ] Realtime restrito aos canais necessários.
- [ ] Nenhuma view exposta bypassando RLS.

## 11. Referências consultadas

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/changelog?tags=breaking-change

## 12. Evolucao SaaS - membership por organizacao

A partir da fundacao SaaS, `organizations.owner_id` deixa de ser a unica fonte de permissao operacional. Ele permanece como dono primario/legal, mas a autorizacao deve usar `organization_members`.

Tabela base:

```sql
public.organization_members (
  organization_id uuid,
  user_id uuid,
  role text,
  status text
)
```

Papeis planejados:

- `owner`: administra organizacao, billing futuro e membros.
- `admin`: administra eventos, equipes, escalas e membros operacionais.
- `editor`: administra conteudo operacional, sem billing.
- `viewer`: acesso futuro somente leitura.

Helpers:

```sql
app_private.is_org_member(org_id uuid)
app_private.has_org_role(org_id uuid, allowed_roles text[])
app_private.can_admin_org(org_id uuid)
```

Compatibilidade:

- `app_private.is_org_owner(org_id)` continua existindo para nao quebrar policies/RPCs antigas.
- A implementacao passa a considerar membros ativos com papel administrativo.
- Novas policies devem preferir `has_org_role` com papeis explicitos.

Novas tabelas expostas devem seguir a mesma regra:

- leitura: membro ativo da organizacao;
- escrita operacional: `owner`, `admin` ou `editor`, conforme o recurso;
- billing/membros sensiveis: `owner` ou RPC server-side.
