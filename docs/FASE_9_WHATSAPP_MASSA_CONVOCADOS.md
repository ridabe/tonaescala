# Fase 9 - WhatsApp em massa para convocados

## Status

Planejada.

## Objetivo

Permitir que o admin/dono do evento envie uma mensagem em massa via WhatsApp para todos os convocados de um evento, contendo:

- saudacao personalizada;
- informacoes principais do evento;
- equipe, funcao, horarios e observacoes da convocacao;
- codigo do evento;
- link de acesso direto ao app.

## Regra central

O disparo parte sempre de um evento existente e usa a lista de `event_assignments` daquele evento como fonte oficial dos destinatarios.

O admin nao digita uma lista separada de numeros. Se alguem precisa receber a mensagem, essa pessoa precisa estar cadastrada como convocada no evento e ter um numero de telefone valido registrado na convocacao.

## Pre-requisito critico: aprovacao de template

O WhatsApp Business exige que mensagens iniciadas pelo sistema (outbound) usem um template pre-aprovado pela Meta. O template precisa ser cadastrado e aprovado no painel do provedor antes do primeiro disparo em producao. A aprovacao leva geralmente de 1 a 3 dias uteis.

Para ambiente de testes, o sandbox do provedor escolhido pode ser usado sem aprovacao de template.

## Provedor de API

Provedor recomendado para o MVP: **Twilio WhatsApp Business API**.

Justificativa:

- mesmo padrao de integracao REST usado pelo Resend no email;
- sandbox disponivel para testes sem aprovacao de template;
- boa documentacao para Deno/Edge Functions;
- amplamente adotado em aplicacoes SaaS.

Alternativas avaliadas:

- Meta Cloud API: oficial e com 1000 conversas/mes gratuitas, porem com setup mais complexo via Meta Business verification;
- Z-API: popular no Brasil e sem necessidade de aprovacao de template, porem nao e oficial e viola os termos de servico do WhatsApp em uso de escala.

Variaveis de ambiente necessarias:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (numero registrado como sender no Twilio, formato `whatsapp:+55...`)

## Pre-requisito de dados: numero de telefone do convocado

O campo `invitee_phone` nao existe ainda em `event_assignments`. E necessario:

1. Adicionar a coluna `invitee_phone text` em `event_assignments` via migration.
2. Adicionar a coluna normalizada `invitee_phone_norm text` para filtragem, igual ao padrao do `invitee_email_norm`.
3. Atualizar o formulario de convocacao para coletar o numero de telefone.
4. Normalizar o numero ao salvar: remover espacos, hifens e parenteses; adicionar `+55` se nao houver DDI.

Convocados sem telefone valido serao marcados como `skipped` na campanha, com o motivo registrado.

## Fluxo do admin

1. Admin cria o evento.
2. Admin adiciona os convocados na escala, informando nome, email e telefone de cada um.
3. Na tela de detalhes do evento, admin acessa a acao de envio:
   - `Enviar via WhatsApp`;
   - ou `Reenviar para pendentes`, em evolucao posterior.
4. Sistema mostra um resumo antes do envio:
   - total de convocados;
   - total com numero valido;
   - total sem numero valido, se houver;
   - data do ultimo envio, se existir.
5. Admin confirma o disparo.
6. Backend envia uma mensagem para cada convocado com numero valido.
7. Tela exibe resultado:
   - enviados com sucesso;
   - falhas;
   - pulados por numero ausente ou invalido.

## Conteudo da mensagem

### Formato sugerido

```text
Ola, *{nome}*!

Voce esta na escala do evento *{titulo_do_evento}* organizado por {nome_da_organizacao}.

Data: {data}
Local: {local}
Equipe: {equipe}
Funcao: {funcao}
Horario: {chegada} - {termino}
Observacoes: {observacoes}

Para confirmar sua presenca, acesse o app:
{link_de_entrada}

Codigo do evento: *{invite_code}*
```

O link de entrada segue o mesmo padrao da fase 8:

```text
https://app.tonaescala.com/enter-event?invite_code={invite_code}
```

O telefone do convocado nao e a segunda etapa de validacao. O app continua exigindo o email convocado para liberar os detalhes. O WhatsApp e apenas o canal de entrega da mensagem.

## Modelo de dados

### Nova coluna em `event_assignments`

```text
invitee_phone      text
invitee_phone_norm text
```

### Nova tabela de campanhas

```text
event_whatsapp_campaigns
```

Campos:

- `id`
- `event_id`
- `created_by`
- `status`: `draft`, `sending`, `sent`, `partial_failed`, `failed`
- `recipient_count`
- `sent_count`
- `failed_count`
- `created_at`
- `started_at`
- `finished_at`

### Nova tabela de destinatarios

```text
event_whatsapp_recipients
```

Campos:

- `id`
- `campaign_id`
- `event_id`
- `assignment_id`
- `invitee_phone`
- `invitee_name`
- `status`: `queued`, `sent`, `failed`, `skipped`
- `provider_message_id`
- `error_message`
- `sent_at`
- `created_at`

Ambas as tabelas com RLS habilitada. Apenas o criador da campanha acessa os dados.

## Backend

O envio nao ocorre diretamente no app mobile para nao expor credenciais do provedor.

Estrutura recomendada:

- Supabase Edge Function `send-event-assignment-whatsapp`;
- chamada apenas por usuario autenticado;
- validacao de dono/admin do evento dentro da function;
- uso do Twilio WhatsApp Business API;
- secrets do provedor configurados no ambiente da function;
- registro de campanha e destinatarios no banco.

## RPCs sugeridas

### `create_event_whatsapp_campaign`

Responsavel por:

- validar se `auth.uid()` e dono/admin da organizacao do evento;
- buscar convocados em `event_assignments` com `invitee_phone_norm` preenchido;
- criar campanha com status `draft`;
- criar destinatarios com status `queued`;
- retornar `campaign_id`.

Lanca excecao `NO_RECIPIENTS` se nenhum convocado tiver telefone valido.

### `get_event_whatsapp_campaigns`

Responsavel por:

- listar campanhas de um evento para o admin;
- exibir status e contadores;
- ordenar por data de criacao decrescente.

### `get_event_whatsapp_campaign_recipients`

Responsavel por:

- detalhar enviados, falhas e pulados por campanha.

## Edge Function sugerida

### `send-event-assignment-whatsapp`

Entrada:

```json
{
  "event_id": "uuid",
  "campaign_id": "uuid"
}
```

Responsabilidades:

- validar usuario autenticado via header `Authorization`;
- confirmar que o usuario e o criador da campanha e dono do evento;
- rejeitar campanha ja enviada ou em andamento (status `sending` ou `sent`);
- carregar dados do evento, organizacao e convocados;
- marcar campanha como `sending`;
- para cada destinatario com status `queued`:
  - montar o texto da mensagem com dados da convocacao;
  - chamar a API do Twilio para enviar via WhatsApp;
  - registrar `provider_message_id` em caso de sucesso;
  - registrar `error_message` em caso de falha;
  - atualizar status do destinatario;
- calcular status final da campanha: `sent`, `partial_failed` ou `failed`;
- atualizar contadores e `finished_at` na campanha.

## Lib cliente

```text
lib/whatsappCampaigns.ts
```

Espelho de `lib/emailCampaigns.ts`, com os tipos e funcoes:

- `WhatsAppCampaign`
- `WhatsAppCampaignRecipient`
- `createWhatsAppCampaign(eventId)`
- `triggerWhatsAppCampaign(eventId, campaignId)`
- `getWhatsAppCampaigns(eventId)`
- `getWhatsAppCampaignRecipients(campaignId)`

## Tela do admin

Em `app/events/[id].tsx`, adicionar:

- botao `Enviar via WhatsApp` na area da escala convocada, ao lado ou abaixo do botao de email;
- modal de confirmacao com resumo de destinatarios e aviso sobre convocados sem telefone;
- indicador de envio em andamento para evitar duplo clique;
- bloco com ultima campanha WhatsApp: status, contadores e data;
- opcao de ver destinatarios com falha.

Estados importantes:

- sem convocados com telefone: botao desabilitado com aviso;
- enviando: spinner e botao travado;
- envio parcial: exibir total enviado e falhas;
- ultimo envio existente: avisar antes de reenviar para todos.

## Regras de seguranca

- Apenas dono/admin da organizacao pode disparar mensagens.
- App mobile nunca deve conter chave secreta do provedor WhatsApp.
- O email do convidado continua sendo a segunda etapa de validacao no app, independente do canal de entrega.
- Logs de erro nao devem expor credentials do Twilio.
- RLS habilitada nas novas tabelas.
- RPCs e Edge Function validam permissao por `event_id` e `campaign_id`.
- Numero de telefone normalizado antes de armazenar; formato internacional `+55DDDNUMERO`.

## MVP

Para a primeira entrega:

- campo de telefone no formulario de convocacao;
- enviar mensagem para todos os convocados do evento com telefone valido;
- usar corpo de mensagem padrao com dados da convocacao;
- incluir link de entrada no evento;
- registrar sucesso/falha por destinatario;
- mostrar ultimo resultado na tela do evento.

Fora do MVP:

- editor de template da mensagem;
- agendamento de envio;
- reenviar somente para quem nao visualizou;
- tracking de leitura (read receipts);
- resposta automatica de confirmacao via WhatsApp;
- multiplos numeros remetentes por organizacao.

## Criterios de aceite

- Admin ve a acao de envio apenas em eventos da propria organizacao.
- Admin nao consegue disparar mensagem para evento de outra organizacao.
- Sistema usa apenas `event_assignments` como lista de destinatarios.
- Cada convocado recebe mensagem com dados da propria convocacao.
- Link na mensagem leva para a entrada do evento.
- Convidado ainda precisa informar o email convocado no app para acessar os detalhes.
- Campanha fica registrada com status final.
- Falha em uma mensagem nao cancela o envio das demais.
- Convocados sem telefone valido sao marcados como `skipped`, nao como falha.
- Tela do evento mostra contagem de enviados, falhas e pulados.

## Ordem de implementacao sugerida

1. Cadastrar conta Twilio e submeter template WhatsApp para aprovacao pela Meta.
2. Criar migration adicionando `invitee_phone` e `invitee_phone_norm` em `event_assignments`.
3. Criar migration com tabelas `event_whatsapp_campaigns` e `event_whatsapp_recipients`, RLS e indexes.
4. Criar RPCs de campanha WhatsApp com validacao de dono/admin.
5. Criar Edge Function `send-event-assignment-whatsapp`.
6. Adicionar camada `lib/whatsappCampaigns.ts`.
7. Atualizar formulario de convocacao para aceitar telefone.
8. Atualizar tela do evento com acao de envio WhatsApp e historico.
9. Testar com sandbox Twilio e convocados de homologacao.
10. Configurar template aprovado em producao e validar disparo real.
11. Documentar variaveis de ambiente e procedimento de deploy.
