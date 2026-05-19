# ROADMAP EXECUTIVO - ToNaEscala

## 1. Objetivo

Organizar a evolucao do ToNaEscala em fases claras, com entregas verificaveis e foco no menor produto util para igrejas, ministerios e organizadores de eventos.

## 2. Status atual

O projeto saiu do MVP tecnico inicial e entrou em uma revisao de escopo para o fluxo de convocacoes por `codigo do evento + email`.

O MVP tecnico atual valida a base do app, mas o fluxo principal sera ajustado para que a escala seja criada pelo admin antes do convidado responder.

| Fase | Status | Leitura atual |
|---|---|---|
| Fase 0 - Fundacao | Concluida | Base Expo, Supabase, navegacao, tema, assets e EAS preparados. |
| Fase 1 - MVP organizador | Concluida para MVP tecnico | Login, organizacao, eventos, equipes, escalas e convite por QR/codigo implementados. |
| Fase 2 - MVP participante | Concluida para MVP tecnico | Entrada sem cadastro, agenda, detalhe de evento/escala e confirmacoes implementadas. |
| Fase 3 - Conflitos e notificacoes | Concluida para MVP tecnico | Conflitos, notificacoes in-app e registro de push token implementados; push real precisa ser validado em dispositivo. |
| Fase 4 - Polimento e beta | Concluida para beta tecnico | Estados vazios, skeletons, tratamento de erro, offline parcial, Sentry, analytics e verificacoes base adicionados. |
| Nova Fase 1 - Fluxo de convocacoes | Concluida | Replanejamento do produto para convocacoes identificadas por email, aceite/recusa e status para admin. |
| Nova Fase 2 - Banco de convocacoes | Concluida | Criada e aplicada migration para `event_assignments`, acesso por codigo + email e respostas com justificativa. |
| Nova Fase 3 - Admin cria convocacoes | Concluida no repositorio | Tela do admin cria convocacoes com email obrigatorio e o evento lista status dos convocados. |
| Nova Fase 4 - Entrada do convidado | Concluida no repositorio | Entrada exige codigo + email, carrega convocacoes e permite aceite/recusa com justificativa. |
| Nova Fase 5 - Status e notificacoes do admin | Concluida no repositorio | Admin ve notificacoes de aceite/recusa e filtra convocacoes por status no evento. |
| Nova Fase 6 - Validacao beta guiada | Concluida no repositorio | Roteiro beta atualizado para fluxo admin/convidado, notificacoes, filtros e seguranca. |
| Nova Fase 7 - Execucao beta em device real | Em execucao | Preflight local aprovado; roteiro em Android real documentado em `docs/FASE_7_EXECUCAO_BETA_DEVICE_REAL.md`. |

## 3. Norte do produto

O ToNaEscala vence pela simplicidade:

- Organizador monta eventos e escalas pelo celular.
- Convidado entra sem cadastro completo, mas precisa do email previamente convocado.
- Agenda visual mostra compromissos com clareza.
- Conflitos aparecem automaticamente.
- Convites por QR Code/link reduzem friccao, mas o acesso real usa `codigo + email`.
- Admin acompanha quem viu, aceitou ou recusou cada convocacao.

## 3.1 Mudanca de escopo aprovada

O fluxo antigo permitia que qualquer pessoa com o codigo informasse nome e telefone para entrar no evento. Isso gerava ambiguidade: o admin nao sabia se aquela pessoa era a mesma que deveria atuar em uma equipe/funcao.

Novo fluxo:

1. Admin cria evento.
2. Admin cria equipes.
3. Admin cria convocacoes com nome, email, equipe, funcao, horario e observacoes.
4. Convidado acessa com codigo do evento + email.
5. Sistema encontra a convocacao do email naquele evento.
6. Convidado visualiza a convocacao.
7. Convidado aceita ou recusa.
8. Recusa exige justificativa.
9. Admin recebe notificacao de aceite ou recusa.

Documento base: `docs/FLUXO_CONVOCACOES.md`.

## 4. Fase 0 - Fundacao

Status: concluida.

Entregas realizadas:

- Setup React Native + Expo + TypeScript.
- Supabase configurado via variaveis de ambiente.
- Estrutura de pastas do app criada.
- Identidade visual definida em `docs/IDENTIDADE_VISUAL.md`.
- Assets de marca salvos em `img/` e assets do app em `assets/images/`.
- Tema base em `constants/Colors.ts` e `constants/Theme.ts`.
- Navegacao com Expo Router.
- Configuracao de envs em `.env.example`.
- Pipeline EAS inicial em `eas.json`.

Criterios de aceite:

- App Expo estruturado e compilando TypeScript.
- Supabase conectado pelo cliente mobile.
- Splash e app icon configurados.
- Base visual aplicada nas telas principais.

## 5. Fase 1 - MVP organizador

Status: concluida para MVP tecnico.

Entregas realizadas:

- Login por email/senha.
- Login Google iniciado via Supabase OAuth.
- Criacao de organizacao.
- Listagem, criacao, edicao e arquivamento de eventos.
- Criacao e remocao de equipes.
- Criacao e remocao de escalas.
- Criacao de participante pelo organizador.
- Geracao de `invite_code`.
- Tela de compartilhamento com QR Code.
- Painel do evento com resumo, escala, equipes, conflitos, presencas e info.

Criterios de aceite:

- Organizador consegue criar organizacao, evento e escala no app.
- Evento gera codigo unico.
- Dados ficam isolados por organizacao via RLS.
- Fluxo precisa ser validado com dois usuarios reais no Supabase antes do beta externo.

## 6. Fase 2 - MVP participante

Status: concluida para MVP tecnico.

Entregas realizadas:

- Entrada por codigo.
- Entrada por QR Code.
- Criacao/recuperacao de participante local via SecureStore.
- Agenda do participante.
- Detalhe de evento convidado.
- Detalhe de escala.
- Confirmacao, recusa e atraso de escala.
- Confirmacao ou recusa de presenca no evento.
- Token local protegendo acoes do participante por RPC.

Criterios de aceite:

- Participante entra sem criar senha.
- Participante ve apenas eventos/escalas vinculados ao seu token.
- Confirmacao atualiza dados visiveis ao organizador.
- Agenda usa RPC tokenizada.

## 7. Fase 3 - Conflitos e notificacoes

Status: concluida para MVP tecnico, com validacao real pendente.

Entregas realizadas:

- Deteccao de sobreposicao de horarios.
- Tabela de conflitos.
- Aba de conflitos no detalhe do evento.
- Alerta de conflito para organizador.
- Alerta de conflito na agenda do participante.
- Tabela de notificacoes.
- Tela de notificacoes.
- Registro de Expo Push Token.
- Criacao de notificacao ao adicionar escala.

Criterios de aceite:

- Sistema identifica conflito entre duas escalas do mesmo participante.
- Organizador consegue enxergar pendencias e conflitos.
- Notificacoes in-app aparecem para participante.
- Push real ainda precisa ser testado em device/build compativel com Expo Notifications.

## 8. Fase 4 - Polimento e beta

Status: concluida para beta tecnico.

Entregas realizadas:

- Estados vazios em telas principais.
- Loading/skeleton.
- Tratamento de erro reutilizavel.
- Error boundary global.
- Offline parcial para leitura de agenda.
- Analytics basico em `lib/analytics.ts`.
- Sentry em `lib/errorReporting.ts`.
- Ajustes de acessibilidade em botoes, tabs e acoes principais.
- ESLint configurado.
- Verificacao TypeScript sem erros.
- Roteiro de testes manuais em `docs/TESTES_MANUAIS_BETA.md`.

Criterios de aceite:

- `npx tsc --noEmit` passa sem erros.
- `npm run lint` passa sem erros.
- Fluxo principal esta pronto para teste manual guiado.
- Crash-free target e tempo de splash dependem de telemetria real durante beta.

## 9. Pos-MVP

### V2

- Chat interno.
- Upload de arquivos.
- Repertorio musical.
- Comentarios em eventos.

### V3

- IA para sugestao de escala.
- Sugestao automatica de substitutos.
- Check-in por QR Code.

### V4

- Integracao Google Calendar.
- Dashboard analitico mobile.
- Multi-lideres e permissoes avancadas.
- Planos pagos.

## 10. Riscos principais

| Risco | Impacto | Mitigacao |
|---|---|---|
| Entrada sem cadastro expoe dados | Alto | Usar RPC tokenizada e RLS rigorosa. |
| QR Code compartilhado fora do publico esperado | Medio | Permitir rotacionar/desativar convite. |
| Push notification instavel no inicio | Medio | Manter notificacoes internas alem de push. |
| Multi-organizacao confunde UX | Medio | Sempre mostrar organizacao atual no topo de eventos. |
| Validacao insuficiente em device real | Alto | Executar roteiro de testes manuais antes do beta externo. |

## 11. Metricas de sucesso

MVP:

- Eventos criados.
- Escalas criadas.
- Participantes por evento.
- Taxa de confirmacao.
- Tempo para criar primeira escala.

Beta:

- Retencao semanal.
- Notificacoes entregues.
- Conflitos detectados.
- Erros por fluxo.
- Organizacoes ativas.

## 12. Proximos passos imediatos

1. Executar checklist beta em Android real usando `docs/FASE_7_EXECUCAO_BETA_DEVICE_REAL.md`.
2. Validar RLS com dois organizadores reais.
3. Validar aceite, recusa e notificacoes do admin com dados reais de teste.
4. Corrigir bloqueios encontrados antes do beta externo.
5. Gerar build de distribuicao interna quando o checklist estiver aprovado.
