# Fase 8 - Email em massa para convocados

## Status

Planejada.

## Objetivo

Permitir que o admin/dono do evento envie um email em massa para todos os convocados de um evento, contendo:

- saudacao personalizada;
- informacoes principais do evento;
- equipe, funcao, horarios e observacoes da convocacao;
- codigo do evento;
- QR Code ou link de acesso;
- orientacao para entrar usando o mesmo email da convocacao.

## Regra central

O disparo parte sempre de um evento existente e usa a lista de `event_assignments` daquele evento como fonte oficial dos destinatarios.

O admin nao digita uma lista separada de emails. Se alguem precisa receber o email, essa pessoa precisa estar cadastrada como convocada no evento.

## Fluxo do admin

1. Admin cria o evento.
2. Admin adiciona todos os convocados na escala.
3. Na tela de detalhes do evento, admin acessa uma acao de envio:
   - `Enviar convites por email`;
   - ou `Reenviar para pendentes`, em uma evolucao posterior.
4. Sistema mostra um resumo antes do envio:
   - total de convocados;
   - total com email valido;
   - total sem email valido, se houver;
   - quem ja recebeu email anteriormente;
   - data do ultimo envio.
5. Admin confirma o disparo.
6. Backend envia um email para cada convocado.
7. Tela exibe resultado:
   - enviados com sucesso;
   - falhas;
   - emails pulados por duplicidade ou invalidez.

## Conteudo do email

### Assunto sugerido

```text
Convocacao para {nome_do_evento}
```

### Corpo sugerido

```text
Ola, {nome}.

Voce esta na escala para:

Evento: {nome_do_evento}
Organizacao: {nome_da_organizacao}
Data: {data_hora_evento}
Local: {local}
Equipe: {equipe}
Funcao: {funcao}
Chegada: {horario_chegada}
Observacoes: {observacoes}

Para visualizar e responder sua convocacao, acesse o app ToNaEscala usando:

Codigo do evento: {invite_code}
Email convocado: {invitee_email}

Voce tambem pode acessar pelo QR Code abaixo.
```

## QR Code e link

O QR Code deve apontar para um link de entrada no evento, nao conter dados sensiveis completos.

Formato recomendado para o MVP:

```text
tonaescala://enter-event?invite_code={invite_code}
```

Formato recomendado para web/deep link publico:

```text
https://app.tonaescala.com/enter-event?invite_code={invite_code}
```

O email continua sendo exigido na tela de entrada. Isso evita que o QR Code sozinho libere os detalhes da convocacao.

## Modelo de dados

Criar uma tabela de controle de campanhas/envios, por exemplo:

```text
event_email_campaigns
```

Campos sugeridos:

- `id`
- `event_id`
- `created_by`
- `subject`
- `message_preview`
- `status`: `draft`, `sending`, `sent`, `partial_failed`, `failed`
- `recipient_count`
- `sent_count`
- `failed_count`
- `created_at`
- `started_at`
- `finished_at`

Criar uma tabela de destinatarios por campanha:

```text
event_email_recipients
```

Campos sugeridos:

- `id`
- `campaign_id`
- `event_id`
- `assignment_id`
- `invitee_email`
- `invitee_name`
- `status`: `queued`, `sent`, `failed`, `skipped`
- `provider_message_id`
- `error_message`
- `sent_at`
- `created_at`

## Backend

O envio nao deve acontecer diretamente no app mobile, porque exigiria expor credenciais do provedor de email.

Opcao recomendada:

- Supabase Edge Function `send-event-assignment-emails`;
- chamada apenas por usuario autenticado;
- validacao de dono/admin do evento dentro da function ou via RPC;
- uso de provedor transacional como Resend, SendGrid, Mailgun ou Amazon SES;
- secrets do provedor configurados no ambiente da function;
- registro de campanha e destinatarios no banco.

## RPCs sugeridas

### `create_event_email_campaign`

Responsavel por:

- validar se `auth.uid()` e dono/admin da organizacao do evento;
- buscar convocados em `event_assignments`;
- criar campanha;
- criar destinatarios com status `queued`;
- retornar `campaign_id`.

### `get_event_email_campaigns`

Responsavel por:

- listar campanhas de um evento para o admin;
- exibir status e contadores.

### `get_event_email_campaign_recipients`

Responsavel por:

- detalhar enviados, falhas e pulados.

## Edge Function sugerida

### `send-event-assignment-emails`

Entrada:

```json
{
  "event_id": "uuid",
  "campaign_id": "uuid"
}
```

Responsabilidades:

- validar usuario autenticado;
- confirmar permissao sobre o evento;
- carregar dados do evento, organizacao e convocados;
- gerar link e QR Code;
- montar HTML/texto do email;
- enviar um email por convocado;
- atualizar status de cada destinatario;
- atualizar status final da campanha.

## Tela do admin

Na tela `app/events/[id].tsx`, adicionar:

- botao de envio na area da escala convocada;
- modal de confirmacao com resumo;
- indicador de envio em andamento;
- bloco "Emails enviados" com ultima campanha;
- opcao de ver falhas.

Estados importantes:

- sem convocados: botao desabilitado;
- enviando: evitar duplo clique;
- envio parcial: mostrar total enviado e falhas;
- ultimo envio existente: avisar antes de reenviar para todos.

## Regras de seguranca

- Apenas dono/admin da organizacao pode disparar emails.
- App mobile nunca deve conter chave secreta do provedor de email.
- QR Code nao deve conter token permanente nem dados privados.
- O email do convidado segue sendo a segunda etapa de validacao.
- Logs de erro nao devem expor secrets.
- RLS habilitada nas novas tabelas.
- RPCs e Edge Function precisam validar permissao por `event_id`.

## MVP

Para a primeira entrega:

- enviar para todos os convocados do evento;
- usar assunto padrao;
- usar corpo padrao;
- incluir codigo do evento;
- incluir QR Code/link de entrada;
- registrar sucesso/falha por destinatario;
- mostrar ultimo resultado na tela do evento.

Fora do MVP:

- editor completo de template;
- agendamento de envio;
- reenviar somente para quem nao visualizou;
- tracking de abertura;
- unsubscribe, porque o envio e transacional/operacional;
- anexos;
- multiplos templates por organizacao.

## Criterios de aceite

- Admin ve a acao de envio apenas em eventos da propria organizacao.
- Admin nao consegue disparar email para evento de outra organizacao.
- Sistema usa apenas `event_assignments` como lista de destinatarios.
- Cada convocado recebe email com dados da propria convocacao.
- QR Code/link leva para a entrada do evento.
- Convidado ainda precisa informar o email convocado para acessar os detalhes.
- Campanha fica registrada com status final.
- Falha em um email nao cancela o envio dos demais.
- Tela do evento mostra contagem de enviados e falhas.

## Ordem de implementacao sugerida

1. Definir provedor de email e variaveis de ambiente.
2. Criar migrations das tabelas de campanhas e destinatarios.
3. Criar RPCs de campanha com validacao de dono/admin.
4. Criar Edge Function de envio.
5. Adicionar camada `lib/emailCampaigns.ts`.
6. Atualizar tela do evento com acao de envio e historico.
7. Testar com evento real de homologacao e emails controlados.
8. Documentar variaveis de ambiente e procedimento de deploy.
