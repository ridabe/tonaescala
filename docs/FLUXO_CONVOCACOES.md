# Fluxo de Convocacoes - ToNaEscala

## 1. Objetivo

Definir a nova regra de produto para escalas por convocacao. O ToNaEscala deixa de tratar o codigo do evento como uma entrada aberta e passa a usar o par `codigo do evento + email` para identificar quem foi convocado.

## 2. Principio central

O admin monta a escala antes do convidado responder.

Cada pessoa convidada deve existir como uma convocacao vinculada a:

- evento;
- equipe;
- nome;
- email;
- funcao;
- horario;
- observacao, quando houver;
- status de visualizacao;
- status de resposta.

O codigo do evento localiza o primeiro evento de acesso. O email localiza a convocacao daquela pessoa dentro do evento e passa a ser a ancora da sessao do convidado.

## 3. Regras de produto

- O admin cria o evento.
- O admin cria as equipes do evento.
- O admin adiciona os convocados da escala com nome, email, equipe, funcao, horario e observacoes.
- O convidado acessa pelo codigo do evento e informa o email.
- Se o email existir na escala daquele evento, o convidado acessa sua convocacao.
- Depois de validado o par `codigo + email`, o convidado pode ver outros eventos ativos em que o mesmo email foi convocado.
- Ao alternar entre eventos, o convidado so ve convocacoes vinculadas ao proprio email.
- Se o email nao existir, o app bloqueia o acesso aos detalhes da escala.
- Ao abrir a convocacao, o sistema marca como visualizada.
- O convidado pode aceitar ou recusar.
- Se recusar, deve informar justificativa obrigatoria.
- O admin deve ver o status de cada convocado dentro do evento.
- O admin deve receber notificacao quando houver aceite ou recusa.
- O convidado pode ver outros convocados do evento ou da equipe, mas nao pode responder por eles.

## 4. Status da convocacao

Status de visualizacao:

- `not_viewed`: convidado ainda nao abriu a convocacao.
- `viewed`: convidado abriu a convocacao.

Status de resposta:

- `pending`: aguardando resposta.
- `accepted`: convidado aceitou atuar.
- `declined`: convidado recusou atuar.

Campos de auditoria:

- `viewed_at`: data/hora em que o convidado abriu a convocacao.
- `responded_at`: data/hora da resposta.
- `decline_reason`: justificativa obrigatoria quando a resposta for `declined`.

## 5. Fluxo do admin

1. Faz login.
2. Cria ou seleciona uma organizacao.
3. Cria um evento.
4. Cria as equipes necessarias.
5. Adiciona convocados na escala:
   - nome;
   - email;
   - telefone opcional;
   - equipe;
   - funcao;
   - horario de chegada;
   - horario final, se necessario;
   - observacoes.
6. Compartilha o codigo ou link do evento.
7. Acompanha a escala por status.
8. Recebe notificacoes de aceite e recusa.

## 6. Fluxo do convidado

1. Recebe codigo ou link do evento.
2. Abre o app.
3. Informa codigo do evento.
4. Informa email.
5. App procura uma convocacao ativa para aquele evento e email.
6. Se encontrar, mostra:
   - dados do evento;
   - equipe;
   - funcao;
   - horario;
   - observacoes;
   - outros convocados.
7. Se o mesmo email tambem estiver convocado em outros eventos ativos, o app mostra um seletor para alternar entre eles.
8. Sistema marca como visualizada a convocacao do evento aberto.
9. Convidado escolhe:
   - `Aceito participar`;
   - `Nao poderei`.
10. Se escolher `Nao poderei`, informa o motivo.
11. Admin do evento respondido recebe a resposta.

## 7. Visao do admin no evento

A tela do evento deve permitir enxergar rapidamente:

- total de convocados;
- quantos aceitaram;
- quantos recusaram;
- quantos visualizaram e ainda nao responderam;
- quantos ainda nao visualizaram;
- motivo das recusas;
- agrupamento por equipe;
- filtros por status.

Exemplo:

```text
Culto Domingo 19h

Vocal
Ana Silva
Soprano
Status: Aceitou

Joao Lima
Violao
Status: Recusou
Motivo: Estarei trabalhando nesse horario.

Recepcao
Carla Mendes
Entrada principal
Status: Visualizou, aguardando resposta
```

## 8. Visao do convidado

O convidado deve saber exatamente para o que foi chamado.

Informacoes principais:

- nome do evento;
- data e local;
- equipe;
- funcao;
- horario de chegada;
- horario de termino, se houver;
- observacoes do admin;
- lista dos demais convocados visiveis.

Dados de outros convocados:

- mostrar nome, equipe, funcao e status geral;
- nao mostrar telefone;
- nao mostrar email;
- nao permitir resposta por outra pessoa.

## 9. Notificacoes

Notificacoes obrigatorias para o admin:

- convidado aceitou convocacao;
- convidado recusou convocacao, com motivo.

Notificacoes opcionais:

- convidado visualizou convocacao.

Recomendacao para o MVP:

- registrar visualizacao no app;
- enviar push apenas para aceite e recusa, evitando excesso de notificacoes.

## 10. Historico por email

O email passa a ser a ancora de identidade do convidado.

Ao acessar com um codigo valido e o email convocado, a pessoa consegue ver:

- eventos futuros para os quais foi convocada;
- status de cada convocacao;
- funcoes que precisa executar em cada evento ativo.

Eventos passados e historico completo continuam como evolucao futura.

## 11. Impacto no modelo atual

O fluxo atual tem:

- evento;
- equipes;
- participantes;
- presencas;
- escalas.

O novo fluxo precisa adicionar ou adaptar o conceito de `convocacao`, que representa a escala planejada pelo admin antes da resposta do convidado.

Nome tecnico sugerido:

```text
event_assignments
```

Essa tabela sera a fonte principal para:

- escala do admin;
- acesso do convidado;
- resposta de aceite/recusa;
- historico por email.

## 12. Fora do escopo da Fase 1

Esta fase nao implementa codigo nem banco. Ela apenas define o fluxo.

As proximas fases devem tratar:

- migration do Supabase;
- RPCs de acesso por codigo + email;
- mudancas nas telas do admin;
- mudancas nas telas do convidado;
- notificacoes push para o admin;
- historico por email.
