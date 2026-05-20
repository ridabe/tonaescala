# Fase 7 - Execucao beta em Android real

## Status

Concluida.

## Objetivo

Executar o roteiro beta em Android real, registrar bugs encontrados e corrigir bloqueios antes de liberar o beta externo.

Esta fase nao substitui os testes locais. Ela valida o app no ambiente mais proximo do uso real: celular Android, Expo, rede real e dados reais de teste.

## Preflight local

Executado em 2026-05-19:

```text
npx tsc --noEmit
npm run lint
npx expo-doctor
```

Resultado:

- TypeScript sem erros.
- Lint sem erros.
- Expo Doctor: 17/17 checks passed.

## Bugs corrigidos antes do teste em device

### F7-001 - Horario salvo com 3 horas a menos

Sintoma:

- Evento criado para 07:00-12:00 aparecia como 04:00-09:00 apos salvar.

Causa:

- O app enviava timestamps sem timezone para colunas `timestamptz`.

Correcao:

- Datas de eventos e convocacoes agora sao enviadas como timestamp ISO UTC via `Date.toISOString()`.
- O app continua exibindo no horario local do celular.

Arquivos principais:

- `lib/datetime.ts`
- `app/events/create.tsx`
- `app/events/[id]/edit.tsx`
- `app/events/[id]/add-schedule.tsx`

Status: corrigido e validado por TypeScript/lint.

### F7-002 - Voltar nao atualizava dados e podia falhar sem historico

Sintoma:

- Ao voltar pela seta, a tela anterior nem sempre atualizava os dados.
- Em um teste no celular, a seta de voltar apresentou erro e nao retornou.

Causa:

- Algumas telas carregavam dados apenas ao montar.
- O header chamava `router.back()` sem fallback quando nao havia historico.

Correcao:

- Telas principais recarregam ao receber foco.
- `ScreenHeader` agora usa `router.canGoBack()` e possui rota fallback.

Arquivos principais:

- `components/ScreenHeader.tsx`
- `app/(tabs)/eventos.tsx`
- `app/events/[id].tsx`
- `app/(tabs)/agenda.tsx`

Status: corrigido e validado por TypeScript/lint.

## Roteiro de execucao em Android real

Documento base:

```text
docs/TESTES_MANUAIS_BETA.md
```

### Preparacao

- Usar Android real com Expo Go ou dev client compativel.
- Confirmar `.env.local` apontando para o Supabase alvo.
- Confirmar que todas as migrations foram aplicadas no Supabase alvo.
- Separar dois usuarios organizadores reais.
- Separar pelo menos dois emails de convidados.

### Checklist obrigatorio

| Area | Status | Evidencia esperada |
|---|---|---|
| App abre no Android real | Pendente device | Tela inicial carrega sem crash. |
| Admin cria conta e organizacao | Pendente device | Organizacao criada e visivel. |
| Admin cria evento | Pendente device | Evento aparece na aba Eventos com horario correto. |
| Admin cria equipe | Pendente device | Equipe aparece no detalhe do evento. |
| Admin adiciona convocado | Pendente device | Convocado aparece como pendente. |
| Convite gera codigo/QR | Pendente device | Codigo visivel e compartilhavel. |
| Convidado entra com codigo + email | Pendente device | Tela `/guest-event` abre com dados corretos. |
| Email nao convocado e bloqueado | Pendente device | Mensagem compreensivel, sem detalhes do evento. |
| Aceite atualiza admin | Pendente device | Status muda para `Aceitou`. |
| Recusa exige motivo | Pendente device | Envio sem motivo bloqueado. |
| Recusa com motivo atualiza admin | Pendente device | Status `Recusou` e motivo visivel. |
| Notificacoes admin | Pendente device | Notificacao aparece e pode ser marcada como lida. |
| Filtros do admin | Pendente device | Todos, aceitos, recusas, vistos e nao vistos batem com contadores. |
| Isolamento entre organizadores | Pendente device | Admin A nao ve dados do Admin B e vice-versa. |
| Voltar atualiza dados | Pendente device | Apos salvar/editar/responder, tela anterior reflete dados novos. |
| Horarios preservados | Pendente device | 07:00 salvo aparece como 07:00 apos reabrir. |
| Offline parcial | Pendente device | App nao quebra sem rede quando houver cache. |

## Criterio de aprovacao

Fase 7 so pode ser marcada como concluida quando:

- todos os itens obrigatorios do checklist estiverem aprovados em Android real;
- nenhum bloqueio da secao "Pendencias bloqueantes" de `docs/TESTES_MANUAIS_BETA.md` estiver aberto;
- bugs bloqueantes encontrados no device forem corrigidos e revalidados;
- `npx tsc --noEmit`, `npm run lint` e `npx expo-doctor` continuarem passando.

## Pendencias aceitaveis para beta controlado

- Push real ainda em validacao, desde que notificacao in-app funcione.
- Ajustes de texto ou layout sem impacto no fluxo principal.

## Registro de bugs da fase

| ID | Severidade | Status | Resumo |
|---|---|---|---|
| F7-001 | Bloqueante | Corrigido | Horarios eram salvos/exibidos com 3 horas a menos. |
| F7-002 | Bloqueante | Corrigido | Voltar nao atualizava dados e podia falhar sem historico. |

## Proximo passo operacional

Rodar o app no Android real pelo Expo e executar o checklist acima. Bugs encontrados devem ser registrados nesta pagina antes da correcao.
