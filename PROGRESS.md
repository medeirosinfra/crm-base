# 📊 PROGRESS — CRM Base White-Label (produtos/crm-base)

> **Documentação viva** — atualizar sempre que houver avanço. Base para saber onde estamos e o que fazer.
> Última atualização: 2026-08-02

---

## 🎯 Objetivo

CRM SaaS **white-label multi-tenant** para clínicas: 1 código, N clínicas, cada uma com seu subdomínio, logo, cores e dados isolados (RLS). Revenda em escala.

## ✅ O que está pronto

| # | Item | Status | Detalhe |
|---|---|---|---|
| 1 | Projeto Lovable configurado | ✅ | `crm-base`, TanStack Start + React 19 + Tailwind 4 |
| 2 | Supabase local conectado | ✅ | Banco `supabase`, chaves no `.env` |
| 3 | Schema multi-tenant | ✅ | `tenants`, `profiles`, `pacientes`, `agendamentos` |
| 4 | RLS (isolamento entre clínicas) | ✅ | 11 políticas, anon bloqueado, tenant isolado |
| 5 | Seed de dados | ✅ | 3 clínicas demo + super admin |
| 6 | Service layer Supabase | ✅ | `src/lib/supabase/tenants.ts` |
| 7 | Página Clínicas integrada | ✅ | React Query + dados reais do banco |
| 8 | Script de migração | ✅ | `database/migrate.sh` |

## 🚧 Em andamento / Próximos

| # | Item | Status | Observação |
|---|---|---|---|
| 9 | **White-Label** (tema dinâmico por clínica) | ✅ IMPLEMENTADO | `theme.ts` + `use-tenant-theme.ts` + página `/white-label` com preview ao vivo. Salva cor primária/secundária, domínio, sessão WAHA. |
| 10 | **Disparador Multicanal** (WAHA real) | ✅ IMPLEMENTADO | `waha.ts` + página `/disparador` com envio real (testado: msg enviada). Mostra status das sessões WAHA. |
| 11 | Gestão de Clínicas CRUD completo | ⏳ | Lista integrada (React Query). Falta criar/editar clínica completa. |
| 12 | Auth por subdomínio + middleware | ✅ IMPLEMENTADO | Login GoTrue + RequireAuth protegendo rotas. Página `/login` com resolução de subdomínio. |
| 13 | Roles/permissões | ⏳ | super_admin, admin, gerente, financeiro |
| 14 | Deploy Docker | ✅ IMPLEMENTADO | Container `medeirosinfra-suite` na porta 3110. Dockerfile com build args para VITE_*. Acessível em `http://172.16.0.50:3110`. |
| 15 | Publicar no GitHub como `crm-base` | ✅ IMPLEMENTADO | Repo `crm-base` (privado). Descrição + topics profissionais. |

## 🐳 Deploy Docker (implementado 02/08)
- `Dockerfile` com **build args** para `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_WAHA_BASE_URL`, `VITE_WAHA_API_KEY` (vars VITE_ são embutidas no bundle em build-time)
- `docker-compose.yml` na porta **3110** (3000 está ocupada pelo WAHA)
- Container `medeirosinfra-suite` rodando, todas as páginas 200
- Acesso: `http://172.16.0.50:3110`

## 🚀 Publicado no GitHub
- Repo: `medeirosinfra/crm-base` (PRIVADO — tornar público quando decidir)
- Descrição: CRM SaaS white-label multi-tenant para clínicas
- Topics: crm, whitelabel, multitenant, saas, whatsapp, supabase, tanstack

## 🔐 Autenticação (implementado 02/08)
- `src/lib/auth-context.tsx` — contexto de auth (user, tenantId, cargo, signIn, signOut)
- `src/components/require-auth.tsx` — guard que redireciona para `/login` se não autenticado
- `src/routes/login.tsx` — página de login com resolução de subdomínio (ex: `sisluana.meudominio.com`)
- `src/routes/__root.tsx` — AuthProvider integrado
- Páginas protegidas: `/`, `/clinicas`, `/white-label`, `/disparador`
- Testado: login GoTrue → JWT → acesso a dados; sem token → bloqueado (RLS)

## ✨ Implementado nesta sessão (02/08)

### White-Label (tema dinâmico por clínica)
- `src/lib/theme.ts` — aplica CSS vars por tenant via `data-theme`
- `src/hooks/use-tenant-theme.ts` — busca branding do tenant logado e aplica
- `src/routes/white-label.tsx` — painel do super_admin: seleciona clínica, edita cor primária/secundária, domínio, sessão WAHA, com **preview ao vivo**
- Integrado no `app-shell.tsx` (todos os módulos herdam o tema)

### Disparador Multicanal (integração WAHA real)
- `src/lib/waha.ts` — `sendWhatsAppText()` e `listWahaSessions()`
- `src/routes/disparador.tsx` — envio de mensagem em tempo real + status das sessões
- Testado: envio real via `POST /api/sendText` → mensagem entregue

## 🔮 Melhorias futuras (ideias)

- [ ] Dashboard com KPIs reais (MRR, churn) a partir do banco
- [ ] Relatórios (vendas, fechamento, top produtos) com dados reais
- [ ] Financeiro (caixa, recebimentos, despesas) real
- [ ] PDV real
- [ ] Automações n8n integradas
- [ ] Testes automatizados (Vitest)
- [ ] CI/CD (build automático no push)
- [ ] Screenshots no README do GitHub

## 🐛 Bugs conhecidos / pendências técnicas

- [ ] Login por subdomínio ainda não implementado
- [ ] 6 módulos ainda "Coming Soon"
- [ ] White-Label ainda "Coming Soon"

## 📁 Estrutura do projeto

```
crm-base/
├── database/
│   ├── migrations/       # 001_multi_tenant_schema.sql, 002_seed_data.sql
│   └── migrate.sh        # script para aplicar migrações
├── src/
│   ├── routes/           # páginas (TanStack Router)
│   ├── components/       # shadcn/ui + layout
│   ├── lib/
│   │   ├── supabase/     # client, server, tenants service, types
│   │   └── mock-data.ts  # (a substituir aos poucos)
│   └── hooks/
├── .env                  # NÃO commitar (credenciais)
└── Dockerfile
```
