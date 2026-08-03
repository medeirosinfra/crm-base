# 📊 PROGRESS — CRM Base White-Label (produtos/crm-base)

> **Documentação viva** — atualizar sempre que houver avanço. Base para saber onde estamos e o que fazer.
> Última atualização: 2026-08-04

---

## 🔄 COMO RETOMAR (ler ao voltar)

1. **Ler este PROGRESS.md** — estado exato do que está pronto
2. **Ler ESTRATEGIA.md** — visão de negócio e decisões
3. **Verificar servidor**: `docker ps` (container medeirosinfra-suite deve estar Up)
4. **Continuar do item "PRÓXIMOS PASSOS"** abaixo
5. Atualizar docs ao final da sessão

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

## 🚧 PRÓXIMOS PASSOS (continuar daqui)

| # | Item | Status |
|---|---|---|
| 1 | **PUBLICAR bot integrado no GitHub** | ⏳ AGUARDANDO DONO — código testado, falta push |
| 2 | Criar bot específico de botox/preenchimento (keyword + resposta) | ⏳ testar resposta real |
| 3 | Bot por clínica (cada clínica seu bot) | ⏳ |
| 4 | Financeiro detalhado (DRE completo) | ⏳ |
| 5 | Campanhas com disparo real (fila + relatório) | ⏳ |
| 6 | Anúncios com integração real (redes sociais) | ⏳ estado local hoje |
| 7 | Subdomínio por clínica (DNS wildcard) | ⏳ |
| 8 | Testes automatizados (Vitest) | ⏳ |
| 9 | Screenshots no README do GitHub | ⏳ |

## ✅ Feito até agora (04/08)

### Bot integrado ao WhatsApp (NÃO publicado ainda)
- **Webhook `/webhook/waha`** no `src/server.ts` (intercepta POST antes do router)
- WAHA aponta para `https://crm.medeirossolucoestech.com.br/webhook/waha`
- Fluxo: WhatsApp → WAHA → nosso webhook → consulta bots → responde via WAHA
- **Testado**: `{"responded":true,"bot":"Atendente Master"}`
- Tabela `bots` (migration 010) + service `bots.ts`
- Página `/master/bots` para criar bots (keyword + resposta)
- ⚠️ **NÃO fez push no GitHub** — aguardando autorização do dono

### Ferramentas do Master (04/08)
- `/master/disparos`: envio WhatsApp em massa (WAHA) para contatos de todas as clínicas
- `/master/anuncios`: CRUD de anúncios redes sociais (estado local)
- `/master/bots`: configuração de bots (estado local + integrado via webhook)
- `/master/segmentos`: configure quais módulos cada segmento mostra (via UI)

### Plataforma 2 Camadas (04/08)
- Painel Master (`/master`) + Painel da Clínica (raiz)
- Menus dinâmicos por segmento (`segmento_modulos`)
- Admin automático ao criar clínica (server function `createClinicWithAdmin`)
- Funcionários (`/funcionarios`) e Setores (`/setores`)

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
- **Admin**: email/senha em variáveis de ambiente no servidor (não commitar credenciais)
