# Plano de features a partir dos audios do cliente - 2026-05-20

## 1. Contexto

O cliente avaliou a proposta do ToNaEscala e trouxe sugestoes pensando em uma igreja com ministerio grande, citando cerca de 190 musicos, alem de coralistas, orquestra e lideres. A leitura principal e que o app pode deixar de ser apenas uma ferramenta de escala/convocacao e virar tambem um ambiente de preparo musical.

As sugestoes se conectam especialmente a igrejas, bandas, ministerios de louvor e eventos musicais, com foco em:

- facilitar estudo do repertorio por quem foi escalado;
- organizar links, cifras, letras e versoes oficiais das musicas;
- criar um arquivo de apoio para musicos;
- permitir personalizacao do app por igreja/ministerio;
- no futuro, criar uma comunidade/marketplace musical entre usuarios.

Transcricao bruta gerada em `docs/CLIENTE_AUDIOS_2026-05-20_TRANSCRICAO.json`.

## 2. Sugestoes identificadas

### 2.1 Repertorio com links de estudo

O cliente sugeriu que, ao montar a escala ou finalizar a banda de um evento, o lider consiga enviar junto o repertorio com links de apoio.

Exemplos citados:

- link da musica no YouTube;
- link da musica no Spotify ou outra plataforma;
- link para letra;
- link para cifra;
- link do Letras, Cifras ou Google;
- versao especifica que o lider quer que a banda estude.

Problema que resolve:

- evita que cada musico estude uma versao diferente;
- reduz mensagens soltas em WhatsApp;
- centraliza repertorio e escala no mesmo fluxo;
- deixa claro o que cada convocado precisa estudar antes do evento.

### 2.2 Biblioteca de repertorio do ministerio

O cliente citou uma lista antiga de repertorio de musicas possiveis, usada pelo ministerio para escolher musicas conforme a necessidade do culto/evento.

Ideia de produto:

- manter uma biblioteca de musicas aprovadas pela igreja/ministerio;
- organizar por ordem alfabetica;
- permitir busca por nome;
- guardar cifra, letra, links e observacoes;
- registrar tom padrao e variacoes de tom masculino/feminino;
- selecionar musicas dessa biblioteca ao criar o repertorio de um evento.

Problema que resolve:

- cria um repertorio institucional;
- ajuda os musicos a estudar dentro do universo permitido pelo ministerio;
- acelera a montagem de repertorio para cultos e eventos especiais;
- reduz retrabalho do lider ao montar eventos recorrentes.

### 2.3 Arquivos e materiais de apoio para musicos

O cliente sugeriu um "arquivo de apoio para musico", incluindo materiais que podem auxiliar a banda no estudo ou execucao.

Exemplos citados:

- link de pad de fundo;
- playback;
- VS/multitrack comprado ou disponibilizado em comunidades;
- pacotes de apoio por musica;
- links externos para materiais de estudo.

Observacao importante:

- o MVP deve tratar isso inicialmente como links externos e anexos simples, evitando armazenar ou redistribuir conteudo protegido por direito autoral sem regra clara.

Problema que resolve:

- centraliza material tecnico do repertorio;
- ajuda tecladistas, violonistas, guitarristas e banda em geral;
- permite que o lider indique exatamente qual recurso sera usado.

### 2.4 Afinador para musicos

O cliente sugeriu uma aba simples com afinador, especialmente para musicos de corda.

Ideia de produto:

- criar um utilitario dentro do app;
- usar microfone para detectar nota/frequencia;
- opcionalmente com modos simples: violao, guitarra, baixo, cromatico.

Problema que resolve:

- adiciona utilidade diaria ao app;
- aumenta frequencia de uso por musicos;
- reforca posicionamento do ToNaEscala como ferramenta para ministerio musical, nao apenas agenda.

### 2.5 Personalizacao por igreja/ministerio

O cliente perguntou se a igreja que adquirir o app conseguiria personalizar a apresentacao interna com:

- logo da igreja;
- slogan;
- identidade visual;
- possivel imagem vetorizada/logotipo.

Problema que resolve:

- aumenta senso de pertencimento;
- facilita adocao interna;
- torna o app mais "da igreja" e menos generico;
- abre caminho para planos pagos por organizacao.

### 2.6 Comunidade/marketplace musical

O cliente sugeriu uma aba de comunidade/marketplace entre igrejas, bandas e musicos, com anuncios e troca de informacoes.

Exemplos citados:

- venda de instrumentos;
- venda de equipamentos;
- prestacao de servico musical;
- cantor;
- banda para casamento;
- divulgacao com imagens;
- conversa via chat;
- divulgacao externa por links em Facebook, WhatsApp e Telegram.

Problema que resolve:

- cria rede entre usuarios de varias igrejas;
- aumenta efeito de comunidade;
- pode divulgar o app organicamente;
- abre possibilidades comerciais futuras.

Risco:

- e uma expansao grande de escopo, com moderacao, privacidade, regras comerciais, abuso/spam e suporte. Deve ficar pos-MVP.

## 3. Leitura de produto

As sugestoes criam um novo eixo para o ToNaEscala:

```text
Escala + Convocacao + Repertorio + Estudo musical
```

O caminho mais coerente e nao transformar tudo em marketplace agora. O melhor primeiro passo e fortalecer o fluxo ja existente:

1. admin cria evento;
2. admin cria convocacoes;
3. admin define repertorio do evento;
4. cada musica tem links e materiais de estudo;
5. convidado escalado acessa sua convocacao e ja ve o que estudar.

Assim, as novas features aumentam valor sem quebrar o MVP atual.

## 4. Plano de features proposto

### Fase 8 - Repertorio por evento

Prioridade: alta.

Objetivo:

- permitir que o organizador/lider monte uma lista de musicas vinculada a um evento.

Features:

- CRUD de musicas dentro do evento;
- ordem das musicas no repertorio;
- campos: titulo, artista/referencia, tom, BPM opcional, observacoes;
- links por musica: YouTube, Spotify, letra, cifra, outro;
- visao do convidado com repertorio do evento;
- indicador de "versao oficial para estudo".

Criterios de aceite:

- admin consegue adicionar repertorio em um evento;
- convidado convocado consegue ver repertorio junto com sua convocacao;
- links abrem fora do app usando navegador/app externo;
- repertorio pode ser reordenado pelo admin ou salvo em ordem manual.

Dependencias tecnicas:

- tabela `event_songs`;
- tabela `event_song_links` ou campo JSON para links;
- ajuste na tela de detalhe do evento;
- ajuste na tela de convidado.

### Fase 9 - Biblioteca de musicas da organizacao

Prioridade: alta/media.

Objetivo:

- criar um catalogo permanente de musicas por organizacao, reutilizavel em varios eventos.

Features:

- cadastro de musicas da organizacao;
- busca por titulo;
- ordenacao alfabetica;
- tags/categorias simples;
- tom padrao;
- tom masculino/feminino opcional;
- links padrao de letra/cifra/video/audio;
- ao montar evento, selecionar musicas da biblioteca.

Criterios de aceite:

- admin cadastra uma musica uma vez e reutiliza em varios eventos;
- admin monta repertorio do evento a partir da biblioteca;
- editar a musica da biblioteca nao deve quebrar historico do evento; o evento deve manter uma copia dos campos principais ou snapshot.

Dependencias tecnicas:

- tabela `songs`;
- relacao `event_songs` com snapshot;
- tela de biblioteca em contexto da organizacao;
- permissao apenas para organizadores/lideres.

### Fase 10 - Materiais de apoio por musica

Prioridade: media.

Objetivo:

- permitir que cada musica tenha recursos extras para estudo e execucao.

Features:

- links de pad, playback, VS, multitrack ou pasta externa;
- anexos opcionais, se fizer sentido no plano pago;
- tipo do material: audio, video, cifra, letra, pad, playback, outro;
- visibilidade por evento ou por biblioteca;
- aviso de responsabilidade sobre direitos autorais, se houver upload.

Criterios de aceite:

- admin adiciona materiais por musica;
- convidado ve materiais apenas dos eventos/convocacoes que pode acessar;
- links externos funcionam sem armazenar conteudo protegido no app.

Dependencias tecnicas:

- tabela `song_resources`;
- opcional: Supabase Storage para anexos;
- regra de permissao por organizacao e convocacao.

### Fase 11 - Personalizacao por organizacao

Prioridade: media.

Objetivo:

- permitir que a organizacao deixe a experiencia com sua identidade.

Features:

- upload de logo;
- nome publico da organizacao;
- slogan opcional;
- cor principal opcional;
- exibicao no perfil, eventos e tela de entrada por codigo;
- template de convite com marca da igreja.

Criterios de aceite:

- organizador configura identidade da organizacao;
- convidado ve marca da organizacao ao entrar no evento;
- app continua visualmente consistente mesmo sem personalizacao.

Dependencias tecnicas:

- novos campos em `organizations`;
- upload em storage;
- validacao de tamanho/tipo de imagem;
- fallback para marca ToNaEscala.

### Fase 12 - Afinador para musicos

Prioridade: baixa/media.

Objetivo:

- adicionar uma ferramenta simples de utilidade musical.

Features:

- tela "Afinador";
- permissao de microfone;
- deteccao de frequencia;
- nota atual;
- indicador visual de acima/abaixo do tom;
- modo cromatico inicial.

Criterios de aceite:

- usuario consegue abrir o afinador;
- app solicita permissao de microfone;
- app mostra nota aproximada e desvio;
- se microfone nao estiver disponivel, exibe estado de erro claro.

Dependencias tecnicas:

- biblioteca de audio/microfone compativel com Expo/dev client;
- teste em device real;
- possivel necessidade de modulo nativo.

### Fase 13 - Comunidade e marketplace musical

Prioridade: baixa para MVP, alta como visao futura.

Objetivo:

- criar uma rede de anuncios e servicos musicais entre usuarios/organizacoes.

Features:

- anuncios com titulo, descricao, preco opcional, imagens e categoria;
- categorias: instrumento, equipamento, servico, banda/cantor, outros;
- escopo local/regional;
- chat ou contato;
- links publicos de anuncio;
- moderacao/denuncia;
- regras de uso.

Criterios de aceite:

- usuario cria anuncio;
- outros usuarios visualizam e filtram anuncios;
- anuncio pode ter imagens;
- contato ocorre de forma controlada;
- admin/moderador consegue remover conteudo indevido.

Dependencias tecnicas:

- tabelas de listings, imagens e mensagens;
- storage para imagens;
- sistema de denuncia/moderacao;
- politicas de privacidade e termos de uso;
- possivel separacao entre comunidade interna e marketplace publico.

## 5. Priorizacao recomendada

| Prioridade | Feature | Motivo |
|---|---|---|
| P0 | Repertorio por evento | Conecta diretamente com escala/convocacao atual e gera valor imediato para ministerios de musica. |
| P1 | Biblioteca de musicas | Reduz retrabalho e cria base permanente para igrejas grandes. |
| P1 | Links de estudo por musica | Baixo risco tecnico se tratado como links externos. |
| P2 | Materiais de apoio | Muito util, mas exige cuidado com direitos autorais e storage. |
| P2 | Personalizacao por organizacao | Bom para venda/adocao, mas nao desbloqueia o fluxo principal. |
| P3 | Afinador | Boa utilidade, mas depende de audio nativo e testes em device. |
| P4 | Marketplace/comunidade | Visao interessante, porem grande escopo e risco operacional. |

## 6. MVP recomendado dessas sugestoes

Para transformar a sugestao em entrega rapida, o MVP musical deveria conter apenas:

1. aba/secao "Repertorio" dentro do detalhe do evento;
2. adicionar musica ao evento;
3. campos simples: titulo, tom, observacao;
4. links: YouTube, Spotify, letra, cifra;
5. visualizacao do repertorio para convidados convocados;
6. abertura dos links externos;
7. documentar biblioteca/marketplace como evolucao, nao como primeira entrega.

Esse recorte preserva o ToNaEscala como app de organizacao de escalas e adiciona a camada musical sem explodir o escopo.

## 7. Modelo de dados inicial sugerido

### `event_songs`

- `id`
- `event_id`
- `title`
- `artist`
- `key`
- `bpm`
- `notes`
- `position`
- `created_by`
- `created_at`
- `updated_at`

### `event_song_links`

- `id`
- `event_song_id`
- `type` (`youtube`, `spotify`, `lyrics`, `chords`, `resource`, `other`)
- `label`
- `url`
- `created_at`

Evolucao futura:

- `songs` para biblioteca da organizacao;
- `song_resources` para materiais reaproveitaveis;
- snapshot de musica no evento para preservar historico.

## 8. Impacto nas telas

### Admin - detalhe do evento

Adicionar uma secao ou aba:

- `Repertorio`

Conteudo:

- lista ordenada de musicas;
- botao adicionar;
- editar/remover;
- links visiveis por musica;
- opcional: copiar repertorio de outro evento.

### Convidado - evento/convocacao

Adicionar bloco:

- `Repertorio para estudar`

Conteudo:

- musicas do evento;
- tom/observacoes;
- links de estudo;
- materiais de apoio, quando existirem.

### Futuro - biblioteca

Adicionar tela de organizacao:

- `Biblioteca musical`

Conteudo:

- busca;
- lista alfabetica;
- cadastro/edicao;
- selecionar musicas para evento.

## 9. Riscos e cuidados

- Direitos autorais: evitar hospedar cifras, letras, playbacks e VS sem licenca. Comecar com links externos.
- Escopo: marketplace e comunidade devem ficar fora do MVP musical.
- Privacidade: materiais de um evento devem aparecer apenas para pessoas autorizadas.
- UX: nao transformar a criacao de evento em fluxo pesado; repertorio deve ser opcional.
- Tecnico: afinador pode exigir dependencias nativas e validacao em device real.

## 10. Proximos passos

1. Validar com o cliente se o primeiro recorte deve ser "Repertorio por evento".
2. Confirmar campos minimos da musica: titulo, tom, link YouTube, link cifra/letra e observacao.
3. Definir se repertorio aparece para todos os convocados do evento ou apenas equipes musicais.
4. Criar especificacao tecnica da Fase 8.
5. Implementar migration e telas de admin/convidado.
6. Depois, evoluir para biblioteca de musicas da organizacao.
