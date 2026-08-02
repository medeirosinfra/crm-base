<div align="center">

# 🏥 CRM Base — White-Label SaaS para Clínicas

**Plataforma SaaS multi-tenant white-label**: CRM, gestão de clínicas, disparo de WhatsApp e tema dinâmico por cliente — tudo em uma única base de código revendável.

[![TanStack Start](https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![WhatsApp WAHA](https://img.shields.io/badge/WhatsApp-WAHA-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://waha.devlike.pro)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Funcionalidades

- 🏢 **Multi-tenant white-label** — 1 código, N clínicas, cada uma com subdomínio, logo e cores próprias
- 🎨 **Tema dinâmico por clínica** — cores/logo aplicadas automaticamente por tenant (CSS variables)
- 📨 **Disparador WhatsApp (WAHA)** — envio de mensagens em tempo real com status das sessões
- 🏥 **Gestão de clínicas** — painel master com todas as clínicas, planos e status
- 🔐 **Auth com RLS** — isolamento total de dados entre tenants (Row Level Security no Supabase)
- 🧩 **Design system profissional** — shadcn/ui + Radix + Tailwind v4

## 🗂️ Módulos

| Módulo | Rota | Status |
|---|---|---|
| Visão Geral SaaS (dashboard) | `/` | ✅ |
| Gestão de Clínicas | `/clinicas` | ✅ |
| White-Label (tema/branding) | `/white-label` | ✅ |
| Disparador WhatsApp | `/disparador` | ✅ |
| Login | `/login` | ✅ |
| Financeiro & Estoque | `/financeiro` | ⏳ |
| PDV & Vendas | `/pdv` | ⏳ |
| Contatos & Leads | `/contatos` | ⏳ |
| Automações & IA | `/automacoes` | ⏳ |
| Relatórios | `/relatorios` | ⏳ |

## 🛠️ Stack

- **Frontend/SSR**: TanStack Start v1, React 19, Vite, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui, Radix UI, Lucide Icons
- **Backend/DB**: Supabase (PostgreSQL) + RLS multi-tenant
- **WhatsApp**: WAHA (WhatsApp HTTP API)
- **Automação**: N8N
- **Infra**: Docker

## 🚀 Rodar em desenvolvimento

```bash
bun install
bun run dev
```

## 🐳 Deploy com Docker

```bash
# 1. Configure o .env (copie de .env.example e preencha)
cp .env.example .env

# 2. Build com as variáveis VITE_ (importantes para o client)
docker compose up -d --build
```

> ⚠️ **Importante**: as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_WAHA_BASE_URL` e `VITE_WAHA_API_KEY` são embutidas no bundle no **build-time** — por isso são passadas como `build args` no `docker-compose.yml`.

## 📂 Estrutura

```
src/
├── routes/          # páginas (TanStack Router file-based)
├── components/      # shadcn/ui + layout (sidebar, app-shell)
├── lib/
│   ├── supabase/    # client, server, tenants service, types
│   ├── waha.ts      # integração WhatsApp
│   ├── theme.ts     # tema white-label dinâmico
│   └── auth-context.tsx
├── hooks/           # use-tenant-theme
└── styles.css       # design system (CSS variables)
database/
├── migrations/      # schema + seed (multi-tenant + RLS)
└── migrate.sh
```

## 📄 Licença

MIT License — veja [LICENSE](LICENSE).
