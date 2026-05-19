# Fase 3 - Admin cria convocacoes

## Status

Concluida no repositorio.

## Objetivo

Alterar o fluxo do admin para criar convocacoes com email obrigatorio, em vez de criar apenas participantes soltos na escala antiga.

## Entregas

### 1. Camada de dados

Arquivo criado:

```text
lib/assignments.ts
```

Funcoes:

- `createEventAssignment`
- `getEventAssignmentsForOrganizer`

Essas funcoes usam as RPCs criadas na Fase 2:

- `create_event_assignment`
- `get_event_assignments_for_organizer`

### 2. Tela de adicionar convocado

Arquivo alterado:

```text
app/events/[id]/add-schedule.tsx
```

Mudancas:

- Titulo passou para `Adicionar convocado`.
- Nome continua obrigatorio.
- Email passou a ser obrigatorio.
- Telefone ficou opcional.
- Equipe, funcao, horario e observacoes continuam disponiveis.
- Ao salvar, grava em `event_assignments`.

### 3. Tela de detalhe do evento

Arquivo alterado:

```text
app/events/[id].tsx
```

Mudancas:

- Carrega convocacoes do evento.
- Se houver convocacoes, a aba `Escala` mostra a nova escala convocada.
- Mostra status:
  - aceitou;
  - recusou;
  - visualizou e ainda nao respondeu;
  - ainda nao visualizou.
- Mostra motivo de recusa quando existir.
- Mostra email do convocado para o admin.

### 4. Compatibilidade temporaria

Enquanto a migration da Fase 2 nao for aplicada no Supabase alvo, a listagem de convocacoes cai para lista vazia quando a RPC ainda nao existe.

Porem, criar convocacao exige que a migration da Fase 2 esteja aplicada, pois a tela chama `create_event_assignment`.

## Validacao local

Comandos executados:

```text
npx tsc --noEmit
npm run lint
```

Ambos passaram.

## Criterios de aceite

- Admin consegue abrir a tela de adicionar convocado.
- Email e nome sao obrigatorios.
- Convocacao salva em `event_assignments` quando a migration da Fase 2 esta aplicada.
- Evento mostra lista de convocados e seus status.

## Proxima fase

Fase 4: alterar a entrada do convidado para usar `codigo do evento + email` e carregar a convocacao correspondente.
