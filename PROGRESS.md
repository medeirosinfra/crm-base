# 📊 PROGRESS — CRM Base White-Label (produtos/crm-base)

> **Documentação viva** — atualizar sempre que houver avanço. Base para saber onde estamos e o que fazer.
> Última atualização: 2026-08-03

---

## 🎯 Objetivo

CRM SaaS **white-label multi-tenant** para clínicas: 1 código, N clínicas, cada uma com seu subdomínio, logo, cores e dados isolados (RLS). Revenda em escala.

## ✅ O que está pronto

| # | Item | Status | Detalhe |
|---|---|---|---|
| 1 | Projeto configurado | ✅ | TanStack Start + React 19 + Tailwind 4 + shadcn |
| 2 | Supabase local conectado | ✅ | Banco `supabase`, chaves no `.env` |
| 3 | Schema multi-tenant | ✅ | `tenants`, `profiles`, `pacientes`, `agendamentos` + migration 005 (profissionais, procedimento, campos clínicos) |
| 4 | RLS (isolamento entre clínicas) | ✅ | anon bloqueado, tenant isolado, service_role para painel master |
| 5 | Seed de dados | ✅ | 3 clínicas demo + super admin |
| 6 | Auth + RBAC | ✅ | Login GoTrue, cargos (super_admin/admin/gerente/financeiro/staff), `require-role.tsx` |
| 7 | White-Label (tema dinâmico) | ✅ | `theme.ts` + página `/white-label` com preview |
| 8 | CRUD de Clínicas | ✅ | Criar/editar/excluir com branding, segmento, plano |
| 9 | Disparador WhatsApp (WAHA real) | ✅ | `waha.ts` + página `/disparador` |
| 10 | Deploy Docker + internet | ✅ | Porta 3110, `https://crm.medeirossolucoestech.com.br` |
| 11 | Publicado no GitHub | ✅ | `medeirosinfra/crm-base` (público) |

## ✨ Fases de evolução (02/08-03/08)

### Fase 1 — Dashboard com dados REAIS ✅
- `src/lib/supabase/dashboard.ts` — resumo, faturamento mensal, procedimentos top, pacientes novos
- `src/routes/index.tsx` — KPIs reais (pacientes, agendamentos, receitas/despesas), gráfico de evolução
- Fix: **Toaster montado no AppShell** (toasts estavam invisíveis)
- `src/lib/query-keys.ts` (centraliza keys) + `src/lib/formatters.ts` (BRL/data/telefone)

### Fase 2 — Relatórios & BI ✅
- `src/lib/supabase/relatorios.ts` — faturamento mensal, top procedimentos, novos pacientes, agenda por status, totais
- `src/routes/relatorios.tsx` — abas Financeiro/Procedimentos/Pacientes/Agenda + cards de totais

### Fase 3 — Fluxo de Agenda completo ✅
- `src/lib/supabase/agendamentos.ts` — CRUD com joins (paciente, procedimento, profissional) via service_role
- `src/routes/agenda.tsx` — criar agendamento (paciente+procedimento+data/hora+profissional), transições de status, cancelar, excluir

### Fase 4 — Detalhe do Paciente ✅
- `src/lib/supabase/pacientes.ts` — getPaciente, histórico, transações, update
- `src/routes/pacientes.$id.tsx` — abas Visão geral/Histórico/Financeiro + cards resumo

### Sistema de Harmonização Facial ✅ (03/08)
- Migration 007: 15 procedimentos (botox, preenchimento, fios PDO, bioestimuladores, bichectomia), 4 profissionais especialistas, tabelas `anamneses` + `prontuario_registros` com RLS
- `src/lib/supabase/prontuario.ts` — getAnamnese, upsertAnamnese, listProntuario, createProntuarioRegistro
- `src/routes/anamnese.tsx` — ficha de avaliação facial (histórico de saúde, avaliação facial, avaliador)
- Sidebar + permissões: módulo `anamnese` para todos os cargos (exceto financeiro)

## 🚧 Próximos (roadmap)

| # | Item | Status |
|---|---|---|
| 1 | Empty states padronizados (componente `EmptyState`) | ✅ criado |
| 2 | Anamnese + Prontuário | ✅ migration 007 + página /anamnese |
| 3 | **PLATAFORMA 2 CAMADAS** | ✅ Master (/master) + Clínica (raiz) |
| 4 | **Menus dinâmicos por segmento** | ✅ segmento_modulos |
| 5 | **Admin automático ao criar clínica** | ✅ createClinicWithAdmin |
| 6 | **Funcionários e Setores** | ✅ /funcionarios + /setores |
| 7 | Financeiro detalhado (DRE completo) | ⏳ |
| 8 | Campanhas com disparo real | ⏳ |
| 9 | Automações (N8N/IA) + bots + anúncios | ⏳ |
| 10 | Subdomínio por clínica (DNS wildcard) | ⏳ |
| 11 | Testes automatizados (Vitest) | ⏳ |
| 12 | Screenshots no README do GitHub | ⏳ |

## 📋 Padrões de código

- **Service layer**: `src/lib/supabase/*.ts` — cada domínio, retorna `Promise<T[]>`, `throw new Error()` em falha
- **Painel master (super_admin)**: usa `supabaseAdmin` (service_role) pois RLS por tenant faz super_admin ver 0
- **Admin/staff de clínica**: usaria `supabase` (client, RLS filtra pelo tenant)
- **Página**: `useQuery` leitura + `useMutation` escrita + `invalidateQueries`
- **Guards**: `<RequireAuth>` → `<RequireRole modulo="X">`
- **Toaster**: `<Toaster richColors position="top-right"/>` no `AppShell`

## 🐳 Deploy Docker

- `Dockerfile` com build args `VITE_*` (embutidos no bundle)
- Preset Nitro **node-server** (NÃO cloudflare — quebra assets)
- Proxy `/supabase/**` → `172.16.0.50:54321` e `/waha/**` → `172.16.0.50:3000` (browser fala com domínio do app)
- `docker compose up -d --build`

## 🔗 Links

- **App**: `https://crm.medeirossolucoestech.com.br`
- **Local**: `http://172.16.0.50:3110`
- **GitHub**: https://github.com/medeirosinfra/crm-base
- **Admin**: `marcio@medeirossolucoestech.com.br` / `M1rc3nh4@2026`
