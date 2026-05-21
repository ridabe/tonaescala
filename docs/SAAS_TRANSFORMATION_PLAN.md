# Planejamento tecnico - transformacao SaaS

## Objetivo

Preparar o ToNaEscala para operar como SaaS sem alterar a experiencia visual atual. Nesta fase, o usuario continua usando o app como hoje, mas o backend passa a suportar:

- multiplos administradores por igreja/instituicao;
- organizacoes individuais e organizacoes business;
- planos internos Free, Pro e Business;
- base para limites de uso e cobranca futura;
- migracao segura dos usuarios atuais, sem perda de acesso.

## Estado atual confirmado

Hoje `organizations` e a unidade multi-tenant principal. Eventos e equipes pertencem a uma organizacao por `organization_id`.

O ponto de acoplamento atual e que a autorizacao usa `organizations.owner_id = auth.uid()` por meio da funcao `app_private.is_org_owner(org_id)`. Na pratica:

- cada usuario autenticado cria uma organizacao no primeiro acesso;
- apenas o `owner_id` consegue administrar a organizacao;
- ainda nao existe tabela de membros/admins;
- o campo `org_id` existe em `songs`, enquanto eventos/equipes usam `organization_id`.

## Modelo alvo

### Organizacao

`organizations` continua sendo o limite de isolamento dos dados.

Campos futuros recomendados:

- `account_type`: `personal` ou `business`;
- `owner_id`: dono primario/legal da conta;
- campos de marca futuramente: logo, slogan, cores, dominio publico.

### Membros

Nova tabela `organization_members`:

- `organization_id`;
- `user_id`;
- `role`: `owner`, `admin`, `editor`, `viewer`;
- `status`: `active`, `invited`, `removed`;
- `invited_by`;
- datas de convite/entrada.

Essa tabela passa a ser a fonte principal de autorizacao. O `owner_id` permanece para compatibilidade e para indicar o responsavel primario.

### Planos

Planos internos:

- `individual_free`: plano atual invisivel, limite futuro de 10 eventos/subeventos por mes;
- `individual_pro`: eventos ilimitados para usuario individual;
- `organization_business`: eventos ilimitados e multiplos administradores para igreja/instituicao.

Por enquanto, todos os usuarios atuais entram em `individual_free`, sem exposicao visual e sem bloqueio de uso ativado no app.

### Assinatura

Assinatura deve ficar ligada a organizacao, nao diretamente ao usuario. Isso simplifica o modelo porque todo evento ja pertence a uma organizacao.

Mesmo usuarios individuais terao uma organizacao pessoal com assinatura `individual_free`.

## Fases tecnicas

### Fase 1 - Fundacao SaaS invisivel

Status: iniciada.

Entregas:

- criar `organization_members`;
- fazer backfill dos donos atuais como membros `owner`;
- criar `plans`;
- criar `organization_subscriptions`;
- atribuir `individual_free` a todas as organizacoes atuais;
- criar helpers de RLS baseados em membros;
- manter UI e fluxo de cadastro atuais;
- nao ativar tela de planos;
- nao exigir cobranca.

Risco principal: quebrar RLS existente. Mitigacao: manter `app_private.is_org_owner(org_id)` como funcao de compatibilidade, mas passar sua logica para membros ativos com papel administrativo.

### Fase 2 - Convites e multiplos administradores

Entregas:

- criar RPCs para convidar administrador;
- criar RPC para aceitar convite;
- criar tela administrativa simples dentro do app;
- permitir `owner` e `admin` criarem/alterarem eventos;
- manter participantes sem conta como estao.

Regras iniciais:

- apenas `owner` pode remover outro `owner`;
- `admin` pode gerenciar eventos/equipes, mas nao billing;
- convites devem expirar;
- aceitar convite deve vincular `auth.uid()` ao membership.

### Fase 3 - Limites do Free

Entregas:

- centralizar criacao de evento em RPC;
- calcular uso mensal por organizacao;
- contar eventos e subeventos no mesmo limite;
- adicionar resposta estruturada quando limite for atingido;
- preparar tela de upgrade, ainda podendo ficar oculta por flag.

Regra planejada:

- `individual_free`: 10 eventos/subeventos por mes;
- `individual_pro`: ilimitado;
- `organization_business`: ilimitado.

Decisao pendente: se eventos arquivados/cancelados continuam contando no mes. Recomendacao: contar todos os eventos criados, inclusive cancelados, para evitar abuso.

### Fase 4 - Cobranca

Entregas:

- escolher provedor de pagamento;
- criar tabela de eventos de billing/webhooks;
- mapear customer/subscription externos;
- atualizar `organization_subscriptions` via webhook;
- criar tela/portal de assinatura;
- ativar planos visualmente.

Opcoes:

- Stripe: melhor para SaaS classico e portal pronto;
- Mercado Pago/Pagar.me: melhor aderencia Brasil/Pix/boleto/cartao local.

### Fase 5 - Area web

Nao e obrigatoria para iniciar o SaaS. Recomendacao:

- curto prazo: landing page, checkout, politicas e links de convite;
- medio prazo: painel web business para igreja;
- longo prazo: relatorios, identidade visual, administradores, biblioteca institucional.

O app continua sendo o produto principal.

## Regras de migracao

- Nenhum usuario atual deve perder acesso.
- Toda organizacao existente ganha um membership `owner`.
- Toda organizacao existente ganha assinatura `individual_free`.
- `owner_id` nao deve ser removido.
- As telas atuais continuam consultando `fetchOrganizations()` e pegando a primeira organizacao.
- Planos permanecem invisiveis ate escolha da cobranca.

## Ordem recomendada de implementacao

1. Migracao de fundacao SaaS.
2. Validacao local do SQL.
3. Ajuste de docs de RLS/API.
4. RPCs de convite.
5. Tela interna de administradores.
6. RPC de criacao de evento com verificacao de plano.
7. Ativacao gradual de limite Free.
8. Billing.

