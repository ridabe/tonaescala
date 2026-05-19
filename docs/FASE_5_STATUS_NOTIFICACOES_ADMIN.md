# Fase 5 - Status e notificacoes do admin

## Status

Concluida no repositorio.

## Objetivo

Exibir para o organizador as notificacoes geradas quando um convidado aceita ou recusa uma convocacao, e melhorar a leitura dos status na escala do evento.

## Entregas

### 1. Camada de dados

Arquivo alterado:

```text
lib/notifications.ts
```

Novas funcoes:

- `getAdminNotifications`
- `markAdminNotificationRead`

Essas funcoes usam as RPCs criadas na Fase 2:

- `get_admin_notifications`
- `mark_admin_notification_read`

### 2. Contador de notificacoes

Arquivo alterado:

```text
hooks/useUnreadCount.ts
```

Mudancas:

- Admin autenticado passa a contar notificacoes de `admin_notifications`.
- Participante local continua contando notificacoes antigas por token.

### 3. Tela de notificacoes

Arquivo alterado:

```text
app/(tabs)/notificacoes.tsx
```

Mudancas:

- A tela agora detecta se a sessao atual e de admin ou participante.
- Admin ve notificacoes de aceite e recusa de convocacoes.
- Ao tocar em uma notificacao do admin, a tela marca como lida e abre o evento relacionado.
- Participante continua usando o fluxo anterior de notificacoes.

### 4. Filtros de status na escala do evento

Arquivo alterado:

```text
app/events/[id].tsx
```

Mudancas:

- A escala convocada ganhou filtros rapidos:
  - todos;
  - aceitos;
  - recusas;
  - vistos sem resposta;
  - nao vistos.
- A tela mostra estado vazio quando um filtro nao possui convocados.

## Dependencia importante

Esta fase exige que a migration da Fase 2 esteja aplicada no Supabase alvo, pois depende das tabelas/RPCs:

- `admin_notifications`
- `get_admin_notifications`
- `mark_admin_notification_read`

## Validacao local

Comandos executados:

```text
npx tsc --noEmit
npm run lint
```

Ambos passaram.

## Proxima fase

Fase 6: validar o fluxo completo em dispositivo real e preparar o beta guiado, incluindo checklist de aceite ponta a ponta para admin e convidado.
