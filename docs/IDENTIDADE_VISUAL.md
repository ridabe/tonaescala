# IDENTIDADE VISUAL - ToNaEscala

## 1. Direcao escolhida

A identidade visual do ToNaEscala segue a Proposta 2: uma marca acolhedora, organizada e comunitaria, pensada para igrejas, ministerios, equipes de voluntarios e organizadores de eventos.

A interface deve parecer:

- simples;
- confiavel;
- humana;
- mobile-first;
- rapida de entender;
- leve para uso frequente.

O produto nao deve parecer um sistema corporativo pesado. A experiencia deve lembrar agenda, equipe, compromisso e confirmacao.

## 2. Conceito de marca

### Ideia central

```text
Escalas organizadas para pessoas que servem juntas.
```

### Simbolo recomendado

O logo deve combinar dois elementos:

- pessoas/equipe;
- grade de agenda ou escala.

Direcao preferida:

- icone com tres pontos ou perfis simplificados conectados a uma pequena grade;
- formas arredondadas, sem excesso de detalhe;
- leitura clara em tamanho pequeno, especialmente no icone do app;
- versao principal em verde petroleo;
- versao alternativa branca para fundo escuro.

Evitar:

- simbolos religiosos explicitos no MVP;
- calendario generico demais sem identidade;
- degradês no logo principal;
- detalhes finos que somem no app icon.

## 3. Paleta de cores

### Cores principais

| Token | Hex | Uso |
|---|---|---|
| `brand.primary` | `#0F766E` | Acoes principais, headers, marca, estados selecionados. |
| `brand.primaryPressed` | `#115E59` | Estado pressionado de botoes principais. |
| `brand.primarySoft` | `#CCFBF1` | Fundo leve para selecoes, chips e destaques suaves. |
| `brand.primaryMuted` | `#5EEAD4` | Bordas ou marcadores de apoio. |
| `brand.accent` | `#F59E0B` | Atencao leve, convites, pendencias e destaques contextuais. |
| `brand.accentPressed` | `#D97706` | Estado pressionado de acoes em ambar. |
| `brand.accentSoft` | `#FEF3C7` | Fundo leve para status pendente ou aviso. |

### Cores funcionais

| Token | Hex | Uso |
|---|---|---|
| `status.success` | `#16A34A` | Confirmado, sucesso, presenca aceita. |
| `status.successSoft` | `#DCFCE7` | Fundo de badge confirmado. |
| `status.warning` | `#F59E0B` | Pendente, atraso, atencao moderada. |
| `status.warningSoft` | `#FEF3C7` | Fundo de badge pendente/atraso. |
| `status.danger` | `#DC2626` | Recusa, conflito forte, cancelamento. |
| `status.dangerSoft` | `#FEE2E2` | Fundo de badge recusado/conflito. |
| `status.info` | `#0284C7` | Informacoes neutras, links secundarios. |
| `status.infoSoft` | `#E0F2FE` | Fundo de mensagens informativas. |

### Neutros claros

| Token | Hex | Uso |
|---|---|---|
| `neutral.background` | `#F8FAFC` | Fundo geral do app. |
| `neutral.surface` | `#FFFFFF` | Cards, inputs, barras e menus. |
| `neutral.surfaceAlt` | `#F1F5F9` | Superficie secundaria e blocos sutis. |
| `neutral.border` | `#E2E8F0` | Bordas e separadores. |
| `neutral.borderStrong` | `#CBD5E1` | Bordas ativas ou divisores importantes. |
| `neutral.text` | `#0F172A` | Texto principal. |
| `neutral.textMuted` | `#64748B` | Texto secundario e metadados. |
| `neutral.textSoft` | `#94A3B8` | Placeholders e informacoes auxiliares. |

### Neutros escuros

| Token | Hex | Uso |
|---|---|---|
| `dark.background` | `#071A1A` | Fundo geral no modo escuro. |
| `dark.surface` | `#0F2523` | Cards e superficies no modo escuro. |
| `dark.surfaceAlt` | `#16312E` | Superficie secundaria no modo escuro. |
| `dark.border` | `#26433F` | Bordas no modo escuro. |
| `dark.text` | `#F8FAFC` | Texto principal no modo escuro. |
| `dark.textMuted` | `#A7BDB8` | Texto secundario no modo escuro. |

## 4. Uso de cor

- Usar `brand.primary` para a acao mais importante da tela.
- Usar `brand.accent` com moderacao, principalmente para convites, pendencias e chamadas de atencao.
- Status sempre devem usar cor + texto, nunca depender apenas da cor.
- Fundos devem permanecer claros e discretos no tema padrao.
- Evitar telas dominadas por uma unica cor. O verde petroleo deve liderar a marca, mas a interface precisa respirar com neutros.

| Caso | Cor recomendada |
|---|---|
| Botao "Criar evento" | `brand.primary` |
| Botao "Compartilhar convite" | `brand.accent` ou `brand.primary`, conforme prioridade da tela |
| Badge "Confirmado" | `status.successSoft` + `status.success` |
| Badge "Pendente" | `status.warningSoft` + `status.warning` |
| Badge "Conflito" | `status.dangerSoft` + `status.danger` |
| Link discreto | `status.info` |

## 5. Tipografia

### Fonte principal

No app mobile, usar fonte do sistema por padrao:

```text
fontFamily: system
```

Quando o projeto precisar de uma fonte instalada, a recomendacao e usar:

```text
Inter
```

Motivos:

- excelente legibilidade em mobile;
- boa para interfaces operacionais;
- funciona bem em portugues;
- combina com uma marca simples e moderna.

### Escala tipografica

| Token | Tamanho | Line height | Peso | Uso |
|---|---:|---:|---:|---|
| `font.display` | 30 | 38 | 700 | Nome do produto em telas de entrada. |
| `font.titleLg` | 26 | 34 | 700 | Titulos principais de tela. |
| `font.titleMd` | 22 | 30 | 700 | Titulos de secoes importantes. |
| `font.titleSm` | 18 | 26 | 600 | Cabecalhos de cards e modais. |
| `font.bodyLg` | 17 | 26 | 400 | Texto principal em detalhes. |
| `font.body` | 15 | 22 | 400 | Texto padrao do app. |
| `font.bodyStrong` | 15 | 22 | 600 | Labels, nomes e informacoes destacadas. |
| `font.caption` | 13 | 18 | 500 | Datas, horarios e metadados. |
| `font.micro` | 11 | 14 | 700 | Badges e textos muito curtos. |

Regras:

- Nao usar texto menor que 11px.
- Horarios, nomes de equipe e status precisam ser legiveis rapidamente.
- Titulos em telas operacionais devem ser objetivos: `Agenda`, `Eventos`, `Nova escala`.
- Evitar frases longas em botoes.
- Usar sentence case em portugues: `Criar evento`, nao `Criar Evento`.

## 6. Espacamento

Base de espacamento: 4px.

| Token | Valor | Uso |
|---|---:|---|
| `space.1` | 4 | Ajustes finos, distancia entre icone e texto. |
| `space.2` | 8 | Espacamento compacto. |
| `space.3` | 12 | Padding interno de chips e badges. |
| `space.4` | 16 | Padding padrao de tela e cards. |
| `space.5` | 20 | Separacao media entre blocos. |
| `space.6` | 24 | Separacao de secoes. |
| `space.8` | 32 | Respiro entre grupos grandes. |

### Layout mobile

| Token | Valor |
|---|---:|
| `layout.screenPadding` | 16 |
| `layout.cardGap` | 12 |
| `layout.sectionGap` | 24 |
| `layout.bottomTabHeight` | 64 |
| `layout.headerHeight` | 56 |
| `layout.minTouchTarget` | 44 |

## 7. Raios, bordas e sombras

### Raios

| Token | Valor | Uso |
|---|---:|---|
| `radius.xs` | 4 | Badges pequenos. |
| `radius.sm` | 6 | Chips e elementos compactos. |
| `radius.md` | 8 | Cards, botoes e inputs. |
| `radius.lg` | 12 | Modais e bottom sheets. |
| `radius.full` | 999 | Avatares, indicadores circulares. |

Regra: cards, botoes e inputs devem usar no maximo 8px no fluxo comum do app.

### Bordas

| Token | Valor |
|---|---:|
| `border.hairline` | 1 |
| `border.focus` | 2 |

### Sombras

Usar sombras com muita moderacao.

| Token | Uso |
|---|---|
| `shadow.none` | Estado padrao de listas e cards simples. |
| `shadow.sm` | Bottom sheet, menu flutuante ou botao elevado. |

Cards de lista devem preferir borda sutil em vez de sombra pesada.

## 8. Iconografia

Biblioteca recomendada:

```text
lucide-react-native
```

| Acao/contexto | Icone sugerido |
|---|---|
| Agenda | `CalendarDays` |
| Eventos | `CalendarPlus` |
| Convite/QR Code | `QrCode` |
| Compartilhar | `Share2` |
| Equipes | `Users` |
| Participante | `User` |
| Horario | `Clock` |
| Local | `MapPin` |
| Confirmado | `CheckCircle2` |
| Recusado | `XCircle` |
| Atraso | `ClockAlert` |
| Conflito | `TriangleAlert` |
| Notificacoes | `Bell` |
| Perfil | `CircleUserRound` |

Regras:

- Icones de navegacao: 22 a 24px.
- Icones dentro de botoes: 18 a 20px.
- Icones informativos em cards: 16 a 18px.
- Usar stroke padrao 2.

## 9. Componentes base

### Botao primario

| Propriedade | Valor |
|---|---|
| Fundo | `brand.primary` |
| Texto | `#FFFFFF` |
| Altura minima | 48 |
| Padding horizontal | 16 |
| Raio | 8 |
| Peso do texto | 600 |

Estados:

- pressed: `brand.primaryPressed`;
- disabled: `neutral.surfaceAlt` com texto `neutral.textSoft`;
- loading: manter largura e trocar conteudo por indicador.

### Botao secundario

| Propriedade | Valor |
|---|---|
| Fundo | `neutral.surface` |
| Texto | `brand.primary` |
| Borda | `neutral.border` |
| Altura minima | 48 |
| Raio | 8 |

### Botao de convite

Usado para `Compartilhar convite`, `Copiar codigo` e acoes relacionadas ao QR Code.

| Propriedade | Valor |
|---|---|
| Fundo preferencial | `brand.accent` |
| Texto | `#FFFFFF` |
| Icone | `Share2` ou `QrCode` |
| Raio | 8 |

### Input

| Propriedade | Valor |
|---|---|
| Fundo | `neutral.surface` |
| Borda | `neutral.border` |
| Borda focada | `brand.primary` |
| Texto | `neutral.text` |
| Placeholder | `neutral.textSoft` |
| Altura minima | 48 |
| Raio | 8 |
| Padding horizontal | 12 |

### Card de evento

Conteudo minimo:

- titulo do evento;
- data e horario;
- local, se existir;
- quantidade de escalados ou status;
- marcador lateral em `brand.primary` ou cor da categoria.

Estilo:

- fundo `neutral.surface`;
- borda `neutral.border`;
- raio 8;
- padding 16;
- sem sombra por padrao.

### Card de escala

Conteudo minimo:

- nome do participante;
- equipe;
- funcao;
- horario;
- status.

Estados:

- confirmado: badge verde;
- pendente: badge ambar;
- recusado: badge vermelho;
- conflito: destaque vermelho com icone `TriangleAlert`.

### Badge

| Status | Fundo | Texto |
|---|---|---|
| Confirmado | `status.successSoft` | `status.success` |
| Pendente | `status.warningSoft` | `status.warning` |
| Atraso | `status.warningSoft` | `status.warning` |
| Recusado | `status.dangerSoft` | `status.danger` |
| Conflito | `status.dangerSoft` | `status.danger` |
| Info | `status.infoSoft` | `status.info` |

## 10. Constantes sugeridas para o app

Exemplo de estrutura para `src/theme/tokens.ts`:

```ts
export const colors = {
  brand: {
    primary: '#0F766E',
    primaryPressed: '#115E59',
    primarySoft: '#CCFBF1',
    primaryMuted: '#5EEAD4',
    accent: '#F59E0B',
    accentPressed: '#D97706',
    accentSoft: '#FEF3C7',
  },
  status: {
    success: '#16A34A',
    successSoft: '#DCFCE7',
    warning: '#F59E0B',
    warningSoft: '#FEF3C7',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    info: '#0284C7',
    infoSoft: '#E0F2FE',
  },
  neutral: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#64748B',
    textSoft: '#94A3B8',
  },
  dark: {
    background: '#071A1A',
    surface: '#0F2523',
    surfaceAlt: '#16312E',
    border: '#26433F',
    text: '#F8FAFC',
    textMuted: '#A7BDB8',
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  titleLg: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  titleMd: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  titleSm: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  bodyLg: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
} as const;

export const layout = {
  screenPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  headerHeight: 56,
  bottomTabHeight: 64,
  minTouchTarget: 44,
} as const;
```

## 11. Tom visual por tela

### Login e entrada por codigo

- Fundo claro.
- Logo em destaque.
- Entrada por codigo visivel sem menu.
- Botao principal em `brand.primary`.
- Acao de QR Code com icone.

### Agenda

- Lista clara e escaneavel.
- Agrupar por `Hoje`, `Amanha` e `Proximos`.
- Horario sempre visivel.
- Status com badge.

### Eventos

- Organizacao atual visivel no topo.
- Cards com data, horario e contagem de escalados.
- Criar evento como acao principal.

### Detalhe do evento

- Resumo de confirmados, pendentes e recusas.
- Botao `Compartilhar convite` proximo do cabecalho.
- Tabs: `Escala`, `Equipes`, `Info`.
- Alertas de conflito devem ser visiveis, mas nao ocupar a tela toda.

## 12. Checklist de implementacao visual

- [ ] Criar arquivo `src/theme/tokens.ts`.
- [ ] Criar componentes base: `Button`, `Input`, `Badge`, `EventCard`, `ScheduleCard`.
- [ ] Configurar icones com `lucide-react-native`.
- [ ] Aplicar tema na navegacao do Expo Router.
- [ ] Testar contraste dos badges.
- [ ] Validar telas em Android pequeno e medio.
- [ ] Criar app icon baseado no simbolo de equipe + agenda.
