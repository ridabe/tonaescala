# API SPEC - ToNaEscala

## 1. Objetivo

Definir os contratos de leitura, escrita e automações do ToNaEscala para o MVP. A API será consumida majoritariamente pelo app React Native via `supabase-js`, usando:

- Data API/PostgREST para CRUD simples.
- RPC PostgreSQL para operações transacionais.
- Edge Functions para ações com regras sensíveis, notificações e geração de convites.
- Realtime para atualizações de escalas, confirmações e notificações.

## 2. Princípios

- O app nunca deve usar `service_role` ou chave secreta no cliente mobile.
- Todas as tabelas expostas devem ter RLS habilitado e grants mínimos.
- Operações críticas devem ser feitas por RPC ou Edge Function.
- O `organization_id` é o limite primário de isolamento multi-tenant.
- Participantes sem cadastro não recebem acesso amplo ao banco; devem operar por token de convite e identificador local.

## 3. Autenticação

### Organizador

- Método: Supabase Auth.
- Provedores MVP: email/senha e Google OAuth.
- Role Postgres esperada: `authenticated`.
- Identidade de autorização: `auth.uid()` vinculado a `users.id`.

### Participante

- Método MVP: entrada sem conta obrigatória.
- Identificação local: `device_id` + `participant_access_token`.
- Entrada por evento: `invite_code` ou QR Code.
- Operações sensíveis de participante devem passar por RPC/Edge Function que valide o token.

## 4. Convenções de resposta

### Sucesso

```json
{
  "data": {},
  "error": null
}
```

### Erro

```json
{
  "data": null,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Evento não encontrado ou convite inválido."
  }
}
```

## 5. Códigos de erro

| Código | Uso |
|---|---|
| `UNAUTHENTICATED` | Usuário organizador não autenticado. |
| `FORBIDDEN` | Usuário sem acesso à organização/evento. |
| `INVITE_INVALID` | Código de convite inexistente, expirado ou desativado. |
| `EVENT_NOT_FOUND` | Evento inexistente ou indisponível para o contexto. |
| `SCHEDULE_CONFLICT` | Escala conflita com outro compromisso do participante. |
| `VALIDATION_ERROR` | Payload inválido. |
| `RATE_LIMITED` | Muitas tentativas de entrada/confirmação. |

## 6. Recursos principais

### Organizations

Tabela: `organizations`

Operações MVP:

- Criar organização.
- Listar organizações do organizador.
- Atualizar nome/descrição.

Payload de criação:

```json
{
  "name": "Igreja Exemplo",
  "description": "Ministério de louvor e voluntários"
}
```

Regras:

- Somente organizadores autenticados criam organizações.
- `owner_id` deve ser preenchido pelo backend a partir de `auth.uid()`.

### Events

Tabela: `events`

Operações MVP:

- Criar evento.
- Listar eventos por organização.
- Obter evento por `id`.
- Obter evento público por `invite_code`, com dados limitados.
- Atualizar evento.
- Arquivar/cancelar evento, se o campo de status for adicionado.

Payload de criação:

```json
{
  "organization_id": "uuid",
  "title": "Culto de Domingo",
  "description": "Escala do culto da noite",
  "category": "culto",
  "location": "Templo principal",
  "start_date": "2026-06-07T18:00:00-03:00",
  "end_date": "2026-06-07T20:00:00-03:00",
  "color": "#2563EB"
}
```

Campos gerados:

- `id`
- `invite_code`
- `created_by`
- `created_at`

### Teams

Tabela: `teams`

Operações MVP:

- Criar equipe dentro da organização.
- Listar equipes da organização.
- Vincular equipe a escalas.

Payload:

```json
{
  "organization_id": "uuid",
  "name": "Vocal",
  "type": "music"
}
```

### Participants

Tabela: `participants`

Operações MVP:

- Criar/atualizar participante ao entrar em um evento.
- Consultar perfil local do participante.
- Atualizar nome e telefone.

Payload de entrada:

```json
{
  "invite_code": "TNE-9X4KQ2",
  "device_id": "local-device-id",
  "name": "Alexandre",
  "phone": "+5511999999999"
}
```

Recomendação:

- Não expor CRUD direto amplo de `participants` para `anon`.
- Usar RPC `join_event_by_invite_code`.

### Schedules

Tabela: `schedules`

Operações MVP:

- Criar escala.
- Listar escalas de um evento.
- Listar agenda de um participante.
- Atualizar função, horário, equipe e observações.
- Detectar conflito após criação/edição.

Payload de criação:

```json
{
  "event_id": "uuid",
  "participant_id": "uuid",
  "team_id": "uuid",
  "role": "Vocal",
  "start_time": "2026-06-07T17:00:00-03:00",
  "end_time": "2026-06-07T20:00:00-03:00",
  "notes": "Chegar para passagem de som às 17h."
}
```

### Confirmations

Tabela: `confirmations`

Operações MVP:

- Confirmar presença.
- Recusar participação.
- Marcar atraso.
- Listar respostas por escala/evento para o organizador.

Payload:

```json
{
  "schedule_id": "uuid",
  "participant_id": "uuid",
  "status": "confirmed",
  "response_message": "Confirmado."
}
```

Status permitidos:

- `confirmed`
- `declined`
- `late`

### Notifications

Tabela: `notifications`

Operações MVP:

- Listar notificações do participante.
- Marcar como lida.
- Criar notificação a partir de evento sistêmico.

Tipos MVP:

- `new_schedule`
- `schedule_changed`
- `event_cancelled`
- `reminder`
- `conflict_detected`

## 7. RPCs recomendadas

### `create_organization`

Cria organização com `owner_id = auth.uid()`.

Entrada:

```json
{
  "name": "Igreja Exemplo",
  "description": "Descrição opcional"
}
```

Saída:

```json
{
  "organization_id": "uuid"
}
```

### `generate_event_invite`

Gera ou rotaciona `invite_code` de um evento.

Entrada:

```json
{
  "event_id": "uuid"
}
```

Regras:

- Apenas organizadores com acesso à organização podem gerar convite.
- Código deve ser único.
- Formato sugerido: `TNE-XXXXXX`.

### `join_event_by_invite_code`

Entrada principal do participante sem cadastro.

Entrada:

```json
{
  "invite_code": "TNE-9X4KQ2",
  "device_id": "local-device-id",
  "name": "Alexandre",
  "phone": "+5511999999999"
}
```

Saída:

```json
{
  "participant_id": "uuid",
  "event_id": "uuid",
  "participant_access_token": "opaque-token"
}
```

### `confirm_schedule`

Confirma, recusa ou marca atraso em uma escala.

Entrada:

```json
{
  "schedule_id": "uuid",
  "participant_id": "uuid",
  "participant_access_token": "opaque-token",
  "status": "confirmed",
  "response_message": "Confirmado."
}
```

### `detect_schedule_conflicts`

Executa detecção de conflitos para um participante após criação/edição de escala.

Entrada:

```json
{
  "participant_id": "uuid"
}
```

Saída:

```json
{
  "conflicts_created": 1
}
```

## 8. Edge Functions recomendadas

### `send-push-notification`

Responsável por enviar notificações via Expo Push.

Quando chamar:

- Nova escala.
- Alteração de horário.
- Lembrete antes do evento.
- Conflito detectado.

### `create-event-invite`

Opcional, se a geração de QR Code e link exigir lógica fora do banco.

Saída:

```json
{
  "invite_code": "TNE-9X4KQ2",
  "invite_url": "https://tonaescala.app/join/TNE-9X4KQ2",
  "qr_payload": "TNE-9X4KQ2"
}
```

## 9. Realtime

Canal por evento:

```text
event:{event_id}
```

Eventos:

- `schedule.created`
- `schedule.updated`
- `confirmation.updated`
- `notification.created`

Regras:

- Organizadores só assinam canais das organizações que administram.
- Participantes só assinam canais dos eventos em que entraram.
- Realtime deve ser seletivo para evitar custo e ruído.

## 10. Observações Supabase atuais

- Tabelas em schema exposto precisam de RLS habilitado.
- Grants controlam se a role acessa a tabela pela Data API; RLS controla quais linhas são visíveis.
- Em projetos recentes, tabelas podem não ser expostas automaticamente à Data API; revisar grants e configurações por ambiente.

Referências consultadas:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/changelog?tags=breaking-change

## 11. Contratos SaaS planejados

### Organization Members

Tabela: `organization_members`

Uso:

- listar usuarios vinculados a uma organizacao;
- permitir multiplos administradores no plano Business;
- substituir a regra antiga baseada somente em `organizations.owner_id`.

Campos principais:

```json
{
  "organization_id": "uuid",
  "user_id": "uuid",
  "role": "owner | admin | editor | viewer",
  "status": "active | invited | removed"
}
```

Regras:

- todo `owner_id` atual deve existir como membro `owner`;
- usuarios atuais continuam usando a organizacao como hoje;
- convites e edicao de membros devem ser feitos por RPC futura, nao por insert direto do app.

### Plans

Tabela: `plans`

Planos internos iniciais:

- `individual_free`: ativo, invisivel no app, limite planejado de 10 eventos/subeventos por mes;
- `individual_pro`: inativo ate definicao de cobranca;
- `organization_business`: inativo ate definicao de cobranca.

### Organization Subscriptions

Tabela: `organization_subscriptions`

Uso:

- manter o plano atual de cada organizacao;
- conectar a cobranca futura via `external_provider`, `external_customer_id` e `external_subscription_id`;
- permitir que organizacoes atuais recebam `individual_free` sem mudanca visual.

### Limite de eventos

O backend deve centralizar a validacao em funcao/RPC antes de ativar o limite visualmente.

Regra planejada:

- contar eventos e subeventos criados no mes por `organization_id`;
- `individual_free`: ate 10 por mes;
- `individual_pro` e `organization_business`: ilimitado.
