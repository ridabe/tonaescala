# Fase 2 - Banco de Convocacoes

## Status

Concluida no repositorio.

Migration criada:

```text
supabase/migrations/20260519163000_phase2_event_assignments.sql
```

## Objetivo

Criar a base de dados para o novo fluxo de convocacoes por `codigo do evento + email`.

## Entregas

### 1. Tabela `event_assignments`

Representa cada pessoa convocada para atuar em um evento.

Campos principais:

- `event_id`
- `team_id`
- `participant_id`
- `invitee_name`
- `invitee_email`
- `invitee_email_norm`
- `invitee_phone`
- `role`
- `arrival_time`
- `start_time`
- `end_time`
- `notes`
- `viewed_at`
- `response_status`
- `decline_reason`
- `responded_at`
- `created_by`

Regras:

- Nome obrigatorio.
- Email obrigatorio.
- `response_status` aceita `pending`, `accepted`, `declined`.
- Quando `response_status = declined`, `decline_reason` e obrigatorio.
- Quando resposta for `accepted` ou `declined`, `responded_at` e obrigatorio.

### 2. Tabela `admin_notifications`

Guarda notificacoes para o admin quando o convidado responde.

Tipos criados:

- `assignment_accepted`
- `assignment_declined`

Nesta fase, a tabela registra a notificacao no banco. O envio push real entra em fase posterior.

### 3. RLS e grants

`event_assignments`:

- Admin autenticado pode gerenciar apenas convocacoes de eventos da propria organizacao.
- Convidado nao acessa a tabela diretamente.
- Convidado acessa apenas via RPC por codigo + email.

`admin_notifications`:

- Admin autenticado le e marca como lidas apenas as proprias notificacoes.

### 4. RPCs do admin

`create_event_assignment`

- Cria uma convocacao.
- Valida se o evento pertence ao admin.
- Valida se a equipe pertence a mesma organizacao do evento.

`get_event_assignments_for_organizer`

- Lista todas as convocacoes de um evento para o admin.
- Inclui equipe, status, motivo da recusa e horarios.

`get_admin_notifications`

- Lista notificacoes recentes do admin.

`mark_admin_notification_read`

- Marca uma notificacao do admin como lida.

### 5. RPCs do convidado

`get_assignments_by_invite_email`

- Recebe `invite_code + email`.
- Verifica se o evento existe e esta ativo.
- Verifica se o email esta escalado.
- Marca a convocacao como visualizada.
- Retorna os dados do evento e da convocacao.

`get_assignment_roster_by_invite_email`

- Recebe `invite_code + email`.
- Verifica se o email esta escalado.
- Retorna a lista visivel de convocados do evento.
- Nao retorna email nem telefone dos outros convocados.

`respond_event_assignment`

- Recebe `invite_code + email + assignment_id + resposta`.
- Aceita `accepted` ou `declined`.
- Exige justificativa quando a resposta for `declined`.
- Atualiza status da convocacao.
- Cria notificacao para o admin.

## Como aplicar no Supabase

Como a CLI global do Supabase nao esta disponivel neste ambiente, aplique a migration pelo SQL Editor do Supabase ou pelo fluxo de migrations que voce estiver usando.

Arquivo:

```text
supabase/migrations/20260519163000_phase2_event_assignments.sql
```

## Criterios de aceite

- Tabela `event_assignments` existe.
- Tabela `admin_notifications` existe.
- Admin consegue criar convocacao via RPC.
- Convidado consegue consultar convocacao por `codigo + email`.
- Consulta com email nao convocado retorna erro `NOT_INVITED`.
- Recusa sem justificativa retorna erro de validacao.
- Recusa com justificativa cria notificacao para o admin.

## Proxima fase

Fase 3: ajustar a tela do admin para criar convocacoes com email obrigatorio em vez de criar participante solto.
