# 🎯 ESTRATÉGIA — CRM White-Label para Clínicas

> **DOCUMENTO MESTRE** — Sempre ler quando retomarmos o trabalho.
> Última atualização: 2026-08-04

## 🔄 RETOMADA (ler primeiro ao voltar)

1. **Ler este ESTRATEGIA.md** — visão, decisões, roadmap
2. **Ler PROGRESS.md** — estado exato do que está pronto
3. **Verificar servidor**: `docker ps` (medeirosinfra-suite Up, waha WORKING, supabase healthy)
4. **PENDÊNCIA CRÍTICA**: bot integrado ao WhatsApp está **funcionando e testado mas NÃO publicado no GitHub** — aguardando autorização do dono para fazer push
5. Continuar do "PRÓXIMOS PASSOS" no PROGRESS.md

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
- ⏳ Configurar domínio no Cloudflare Tunnel (`crm.medeirossolucoestech.com.br`)

### Implementado (02-04/08):
- ✅ **PLATAFORMA 2 CAMADAS (Master + Clínica)**:
  - **Painel Master** (`/master`): super_admin. Dashboard do ecossistema, Gestão de Clínicas, White-Label, Automações
  - **Painel da Clínica**: admin/staff. Rotas no raiz (/agenda, /pacientes...). Login redireciona: super_admin→/master, clínica→/agenda
  - **Admin automático**: server function `createClinicWithAdmin` cria tenant + auth admin + profile + funcionario ao cadastrar clínica
  - **Menus dinâmicos por segmento**: tabela `segmento_modulos` define quais módulos cada segmento mostra
  - **Funcionários** (`/funcionarios`) e **Setores** (`/setores`): admin da clínica gerencia equipe
- ✅ **Roles & Permissões (RBAC)** — matriz de cargos × módulos
- ✅ **Sistema de Harmonização Facial** (migration 007): 15 procedimentos, 4 profissionais, anamnese + prontuário
- ✅ **BOT INTEGRADO AO WHATSAPP** (04/08) — ⚠️ NÃO PUBLICADO:
  - Webhook `/webhook/waha` no `src/server.ts` — URL estável que o WAHA chama
  - WAHA → `https://crm.medeirossolucoestech.com.br/webhook/waha` → consulta bots → responde via WAHA
  - Tabela `bots` (migration 010) + service `bots.ts` + página `/master/bots`
  - **Testado**: bot "Atendente Master" responde de verdade
  - **PENDENTE**: fazer push no GitHub (aguardando autorização do dono)
- ✅ **FERRAMENTAS DO MASTER** (04/08):
  - **Disparos em Massa** (`/master/disparos`): envio de WhatsApp em massa para contatos de todas as clínicas (WAHA)
  - **Anúncios** (`/master/anuncios`): CRUD de anúncios para redes sociais com agendamento
  - **Bots de Atendimento** (`/master/bots`): configuração de bots (saudação, keyword, resposta, transferir humano)
  - **Segmentos & Módulos** (`/master/segmentos`): configure quais módulos cada segmento mostra (menus via UI)
- ✅ **Dashboard com dados reais**, **Relatórios & BI**, **Agenda completa**, **Detalhe do Paciente**

### Implementado recentemente (02/08):
- ✅ **CRUD completo de Clínicas** — criar/editar/excluir com branding (cor, domínio, WAHA), segmento, status, plano (testado via API)

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

- **App em produção (internet)**: `https://crm.medeirossolucoestech.com.br`
- **App (local)**: `http://172.16.0.50:3110`
- **GitHub**: https://github.com/medeirosinfra/crm-base
- **Supabase via app**: `https://crm.medeirossolucoestech.com.br/supabase`
- **Supabase Studio (local)**: `http://172.16.0.50:54321/`
- **Admin**: email e senha em variáveis de ambiente (ver `~/.env` no servidor; nunca commitar credenciais)
- **Backup banco**: `~/backups/`

## 🔧 INFRA IMPORTANTE (deploy internet)

- **Preset NITRO = `node-server`** (NÃO cloudflare-module — que quebra assets no Docker, causa tela branca). Configurado em `vite.config.ts`.
- **Proxy no Nitro** (`vite.config.ts` routeRules):
  - `/supabase/**` → `http://172.16.0.50:54321/**` (Kong local via IP do host)
  - `/waha/**` → `http://172.16.0.50:3000/**` (WAHA local)
- **`.env` usa**: `VITE_SUPABASE_URL=https://crm.medeirossolucoestech.com.br/supabase` (o browser fala só com o domínio do app, que proxyia pro host). NUNCA usar IP interno `172.16.0.50` nas URLs VITE_ (browser externo não alcança).
- **IMPORTANTE**: `127.0.0.1` no proxy NÃO funciona (dentro do container é ele mesmo). Usar `172.16.0.50` (IP do host, alcançável da rede bridge).
- **Cloudflare Tunnel**: rota `crm.medeirossolucoestech.com.br` → `172.16.0.50:3110`. A rota `supabase.medeirossolucoestech.com.br` não é mais necessária (o proxy resolve).
