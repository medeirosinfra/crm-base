# MedeirosInfra Business Suite

Plataforma SaaS multi-tenant white-label (CRM + ERP + PDV + Automação WhatsApp via WAHA), construída em TanStack Start + React 19 + Vite 7 + Tailwind v4.

---

## 📦 Stack

- **Frontend/SSR:** TanStack Start v1, React 19, Vite 7
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI, Lucide Icons
- **Backend/DB:** PostgreSQL + Supabase (RLS multi-tenant)
- **WhatsApp:** WAHA (WhatsApp HTTP API) — motor único e oficial
- **Automação:** N8N
- **Infra:** Docker + Nginx Reverse Proxy + SSL

---

## 🚀 Rodar em desenvolvimento

```bash
bun install
bun run dev
```

App em `http://localhost:8080`.

---

## 🐳 Build de produção com Docker (Linux)

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/medeirosinfra-business-suite.git
cd medeirosinfra-business-suite
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
nano .env
```

### 3. Subir com docker-compose

```bash
docker compose up -d --build
```

O app fica disponível em `http://SEU_SERVIDOR:3000`.

### 4. Nginx Reverse Proxy (exemplo)

```nginx
server {
  listen 443 ssl http2;
  server_name crm.seudominio.com.br;

  ssl_certificate     /etc/letsencrypt/live/crm.seudominio.com.br/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/crm.seudominio.com.br/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Depois:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔧 Comandos úteis

```bash
docker compose logs -f app     # ver logs
docker compose restart app     # reiniciar
docker compose down            # parar
docker compose pull && docker compose up -d --build   # atualizar
```

---

## 📤 Exportar / baixar o código

### Opção A — Baixar ZIP direto do Lovable
No editor Lovable → botão **Code Editor** (sidebar) → **Download codebase** no rodapé da árvore de arquivos. Requer workspace pago.

### Opção B — Conectar ao GitHub (recomendado)
1. No editor Lovable, menu **+** (canto inferior esquerdo do chat) → **GitHub → Connect project**.
2. Autorize o Lovable GitHub App.
3. Selecione a conta/organização e clique **Create Repository**.
4. Sincronização é bidirecional: mudanças no Lovable vão pro GitHub e vice-versa em tempo real.
5. Depois, no seu servidor:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO
docker compose up -d --build
```

Docs completos: https://docs.lovable.dev/integrations/github

---

## 🏗 Estrutura

```
src/
├── routes/          # Rotas file-based (TanStack Router)
├── components/ui/   # shadcn/ui
├── integrations/    # Supabase client, auth middleware
├── lib/             # Server functions (.functions.ts) e utils
└── styles.css       # Design system (tokens oklch, Tailwind v4)
```

---

## 📝 Licença

Proprietário — MedeirosInfra © 2026
