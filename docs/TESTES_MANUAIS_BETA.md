# TESTES MANUAIS BETA - ToNaEscala

## 1. Objetivo

Validar o fluxo atual do ToNaEscala antes do beta externo, com foco no novo modelo de convocacoes por `codigo do evento + email`.

## 2. Preparacao

- Aplicar todas as migrations no Supabase alvo, incluindo `20260519163000_phase2_event_assignments.sql`.
- Configurar `.env.local` com `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e, se disponivel, `EXPO_PUBLIC_SENTRY_DSN`.
- Rodar `npx tsc --noEmit`.
- Rodar `npm run lint`.
- Abrir o app em Android real. Web pode ser usada como triagem, mas nao substitui o teste em device.
- Ter dois usuarios organizadores reais para validar isolamento por RLS.
- Separar pelo menos dois emails de convidados para testar aceite e recusa.
- Separar um email convidado em dois eventos diferentes para validar alternancia de eventos.

## 3. Fluxo principal do admin

1. Criar conta por email/senha.
2. Criar organizacao.
3. Criar evento com titulo, categoria, local, data, horario e cor.
4. Confirmar que o evento aparece na aba `Eventos`.
5. Abrir detalhe do evento.
6. Criar equipe.
7. Adicionar convocado com nome e email obrigatorios.
8. Informar equipe, funcao, horario de chegada, horario final e observacoes.
9. Confirmar que a aba `Escala` mostra o convocado.
10. Confirmar status inicial: pendente e ainda nao visualizado.
11. Abrir convite e conferir codigo/QR/link.

Resultado esperado:

- Admin cria organizacao, evento, equipe e convocacao sem erro.
- Convocacao aparece com email visivel para o admin.
- Status mostra pendencia antes da resposta do convidado.

## 4. Fluxo do convidado convocado

1. Sair da conta do admin ou abrir em outro device/navegador.
2. Escolher entrada por evento.
3. Informar o codigo do evento.
4. Informar o email previamente convocado.
5. Confirmar que o app abre `/guest-event`.
6. Ver dados do evento, equipe, funcao, horario e observacoes.
7. Ver lista de outros convocados sem email ou telefone.
8. Aceitar a convocacao.
9. Reabrir como admin e conferir status `Aceitou`.
10. Conferir notificacao do admin na aba `Notificacoes`.

Resultado esperado:

- Email convocado acessa a convocacao sem criar senha.
- Visualizacao e aceite atualizam a tela do admin.
- Notificacao de aceite aparece para o admin e pode ser marcada como lida.

## 4.1 Multiplos eventos para o mesmo email

1. Criar dois eventos ativos diferentes.
2. Convocar o mesmo email nos dois eventos.
3. Entrar pelo codigo ou QR de um dos eventos usando esse email.
4. Confirmar que a tela do convidado mostra os dois eventos.
5. Alternar para o outro evento.
6. Conferir dados, equipe, funcao, horario e observacoes do outro evento.
7. Aceitar ou recusar uma convocacao no segundo evento.
8. Reabrir como admin do segundo evento e conferir status/notificacao.

Resultado esperado:

- Codigo + email de um evento validam a sessao do convidado.
- O convidado ve todos os eventos ativos em que aquele mesmo email foi convocado.
- Ao alternar de evento, a lista de convocacoes e a equipe mudam para o evento selecionado.
- A resposta atualiza somente a convocacao do evento selecionado.
- Email nao convocado no evento usado como entrada continua bloqueado.

## 5. Fluxo de recusa

1. Criar outro convocado com email diferente.
2. Entrar como convidado usando codigo + email.
3. Tocar em `Nao poderei`.
4. Tentar enviar sem motivo.
5. Informar justificativa.
6. Enviar recusa.
7. Reabrir como admin.
8. Conferir status `Recusou`.
9. Conferir motivo na lista de convocados.
10. Conferir notificacao de recusa na aba `Notificacoes`.

Resultado esperado:

- Recusa sem justificativa e bloqueada.
- Recusa com justificativa salva.
- Admin ve a justificativa tanto no evento quanto na notificacao.

## 6. Acesso bloqueado

1. Entrar com codigo valido e email nao convocado.
2. Entrar com codigo invalido.
3. Entrar com email convocado usando letras maiusculas/minusculas diferentes.

Resultado esperado:

- Email nao convocado nao acessa detalhes do evento.
- Codigo invalido mostra erro compreensivel.
- Email convocado funciona mesmo com variacao de caixa.

## 7. Status e filtros do admin

1. Criar pelo menos quatro convocacoes.
2. Deixar uma sem visualizacao.
3. Abrir uma sem responder.
4. Aceitar uma.
5. Recusar uma com motivo.
6. No evento, testar filtros:
   - todos;
   - aceitos;
   - recusas;
   - vistos;
   - nao vistos.

Resultado esperado:

- Contadores batem com os dados.
- Cada filtro mostra apenas convocados do status correspondente.
- Filtro vazio mostra estado vazio sem quebrar layout.

## 8. Isolamento e seguranca

1. Criar organizador A e evento A.
2. Criar organizador B e evento B.
3. Confirmar que A nao ve eventos/convocacoes/notificacoes de B.
4. Confirmar que B nao ve eventos/convocacoes/notificacoes de A.
5. Como convidado, tentar acessar evento apenas com codigo sem email valido.

Resultado esperado:

- Dados ficam isolados por organizacao.
- Admin le apenas as proprias notificacoes.
- Convidado acessa apenas via `codigo + email` convocado.

## 9. Notificacoes e push

1. Gerar aceite e recusa como convidado.
2. Abrir aba `Notificacoes` como admin.
3. Tocar em cada notificacao.
4. Conferir badge de nao lidas.
5. Em build compativel, validar permissao e recebimento de push.

Resultado esperado:

- Notificacoes in-app do admin aparecem.
- Toque marca como lida e abre o evento relacionado.
- Push real pode ficar como pendencia se o ambiente/device nao suportar.

## 10. Offline parcial

1. Carregar agenda do participante legado online, se houver sessao local.
2. Desligar conexao.
3. Reabrir agenda.

Resultado esperado:

- App exibe dados salvos quando disponivel.
- App nao quebra quando a rede falha.

## 11. Checklist de liberacao

- TypeScript sem erros.
- Lint sem erros.
- Fluxo admin completo validado.
- Fluxo convidado por `codigo + email` validado.
- Alternancia de eventos por mesmo email validada.
- Aceite cria status e notificacao para admin.
- Recusa exige justificativa, cria status e notificacao para admin.
- Filtros de status validados.
- Acesso com email nao convocado bloqueado.
- RLS validada com dois organizadores.
- Android real validado.
- Web validado como apoio.
- Nenhum crash bloqueante no fluxo principal.

## 12. Decisao para beta externo

Liberar beta externo apenas quando todos os itens obrigatorios da checklist estiverem aprovados.

Pendencias aceitaveis para beta controlado:

- Push real ainda em validacao, desde que notificacao in-app funcione.
- Ajustes finos de texto ou layout que nao bloqueiem o fluxo principal.

Pendencias bloqueantes:

- Admin nao conseguir criar convocacao.
- Convidado convocado nao conseguir responder.
- Recusa sem justificativa ser aceita.
- Email nao convocado conseguir acessar detalhes.
- Admin ver dados de outra organizacao.
