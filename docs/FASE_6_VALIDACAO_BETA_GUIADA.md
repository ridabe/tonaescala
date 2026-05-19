# Fase 6 - Validacao beta guiada

## Status

Concluida no repositorio.

## Objetivo

Preparar a validacao final do novo fluxo de convocacoes antes do beta externo, cobrindo admin, convidado, notificacoes, filtros de status e seguranca.

## Entregas

### 1. Roteiro beta atualizado

Arquivo alterado:

```text
docs/TESTES_MANUAIS_BETA.md
```

Mudancas:

- Removeu o fluxo antigo de participante por nome/telefone.
- Adicionou validacao do fluxo por `codigo do evento + email`.
- Adicionou aceite, recusa com justificativa e notificacoes do admin.
- Adicionou checklist de filtros de status.
- Adicionou criterios de bloqueio para beta externo.

### 2. Criterios de seguranca e isolamento

O roteiro agora exige:

- dois organizadores reais;
- validacao de isolamento por organizacao;
- bloqueio de email nao convocado;
- leitura de notificacoes apenas pelo admin dono.

### 3. Criterios de liberacao

O documento separa:

- pendencias aceitaveis para beta controlado;
- pendencias bloqueantes;
- checklist minima para liberar beta externo.

## Validacao local

Comandos executados:

```text
npx tsc --noEmit
npm run lint
```

Ambos passaram.

Tambem foi feita triagem no Expo Web para confirmar que o app carrega em ambiente local.

## Proxima fase

Fase 7: executar o roteiro em Android real com dados reais de teste, registrar bugs encontrados e corrigir bloqueios antes do beta externo.
