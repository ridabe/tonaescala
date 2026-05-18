# ROADMAP EXECUTIVO - ToNaEscala

## 1. Objetivo

Organizar a evolução do ToNaEscala em fases claras, com entregas verificáveis e foco no menor produto útil para igrejas, ministérios e organizadores de eventos.

## 2. Norte do produto

O ToNaEscala vence pela simplicidade:

- Organizador monta eventos e escalas pelo celular.
- Participante entra sem cadastro obrigatório.
- Agenda visual mostra compromissos com clareza.
- Conflitos aparecem automaticamente.
- Convites por QR Code/link reduzem fricção.

## 3. Fase 0 - Fundação

Entregas:

- Setup React Native + Expo + TypeScript.
- Supabase PROD.
- Estrutura de pastas.
- Tema base verificar no arquivo nIdentidade_visual.
- Navegação com Expo Router.
- Configuração de envs.
- Pipeline EAS inicial.

Critérios de aceite:

- App abre em Android.
- Login técnico testado.
- Supabase conectado.
- Build de desenvolvimento funcional.

## 4. Fase 1 - MVP organizador

Entregas:

- Login por email/senha.
- Login Google, se viável sem atrasar MVP.
- Criação de organização.
- CRUD de eventos.
- CRUD de equipes.
- CRUD de escalas.
- Geração de `invite_code`.
- Tela de compartilhamento com QR Code.

Critérios de aceite:

- Organizador cria organização, evento e escala no app.
- Evento gera código único.
- Dados ficam isolados por organização.
- RLS validada com pelo menos dois usuários.

## 5. Fase 2 - MVP participante

Entregas:

- Entrada por código.
- Entrada por QR Code.
- Criação/recuperação de participante local.
- Agenda do participante.
- Detalhe de escala.
- Confirmação, recusa e atraso.

Critérios de aceite:

- Participante entra sem criar senha.
- Participante vê apenas eventos em que entrou.
- Confirmação atualiza painel do organizador.
- Token local protege ações do participante.

## 6. Fase 3 - Conflitos e notificações

Entregas:

- Detecção de sobreposição de horários.
- Tabela de conflitos.
- Alerta para organizador.
- Alerta para participante.
- Expo Push Notifications.
- Notificações de nova escala e alteração.

Critérios de aceite:

- Sistema identifica conflito entre duas escalas do mesmo participante.
- Push chega para participante em fluxo real.
- Organizador consegue enxergar pendências e conflitos.

## 7. Fase 4 - Polimento e beta

Entregas:

- Estados vazios.
- Loading/skeleton.
- Tratamento de erro.
- Offline parcial para leitura de agenda.
- Analytics básico.
- Sentry.
- Ajustes de acessibilidade.
- Testes manuais guiados.

Critérios de aceite:

- Fluxo principal completo em menos de 5 minutos.
- Crash-free target acima de 99% no beta.
- Splash abaixo de 2 segundos em aparelhos intermediários.
- Usuário beta consegue criar e compartilhar escala sem ajuda.

## 8. Pós-MVP

### V2

- Chat interno.
- Upload de arquivos.
- Repertório musical.
- Comentários em eventos.

### V3

- IA para sugestão de escala.
- Sugestão automática de substitutos.
- Check-in por QR Code.

### V4

- Integração Google Calendar.
- Dashboard analítico mobile.
- Multi-líderes e permissões avançadas.
- Planos pagos.

## 9. Riscos principais

| Risco | Impacto | Mitigação |
|---|---|---|
| Entrada sem cadastro expõe dados | Alto | Usar RPC tokenizada e RLS rigorosa. |
| QR Code compartilhado fora do público esperado | Médio | Permitir rotacionar/desativar convite. |
| Escalas recorrentes complicam o MVP | Médio | Começar com evento único e repetir manualmente. |
| Push notification instável no início | Médio | Registrar notificações internas além de push. |
| Multi-organização confunde UX | Médio | Sempre mostrar organização atual no topo de eventos. |

## 10. Métricas de sucesso

MVP:

- Eventos criados.
- Escalas criadas.
- Participantes por evento.
- Taxa de confirmação.
- Tempo para criar primeira escala.

Beta:

- Retenção semanal.
- Notificações entregues.
- Conflitos detectados.
- Erros por fluxo.
- Organizações ativas.

## 11. Sequência recomendada imediata

1. Transformar a `DATABASE_SPEC` em migrações Supabase.
2. Criar protótipo navegável das telas do MVP.
3. Implementar autenticação e organização.
4. Implementar eventos e convites.
5. Implementar participante sem cadastro.
6. Implementar escalas, confirmações e conflitos.

