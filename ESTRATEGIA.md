# 🎯 ESTRATÉGIA — CRM White-Label para Clínicas

> **DOCUMENTO MESTRE** — Sempre ler quando retomarmos o trabalho.
> Última atualização: 2026-08-02

---

## 🧭 VISÃO DE NEGÓCIO

Criar uma **linha de produtos SaaS white-label** para revenda, cada um focado num segmento:

### Produto 1 — CRM para Clínicas (ESTE projeto) 🏥
- **Segmentos**: estética, odontologia, dermatologia, consultórios, fisioterapia, psicologia
- **Foco**: agendamento, pacientes, financeiro de clínica, WhatsApp, campanhas
- **SEM PDV** (não faz sentido para clínica de serviços)
- **Configurável por ramo**: cada clínica ativa os módulos que fazem sentido pro seu segmento

### Produto 2 — CRM para Comércio (FUTURO) 🛒
- Mesma ideia de base, mas com **PDV**, estoque, vendas, catálogo de produtos
- Reaproveitar a base (multi-tenant, auth, white-label) com módulos comerciais
- **Quando**: depois do produto 1 maduro

---

## 🎯 DECISÕES ESTRATÉGICAS (02/08/2026)

| # | Decisão | Justificativa |
|---|---|---|
| 1 | **SEM PDV** no CRM de clínicas | Clínica de serviços não precisa de PDV. Comércio sim (produto futuro) |
| 2 | **Configuração por ramo** | Cada clínica escolhe o segmento → ativa módulos relevantes |
| 3 | **Multi-tenant white-label** | 1 código, N clínicas, cada uma com subdomínio/logo/cores |
| 4 | **Supabase local** | Mais seguro, dados no servidor, controle total |
| 5 | **Foco em clínicas primeiro** | Depois evoluir para comércio com mesma base |
| 6 | **GitHub como vitrine** | Repo público profissional para currículo |

---

## 🗺️ MÓDULOS POR SEGMENTO

| Módulo | Estética | Odonto | Dermato | Fisio | Psi |
|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agenda/Agendamentos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pacientes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contatos/Leads | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procedimentos/Tratamentos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Financeiro (receitas/despesas) | ✅ | ✅ | ✅ | ✅ | ✅ |
| WhatsApp (disparador) | ✅ | ✅ | ✅ | ✅ | ✅ |
| White-Label (tema) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Campanhas | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDV | ❌ | ❌ | ❌ | ❌ | ❌ |
| Estoque avançado | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |

**→ A coluna `especialidade` do tenant define quais módulos aparecem.**

---

## 📊 ESTADO ATUAL DO PRODUTO

### Implementado (funcionando):
- ✅ Multi-tenant + RLS (Supabase local)
- ✅ Auth (login + proteção de rotas)
- ✅ White-Label (tema dinâmico por clínica)
- ✅ Gestão de Clínicas (lista)
- ✅ Disparador WhatsApp (WAHA real)
- ✅ Contatos & Leads (tabela pacientes)
- ✅ Financeiro & Estoque (KPIs, transações, produtos)
- ✅ Deploy Docker (porta 3110)
- ✅ GitHub público (`medeirosinfra/crm-base`)

### Em andamento / a fazer:
- ⏳ CRUD completo de Clínicas (criar/editar)
- ⏳ Configurar domínio no Cloudflare Tunnel (`crm.medeirossolucoestech.com.br`)
- ⏳ Roles/permissões avançadas

### Implementado recentemente (02/08):
- ✅ **Procedimentos & Tratamentos** — catálogo por segmento, categoria, duração, preço (migration 004)
- ✅ **Campanhas** — disparo em massa WhatsApp, status rascunho/enviada, seleção de sessão WAHA (migration 004)

### Implementado recentemente (02/08):
- ✅ **Configuração por ramo** — seletor de segmento no White-Label (Odontologia, Estética, Dermato, Fisio, Psi). Define módulos ativos da clínica
- ✅ **Agenda & Agendamentos** — página com dados reais do banco
- ✅ **Pacientes** — gestão completa com cadastro real
- ✅ **Sidebar reestruturada** — grupos "Gestão da Clínica" e "Configuração"
- ✅ **Logout real** no sidebar

### Removido:
- ❌ PDV (não faz sentido para clínicas de serviços — vai para o futuro produto de comércio)

---

## 📐 COMO RETOMAR O TRABALHO (checklist)

Quando voltarmos a trabalhar, seguir este roteiro:

1. **Ler este documento** (ESTRATEGIA.md) para relembrar visão e decisões
2. **Ler PROGRESS.md** do projeto para ver o estado exato
3. **Verificar servidor**: containers rodando (`docker ps`), app na 3110
4. **Continuar do próximo item** na lista "Em andamento"
5. Atualizar ESTREGIA.md e PROGRESS.md ao final

---

## 🔗 LINKS ÚTEIS

- **App em produção**: `http://172.16.0.50:3110`
- **GitHub**: https://github.com/medeirosinfra/crm-base
- **Supabase Studio**: `http://172.16.0.50:54321/`
- **Admin**: `admin@medeirossolucoestech.com.br` / `Master@2026`
- **Backup banco**: `~/backups/`
