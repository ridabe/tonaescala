# TESTES MANUAIS BETA - ToNaEscala

## 1. Objetivo

Validar o MVP tecnico antes de liberar o app para beta externo.

## 2. Preparacao

- Aplicar migrations Supabase no ambiente alvo.
- Configurar `.env.local` com `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e, se disponivel, `EXPO_PUBLIC_SENTRY_DSN`.
- Rodar `npx tsc --noEmit`.
- Rodar `npm run lint`.
- Abrir o app em Android real ou emulador.

## 3. Fluxo do organizador

1. Criar conta por email/senha.
2. Criar organizacao.
3. Criar evento com titulo, categoria, local, data, horario e cor.
4. Confirmar que o evento aparece na aba `Eventos`.
5. Abrir detalhe do evento.
6. Criar equipe.
7. Adicionar participante a escala.
8. Gerar/abrir convite.
9. Confirmar que QR Code e codigo aparecem.
10. Editar evento.
11. Arquivar evento.

Resultado esperado:

- Organizador consegue criar e gerenciar evento, equipe e escala sem erro.
- Evento fica isolado na organizacao do usuario.

## 4. Fluxo do participante

1. Sair do usuario organizador.
2. Entrar pelo codigo do evento.
3. Informar nome e telefone opcional.
4. Visualizar detalhe do evento.
5. Confirmar presenca no evento.
6. Abrir agenda.
7. Abrir detalhe da escala.
8. Confirmar escala.
9. Alterar resposta para atraso.
10. Alterar resposta para recusa.

Resultado esperado:

- Participante entra sem senha.
- Token local permanece salvo.
- Confirmacoes aparecem para o organizador.

## 5. Conflitos

1. Criar dois eventos com horarios sobrepostos.
2. Adicionar o mesmo participante nas duas escalas.
3. Abrir detalhe de um dos eventos.
4. Verificar aba `Conflitos`.
5. Abrir agenda do participante.

Resultado esperado:

- Conflito aparece para organizador.
- Participante ve alerta na agenda ou no detalhe da escala.

## 6. Notificacoes

1. Entrar como participante e permitir notificacoes.
2. Entrar como organizador.
3. Adicionar participante a uma nova escala.
4. Abrir aba `Notificacoes` como participante.
5. Tocar na notificacao para marcar como lida.
6. Em build compativel, validar push notification no aparelho.

Resultado esperado:

- Notificacao in-app e criada.
- Estado de leitura e salvo.
- Push chega quando ambiente/device permitirem.

## 7. Offline parcial

1. Carregar agenda do participante online.
2. Desligar conexao.
3. Reabrir agenda.

Resultado esperado:

- App exibe dados salvos.
- Banner de dados offline aparece.
- App nao quebra quando a rede falha.

## 8. Criterios para beta externo

- TypeScript sem erros.
- Lint sem erros.
- Fluxo organizador completo.
- Fluxo participante completo.
- RLS validada com dois organizadores.
- Push testado ou fallback de notificacao in-app aprovado.
- Nenhum crash bloqueante no fluxo principal.
