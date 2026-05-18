# DESIGN SYSTEM - ToNaEscala

## 1. Direção visual

O ToNaEscala deve parecer simples, confiável e rápido. A interface precisa funcionar para coordenadores ocupados, voluntários de diferentes idades e uso frequente em celular.

Palavras-chave:

- Claro.
- Organizado.
- Calmo.
- Mobile-first.
- Familiar.

## 2. Princípios

- A agenda é o centro visual do produto.
- Ações principais devem ficar próximas do contexto.
- Evitar telas densas demais no MVP.
- Usar cores para status e categorias, não como decoração excessiva.
- Textos curtos, objetivos e orientados à ação.

## 3. Cores

### Paleta principal

| Token | Cor | Uso |
|---|---|---|
| `primary` | `#2563EB` | Ações principais, links, seleção. |
| `primary_dark` | `#1D4ED8` | Pressed/active em tema claro. |
| `success` | `#16A34A` | Confirmado, sucesso. |
| `warning` | `#D97706` | Atraso, atenção. |
| `danger` | `#DC2626` | Recusa, conflito forte, cancelamento. |
| `info` | `#0891B2` | Mensagens informativas. |

### Neutros

| Token | Cor |
|---|---|
| `bg` | `#F8FAFC` |
| `surface` | `#FFFFFF` |
| `text` | `#0F172A` |
| `muted` | `#64748B` |
| `border` | `#E2E8F0` |

### Dark mode

| Token | Cor |
|---|---|
| `bg_dark` | `#0B1120` |
| `surface_dark` | `#111827` |
| `text_dark` | `#F8FAFC` |
| `muted_dark` | `#94A3B8` |
| `border_dark` | `#1F2937` |

## 4. Tipografia

Fonte recomendada:

- Sistema nativo via React Native/Expo.

Escala:

| Token | Tamanho | Uso |
|---|---:|---|
| `title_lg` | 28 | Títulos de tela importantes. |
| `title_md` | 22 | Títulos de seções. |
| `body_lg` | 17 | Conteúdo principal. |
| `body` | 15 | Texto padrão. |
| `caption` | 13 | Metadados, horários, labels. |
| `micro` | 11 | Badges e detalhes curtos. |

Regras:

- Não usar fontes muito pequenas para horários e funções.
- Evitar parágrafos longos dentro do app.
- Labels devem ser claros: `Nome do evento`, `Horário inicial`, `Equipe`.

## 5. Espaçamento

Base: 4px.

Tokens:

- `xs`: 4
- `sm`: 8
- `md`: 12
- `lg`: 16
- `xl`: 24
- `2xl`: 32

## 6. Bordas e superfícies

- Cards: raio máximo de 8px.
- Botões: raio 8px.
- Inputs: raio 8px.
- Evitar cards dentro de cards.
- Usar separadores simples em listas longas.

## 7. Componentes

### Botões

Tipos:

- Primário: ação mais importante da tela.
- Secundário: ação alternativa.
- Ghost: ações leves.
- Perigo: cancelar/remover/recusar.

Estados:

- Default.
- Pressed.
- Disabled.
- Loading.

### Inputs

Campos esperados:

- Texto.
- Data.
- Hora.
- Telefone.
- Código do evento.
- Select de categoria/equipe.

Regras:

- Mostrar erro abaixo do campo.
- Máscara para código `TNE-XXXXXX`.
- Teclado numérico quando apropriado.

### Cards de evento

Conteúdo mínimo:

- Nome.
- Data/hora.
- Local, se existir.
- Contagem de escalados ou status.
- Cor lateral ou marcador de categoria.

### Cards de escala

Conteúdo mínimo:

- Nome do participante.
- Função.
- Equipe.
- Status.
- Alerta de conflito, se houver.

### Badges de status

| Status | Cor |
|---|---|
| Pendente | `warning` |
| Confirmado | `success` |
| Recusado | `danger` |
| Atraso | `warning` |
| Conflito | `danger` |

## 8. Ícones

Usar biblioteca consistente, preferencialmente Lucide quando disponível no app.

Ícones esperados:

- Calendário.
- QR Code.
- Compartilhar.
- Sino.
- Usuário.
- Grupo.
- Relógio.
- Localização.
- Alerta.
- Check.
- X.

## 9. Tom de voz

Direto e humano.

Exemplos:

- `Escala criada`
- `Conflito de agenda detectado`
- `Você já está nesse evento`
- `Não encontramos esse código`
- `Presença confirmada`

Evitar:

- Mensagens técnicas de banco.
- Textos longos explicando o produto.
- Culpar o usuário.

## 10. Acessibilidade

- Contraste mínimo adequado em textos e badges.
- Áreas tocáveis de pelo menos 44x44px.
- Não depender apenas de cor para status.
- Suporte a tamanho de fonte aumentado.
- Labels claros para leitores de tela.

## 11. Movimento

Usar animações curtas e funcionais:

- Transição de tabs.
- Feedback de confirmação.
- Skeleton/loading em listas.

Evitar:

- Animações longas em fluxos operacionais.
- Movimento decorativo excessivo.

