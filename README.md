<div align="center">
  <img src="img/minhaescala-logo-horizontal.png" alt="Minha Escala" width="320" />

  <h3>Escalas organizadas para pessoas que servem juntas.</h3>

  <p>
    App mobile para gestão de eventos, equipes e escalas — pensado para igrejas, ministérios e organizações voluntárias.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Expo-55.0-000020?logo=expo&logoColor=white" />
    <img src="https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" />
  </p>
</div>

---

## 📱 O que é o Minha Escala?

O **Minha Escala** resolve um problema real e cotidiano: organizar quem faz o quê, quando e onde — sem planilhas, sem grupos de WhatsApp bagunçados e sem ligações de última hora.

- 🏢 **Organizadores** criam eventos e escalas diretamente no celular
- 👤 **Participantes** entram em eventos via QR Code ou código, **sem cadastro obrigatório**
- 📅 Agenda visual com confirmações, recusas e atrasos em tempo real
- ⚠️ Detecção automática de conflitos de horário
- 🔗 Convites por QR Code ou link reduzem fricção de entrada

**Público-alvo:** igrejas, ministérios, equipes de voluntários e organizadores de eventos comunitários.

---

## 🛠️ Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework mobile | [Expo SDK 55](https://expo.dev) + React Native 0.83 |
| Linguagem | TypeScript 5.9 |
| Navegação | [Expo Router](https://expo.github.io/router) (file-based routing) |
| Backend | [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime) |
| Ícones | [Lucide React Native](https://lucide.dev) |
| Animações | React Native Reanimated 4 |
| Build & Deploy | [EAS Build](https://expo.dev/eas) |

---

## 🗂️ Estrutura do projeto

```
minhaescala/
├── app/                    # Telas (Expo Router file-based)
│   ├── (auth)/             # Grupo de rotas de autenticação
│   │   └── login.tsx
│   ├── (tabs)/             # Navegação principal por abas
│   │   ├── agenda.tsx      # Agenda do usuário
│   │   ├── eventos.tsx     # Lista de eventos
│   │   ├── notificacoes.tsx
│   │   └── perfil.tsx
│   ├── enter-event.tsx     # Entrada em evento por código
│   └── _layout.tsx         # Root layout
├── assets/
│   ├── fonts/              # Fontes customizadas
│   └── images/             # Ícones e splash screen
├── components/             # Componentes reutilizáveis
├── constants/              # Tokens de design (cores, espaçamentos)
├── hooks/                  # Custom hooks
├── lib/                    # Clientes externos (Supabase, etc.)
├── supabase/
│   └── migrations/         # Histórico de migrations do banco
├── docs/                   # Documentação de produto e técnica
└── img/                    # Assets de branding/marketing
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- [npm](https://www.npmjs.com) 10+
- [Expo Go](https://expo.dev/go) no celular Android — **ou** um emulador Android
- Conta no [Supabase](https://supabase.com) com projeto criado

### 1. Clone e instale as dependências

```bash
git clone https://github.com/ridabe/minhaescala.git
cd minhaescala
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz com base no exemplo abaixo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

> 💡 As chaves públicas estão em **Supabase Dashboard → Project Settings → API**.

### 3. Inicie o servidor de desenvolvimento

```bash
npm start
```

Escaneie o QR Code com o **Expo Go** no celular, ou pressione:
- `a` → abre no emulador Android
- `w` → abre no navegador (web)

---

## 🧪 Scripts disponíveis

```bash
npm start          # Inicia o Metro Bundler (Expo)
npm run android    # Roda no emulador/dispositivo Android
npm run ios        # Roda no simulador iOS (requer macOS)
npm run web        # Roda no navegador
npm run lint       # Verifica o código com ESLint
```

---

## 🗄️ Banco de dados (Supabase)

O schema inicial está em `supabase/migrations/`. Para aplicar as migrations no seu projeto Supabase:

```bash
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

> 📄 Veja `docs/API_SPEC.md` para o contrato de API e `docs/RLS_SECURITY_SPEC.md` para as regras de segurança (Row Level Security).

---

## 🎨 Design System

- **Cor primária:** `#2563EB` (azul) — ações e links
- **Cor de marca:** `#0F766E` (verde petróleo) — identidade e splash
- **Sucesso:** `#16A34A` | **Alerta:** `#D97706` | **Erro:** `#DC2626`
- Suporte a **Dark Mode** automático (`userInterfaceStyle: automatic`)

Documentação completa: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) e [`docs/IDENTIDADE_VISUAL.md`](docs/IDENTIDADE_VISUAL.md)

---

## 🗺️ Roadmap

| Fase | Status | Descrição |
|------|--------|-----------|
| **Fase 0** — Fundação | ✅ Concluída | Expo + Supabase + EAS + Design System + Navegação |
| **Fase 1** — MVP Organizador | ✅ Concluída para MVP técnico | Login, CRUD de eventos/equipes/escalas, QR Code |
| **Fase 2** — MVP Participante | ✅ Concluída para MVP técnico | Entrada sem cadastro, agenda, confirmações |
| **Fase 3** — Conflitos & Notificações | ✅ Concluída para MVP técnico | Conflitos, notificações in-app e push token |
| **Fase 4** — Polimento & Beta | ✅ Concluída para beta técnico | Estados vazios, skeletons, erros, offline parcial, Sentry e analytics |

> Detalhes em [`docs/ROADMAP_EXECUTIVO.md`](docs/ROADMAP_EXECUTIVO.md)

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | Contrato de API (Supabase client, RPCs, Edge Functions) |
| [`docs/RLS_SECURITY_SPEC.md`](docs/RLS_SECURITY_SPEC.md) | Segurança, isolamento multi-tenant, RLS policies |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Componentes, cores, tipografia e estados |
| [`docs/UX_FLOW.md`](docs/UX_FLOW.md) | Jornadas do organizador e do participante |
| [`docs/WIREFRAMES_MVP.md`](docs/WIREFRAMES_MVP.md) | Wireframes textuais das telas do MVP |
| [`docs/ROADMAP_EXECUTIVO.md`](docs/ROADMAP_EXECUTIVO.md) | Fases, critérios de aceite e riscos |
| [`docs/TESTES_MANUAIS_BETA.md`](docs/TESTES_MANUAIS_BETA.md) | Roteiro de validacao manual para beta tecnico |

---

## ⚠️ Configurações sensíveis

- **Nunca** commite `.env.local` — ele já está no `.gitignore`
- **Nunca** commite `.claude/settings.local.json` — use esse arquivo para tokens locais do Claude Code
- Chaves do Supabase (`ANON_KEY`, `SERVICE_ROLE_KEY`) ficam exclusivamente nas variáveis de ambiente

---

## 🤝 Contribuindo

1. Crie uma branch a partir de `main`: `git checkout -b feat/minha-feature`
2. Faça suas alterações e siga a convenção de commits (`feat:`, `fix:`, `chore:`, etc.)
3. Abra um Pull Request descrevendo o que foi feito e por quê

---

<div align="center">
  <sub>Feito com ❤️ para quem organiza com propósito.</sub>
</div>
