# ROADMAP EXECUTIVO - ToNaEscala

## 1. Objetivo

Organizar a evolucao do ToNaEscala em fases claras, com entregas verificaveis e foco no menor produto util para igrejas, ministerios e organizadores de eventos.

## 2. Status atual

O projeto esta em fase de beta tecnico do MVP.

| Fase | Status | Leitura atual |
|---|---|---|
| Fase 0 - Fundacao | Concluida | Base Expo, Supabase, navegacao, tema, assets e EAS preparados. |
| Fase 1 - MVP organizador | Concluida para MVP tecnico | Login, organizacao, eventos, equipes, escalas e convite por QR/codigo implementados. |
| Fase 2 - MVP participante | Concluida para MVP tecnico | Entrada sem cadastro, agenda, detalhe de evento/escala e confirmacoes implementadas. |
| Fase 3 - Conflitos e notificacoes | Concluida para MVP tecnico | Conflitos, notificacoes in-app e registro de push token implementados; push real precisa ser validado em dispositivo. |
| Fase 4 - Polimento e beta | Concluida para beta tecnico | Estados vazios, skeletons, tratamento de erro, offline parcial, Sentry, analytics e verificacoes base adicionados. |

## 3. Norte do produto

O ToNaEscala vence pela simplicidade:

- Organizador monta eventos e escalas pelo celular.
- Participante entra sem cadastro obrigatorio.
- Agenda visual mostra compromissos com clareza.
- Conflitos aparecem automaticamente.
- Convites por QR Code/link reduzem friccao.

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

1. Aplicar migrations no Supabase alvo.
2. Rodar roteiro de testes manuais em Android real.
3. Validar RLS com organizador A, organizador B e participante sem login.
4. Validar push notification em build compativel.
5. Corrigir bugs encontrados no beta tecnico.
6. Gerar build de distribuicao interna.
