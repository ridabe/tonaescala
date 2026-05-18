# ToNaEscala - Índice de Documentação

Este diretório reúne a documentação de produto, técnica e execução do ToNaEscala.

## Documentos existentes

- `PRD_ToNaEscala_COMPLETO.pdf`: visão de produto, público-alvo, MVP, diferenciais e estratégia.
- `ToNaEscala_SPEC_COMPLETO.pdf`: especificação técnica geral, arquitetura, stack, módulos e roadmap técnico.
- `ToNaEscala_DATABASE_SPEC.pdf`: especificação inicial do banco de dados, entidades, índices e regras.

## Documentos adicionados para continuidade

- `API_SPEC.md`: contrato de API para uso via Supabase client, RPCs e Edge Functions.
- `RLS_SECURITY_SPEC.md`: regras de segurança, isolamento multi-tenant, policies e proteção para entrada sem cadastro.
- `UX_FLOW.md`: jornadas principais de organizador e participante.
- `WIREFRAMES_MVP.md`: wireframes textuais das telas essenciais do MVP.
- `DESIGN_SYSTEM.md`: fundações visuais, componentes, estados e diretrizes mobile.
- `ROADMAP_EXECUTIVO.md`: fases de entrega, critérios de aceite e riscos.

## Decisões-base do projeto

- O produto nasce mobile-first, inicialmente Android.
- A administração acontece dentro do app, sem painel web no MVP.
- Organizadores usam autenticação por email/senha ou Google.
- Participantes podem entrar em eventos sem criar conta obrigatória.
- O backend principal é Supabase com PostgreSQL, Auth, Realtime e Edge Functions.
- Toda tabela sensível deve respeitar isolamento por organização e Row Level Security.

