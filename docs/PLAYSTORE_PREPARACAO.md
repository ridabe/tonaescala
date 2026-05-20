# Preparacao Play Store - ToNaEscala

Documento de apoio para criar a ficha da Play Store, preparar artes, escrever a descricao da versao e publicar a primeira versao de teste interno.

## 1. Dados principais do app

| Campo | Sugestao |
|---|---|
| Nome do app | ToNaEscala |
| Nome curto | ToNaEscala |
| Pacote Android | `com.tonaescala.app` |
| Versao atual | `1.0.0` |
| Version code atual | `1` |
| Categoria sugerida | Produtividade |
| Tags sugeridas | Agenda, organizacao, eventos, equipes, voluntariado |
| Idioma principal | Portugues (Brasil) |
| Publico principal | Igrejas, ministerios, equipes de voluntarios e organizadores de eventos comunitarios |

## 2. Descricao curta

Limite da Play Store: ate 80 caracteres.

Opcao recomendada:

```text
Organize eventos, equipes e escalas de voluntarios pelo celular.
```

Alternativas:

```text
Escalas organizadas para equipes, eventos e ministerios.
```

```text
Crie eventos, convoque equipes e acompanhe respostas em tempo real.
```

## 3. Descricao completa

Texto pronto para a ficha da Play Store:

```text
O ToNaEscala ajuda organizadores a montar eventos, equipes e escalas de forma simples, direta e segura pelo celular.

Criado para igrejas, ministerios, equipes de voluntarios e eventos comunitarios, o app reduz a dependencia de planilhas, conversas perdidas em grupos e confirmacoes manuais de ultima hora.

Com o ToNaEscala, o organizador pode:

- criar eventos com data, horario, local e categoria;
- montar equipes e definir funcoes;
- convocar pessoas por nome e email;
- compartilhar convite por codigo ou QR Code;
- acompanhar quem aceitou, recusou, visualizou ou ainda esta pendente;
- receber notificacoes de aceite e recusa;
- consultar a agenda de eventos e convocacoes.

Para convidados, a entrada e simples: basta usar o codigo do evento ou QR Code junto com o email cadastrado na convocacao. Nao e necessario criar senha para responder a uma escala. A pessoa ve os dados do evento, equipe, funcao, horario, observacoes e pode aceitar ou recusar a participacao.

O ToNaEscala foi pensado para quem organiza pessoas que servem juntas: louvor, recepcao, midia, infantil, apoio, producao, eventos especiais e outras equipes que precisam de clareza sobre quem faz o que, quando e onde.

Principais recursos:

- agenda visual de eventos;
- cadastro de organizacoes;
- criacao e edicao de eventos;
- equipes por evento;
- convocacoes com funcao e horario;
- entrada por codigo de evento e email;
- leitura de QR Code;
- status de aceite, recusa, visualizacao e pendencia;
- justificativa obrigatoria em recusas;
- notificacoes para organizadores;
- protecao de acesso para que apenas emails convocados vejam os detalhes do evento.

ToNaEscala: escalas organizadas para pessoas que servem juntas.
```

## 4. Texto promocional curto

Use em materiais, banner ou descricao de screenshots:

```text
Organize quem faz o que, quando e onde.
```

```text
Convide equipes e acompanhe respostas sem perder nada.
```

```text
Codigo, QR Code e confirmacoes em um so lugar.
```

## 5. Novidades da versao

Limite comum da Play Console para notas de versao: ate 500 caracteres por idioma.

Versao recomendada para teste interno:

```text
Primeira versao de teste do ToNaEscala. Inclui criacao de organizacao, eventos, equipes e convocacoes, entrada de convidados por codigo/QR Code e email, aceite ou recusa com justificativa, notificacoes para organizadores e agenda de acompanhamento. Esta versao sera validada com testers internos antes da publicacao.
```

Versao mais curta:

```text
Primeira versao de teste com eventos, equipes, convocacoes, entrada por codigo/QR Code, respostas de convidados, notificacoes e agenda. Publicacao destinada a validacao interna antes do lancamento.
```

## 6. Artes da ficha da Play Store

Pasta gerada para upload e revisao:

```text
playstore-assets/
```

Assets existentes no projeto:

| Arquivo | Uso sugerido | Status |
|---|---|---|
| `assets/images/icon.png` | Icone do app 1024x1024 | Pronto |
| `assets/images/adaptive-icon.png` | Icone adaptativo Android | Pronto |
| `assets/images/splash-icon.png` | Splash screen | Pronto |
| `img/tonaescala-logo-horizontal.png` | Logo horizontal | Pronto |
| `img/tonaescala-banner-1600x900.png` | Base para feature graphic ou materiais | Precisa adaptar |
| `img/telas sistema.png` | Composicao atual de telas | Referencia, baixa resolucao para Play Store |

### Feature graphic

Tamanho recomendado para upload:

```text
1024 x 500 px
PNG ou JPEG
```

Direcao visual:

- fundo verde petroleo `#0F766E`;
- logo branco ou logo horizontal em destaque;
- frase curta: `Escalas organizadas para pessoas que servem juntas`;
- evitar texto pequeno, mockups muito detalhados ou excesso de elementos.

### Screenshots para celular

Preparar pelo menos 6 imagens, preferencialmente em formato vertical.

Sugestao de sequencia:

1. Login / entrada no evento
   - Texto de apoio: `Entre como organizador ou convidado`
   - Mostra login, codigo do evento e email do convidado.

2. Agenda
   - Texto de apoio: `Veja seus compromissos em uma agenda clara`
   - Mostra eventos de hoje e proximos.

3. Eventos
   - Texto de apoio: `Crie eventos e acompanhe suas escalas`
   - Mostra cards de eventos com data e contadores.

4. Detalhe do evento
   - Texto de apoio: `Acompanhe aceites, recusas e pendencias`
   - Mostra resumo de status e lista de convocados.

5. Compartilhar convite
   - Texto de apoio: `Compartilhe por codigo ou QR Code`
   - Mostra QR Code e codigo do evento.

6. Tela do convidado
   - Texto de apoio: `Convidados respondem sem criar senha`
   - Mostra dados da convocacao e botoes de aceite/recusa.

7. Notificacoes
   - Texto de apoio: `Receba respostas da equipe em tempo real`
   - Mostra notificacoes de aceite e recusa.

### Screenshots para tablet

Como o Android pode instalar em telas maiores, criar artes de tablet ajuda a ficha e evita uma aparencia improvisada em dispositivos grandes.

Sugestao:

- usar as mesmas telas principais;
- gerar em proporcao de tablet vertical;
- manter os textos de apoio maiores e com menos linhas;
- validar se o app se comporta bem em telas largas antes de enviar como tablet.

## 7. Textos para alt text dos screenshots

O Google Play permite cadastrar texto alternativo nas imagens. Sugestoes:

```text
Tela inicial do ToNaEscala com opcoes para organizador e entrada por codigo de evento.
```

```text
Agenda com eventos e convocacoes organizados por data e status.
```

```text
Lista de eventos com data, horario e resumo das convocacoes.
```

```text
Detalhe do evento com contadores de aceites, recusas, visualizacoes e pendencias.
```

```text
Convite do evento com QR Code e codigo para compartilhar com convidados.
```

```text
Tela do convidado com dados da convocacao e opcoes para aceitar ou recusar.
```

```text
Notificacoes do organizador com respostas recentes dos convidados.
```

## 8. Checklist antes de criar o teste interno

### Tecnico

- [ ] Rodar `npm run lint`.
- [ ] Rodar `npx tsc --noEmit`.
- [ ] Validar fluxo completo em Android real.
- [ ] Validar leitura de QR Code em Android real.
- [ ] Confirmar que `.env.local` nao foi commitado.
- [ ] Confirmar que Supabase de producao/beta esta com migrations aplicadas.
- [ ] Confirmar que Sentry, se usado, aponta para o ambiente correto.
- [ ] Revisar permissao `android.permission.RECORD_AUDIO`; remover se nao houver uso real de microfone.
- [ ] Confirmar politica de privacidade publicada em URL acessivel.
- [ ] Confirmar pagina de exclusao de conta/dados, se exigida para o tipo de conta e coleta.

### Play Console

- [ ] Criar app Android no Play Console.
- [ ] Selecionar idioma padrao: Portugues (Brasil).
- [ ] Preencher nome do app.
- [ ] Preencher ficha principal da loja.
- [ ] Enviar icone 512x512 se solicitado pela Play Console.
- [ ] Enviar feature graphic 1024x500.
- [ ] Enviar screenshots de celular.
- [ ] Enviar screenshots de tablet, se for anunciar suporte visual a tablet.
- [ ] Preencher categoria e dados de contato.
- [ ] Preencher politica de privacidade.
- [ ] Responder questionario de seguranca de dados.
- [ ] Responder classificacao de conteudo.
- [ ] Informar se o app contem anuncios: nao, salvo decisao contraria.
- [ ] Informar se o app e pago: nao, salvo decisao contraria.

## 9. Criar build AAB para Play Store

O perfil `production` do `eas.json` ja esta configurado para gerar Android App Bundle:

```bash
npx eas build --platform android --profile production
```

Conferir antes:

- `app.json` tem `android.package`: `com.tonaescala.app`;
- `android.versionCode` deve subir a cada nova build enviada;
- `expo.version` representa a versao exibida, hoje `1.0.0`;
- o app esta conectado ao projeto EAS correto.

## 10. Criar versao de teste interno

Roteiro pratico:

1. Acesse Play Console.
2. Abra o app `ToNaEscala`.
3. Va em `Teste e lancamento` > `Teste` > `Teste interno`.
4. Na aba de testers, crie uma lista de emails.
5. Adicione ate 100 contas Google de testers.
6. Salve a lista.
7. Volte para a trilha de teste interno.
8. Clique em criar nova versao.
9. Envie o arquivo `.aab` gerado pelo EAS.
10. Preencha o nome da versao, por exemplo:

```text
1.0.0-internal-1
```

11. Cole as notas de versao do item 5.
12. Revise os avisos da Play Console.
13. Envie para revisao/publicacao do teste interno.
14. Copie o link de opt-in do teste e compartilhe com os testers.

Observacoes:

- O teste interno e limitado a ate 100 testers.
- Em geral, uma nova build no teste interno fica disponivel em poucos minutos.
- Na primeira publicacao do app, algumas informacoes temporarias da ficha podem levar ate 48 horas para atualizar para testers.
- Se a conta de desenvolvedor for pessoal e criada depois de 13/11/2023, a liberacao para producao pode exigir teste fechado com pelo menos 12 testers por 14 dias continuos. Isso e diferente do teste interno.

## 11. Roteiro para testers internos

Enviar junto com o link de opt-in:

```text
Obrigado por testar o ToNaEscala.

Objetivo do teste:
validar se organizadores conseguem criar eventos, equipes e convocacoes, e se convidados conseguem acessar pelo codigo/QR Code e responder sem criar senha.

Por favor teste:
1. criar conta e organizacao;
2. criar um evento;
3. criar uma equipe;
4. adicionar convocados com email;
5. abrir o convite e copiar codigo/QR Code;
6. entrar como convidado usando codigo + email;
7. aceitar uma convocacao;
8. recusar outra convocacao com justificativa;
9. conferir notificacoes do organizador;
10. avisar qualquer erro, tela confusa ou travamento.

Ao reportar erro, envie:
- modelo do celular;
- versao do Android;
- email usado no teste;
- passo em que o erro aconteceu;
- print ou video, se possivel.
```

## 12. Dados de seguranca e privacidade

Rascunho para preencher a Play Console, a validar juridicamente e tecnicamente:

Dados tratados pelo app:

- email do organizador;
- email de convidados convocados;
- nome de organizadores, convidados ou participantes;
- dados de eventos, equipes, funcoes, horarios e observacoes;
- status de visualizacao, aceite e recusa;
- justificativa de recusa;
- token de notificacao push, quando permitido pelo dispositivo;
- registros tecnicos de erro/diagnostico, se Sentry estiver habilitado.

Finalidades:

- criar e gerenciar conta;
- organizar eventos e escalas;
- permitir resposta de convidados;
- enviar notificacoes operacionais;
- proteger acesso a eventos por codigo + email;
- diagnosticar erros e melhorar estabilidade.

Pontos que precisam estar claros na politica de privacidade:

- quais dados sao coletados;
- por que sao coletados;
- onde ficam armazenados;
- por quanto tempo ficam armazenados;
- como o usuario pode pedir exclusao;
- contato do responsavel pelo app.

## 13. Pendencias recomendadas antes da aprovacao

- Criar URL publica de politica de privacidade.
- Criar URL publica de solicitacao/exclusao de conta e dados, se aplicavel.
- Remover permissao de microfone se nao for necessaria.
- Gerar screenshots reais do app em celular Android.
- Gerar screenshots de tablet apenas depois de validar layout em tela grande.
- Preparar feature graphic 1024x500.
- Validar manualmente os fluxos de `docs/TESTES_MANUAIS_BETA.md`.
