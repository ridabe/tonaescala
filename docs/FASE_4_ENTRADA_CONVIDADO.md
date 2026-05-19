# Fase 4 - Entrada do convidado por codigo + email

## Status

Concluida no repositorio.

## Objetivo

Alterar o fluxo do convidado para acessar uma convocacao usando `codigo do evento + email`, em vez de entrar livremente com nome e telefone.

## Entregas

### 1. Sessao local de convocacao

Arquivo criado:

```text
hooks/useGuestAssignmentSession.ts
```

Guarda localmente:

- `assignment_invite_code`
- `assignment_email`

Essa sessao identifica a convocacao do convidado sem criar login completo.

### 2. Entrada por email

Arquivo alterado:

```text
app/enter-event.tsx
```

Mudancas:

- Removeu entrada livre por nome/telefone.
- Passou a pedir email convocado.
- Valida a convocacao chamando `get_assignments_by_invite_email`.
- Se o email nao estiver convocado, bloqueia acesso.
- Se encontrar convocacao, salva `codigo + email` localmente e abre a tela do convidado.

### 3. Tela do convidado

Arquivo alterado:

```text
app/guest-event.tsx
```

Mudancas:

- Carrega convocacoes por `codigo + email`.
- Mostra dados do evento.
- Mostra equipe, funcao, horario e observacoes do convidado.
- Marca visualizacao via RPC da Fase 2.
- Permite aceitar convocacao.
- Permite recusar convocacao.
- Recusa exige justificativa obrigatoria.
- Mostra lista de outros convocados sem expor email/telefone.

### 4. Camada de dados

Arquivo alterado:

```text
lib/assignments.ts
```

Novas funcoes:

- `getAssignmentsByInviteEmail`
- `getAssignmentRosterByInviteEmail`
- `respondEventAssignment`

### 5. Roteamento inicial

Arquivo alterado:

```text
app/index.tsx
```

Agora o app reconhece uma sessao local de convocacao e redireciona para `/guest-event`.

## Validacao local

Comandos executados:

```text
npx tsc --noEmit
npm run lint
```

Ambos passaram.

## Dependencia importante

Este fluxo exige que a migration da Fase 2 esteja aplicada no Supabase alvo, pois usa as RPCs:

- `get_assignments_by_invite_email`
- `get_assignment_roster_by_invite_email`
- `respond_event_assignment`

## Proxima fase

Fase 5: melhorar a resposta/gestao de convocacoes no admin, incluindo notificacoes visiveis para aceite/recusa e refinamento da tela de status.
