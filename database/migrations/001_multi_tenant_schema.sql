-- ============================================================
-- Migration 001 - Schema multi-tenant inicial (CRM White-Label)
-- Supabase local: crm_base
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. TABELA: tenants (clínicas)
-- Cada linha = uma clínica/cliente do white-label
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,                -- subdomínio: sisluana, sisderma...
  nome        text NOT NULL,
  descricao   text,
  especialidade text,                              -- Odontologia, Estética, etc.
  status      text NOT NULL DEFAULT 'trial'
              CHECK (status IN ('ativa','trial','inadimplente','suspensa')),
  -- White-label: identidade visual
  logo_url    text,
  cor_primaria text DEFAULT '#e11d48',
  cor_segundaria text DEFAULT '#0f172a',
  dominio    text,                                 -- domínio próprio se tiver
  -- Planos / SaaS
  plano      text NOT NULL DEFAULT 'starter'
              CHECK (plano IN ('starter','pro','empresarial')),
  mrr        numeric(10,2) DEFAULT 0,
  -- WhatsApp
  waha_sessao text,                                -- nome da sessão WAHA do tenant
  whatsapp_sessions integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. TABELA: perfis de usuários (vincula auth.users ao tenant)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE,
  nome       text NOT NULL,
  email      text NOT NULL,
  cargo      text NOT NULL DEFAULT 'staff'
             CHECK (cargo IN ('super_admin','admin','gerente','financeiro','staff')),
  ativo      boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. TABELA: pacientes (exemplo de tabela de negócio com tenant_id)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  telefone    text,
  email       text,
  nascimento  date,
  observacoes text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_tenant ON pacientes(tenant_id);

-- ------------------------------------------------------------
-- 4. TABELA: agendamentos (exemplo com tenant_id)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agendamentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  data        timestamptz NOT NULL,
  tipo        text,                                 -- consulta, retorno, avaliação
  status      text NOT NULL DEFAULT 'agendado'
              CHECK (status IN ('agendado','confirmado','cancelado','concluido')),
  observacoes text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant ON agendamentos(tenant_id);

-- ------------------------------------------------------------
-- 5. RLS - Row Level Security (isolamento entre tenants)
-- O JWT do Supabase Auth carrega tenant_id no claim 'tenant_id'
-- ------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Helper: obter tenant_id do JWT do usuário autenticado
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
$$;

-- tenants: super_admin vê tudo; usuário comum só seu tenant
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
    OR id = current_tenant_id()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.cargo = 'super_admin')
  );

CREATE POLICY "tenants_admin_insert" ON tenants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.cargo = 'super_admin')
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

CREATE POLICY "tenants_admin_update" ON tenants
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.cargo = 'super_admin')
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- pacientes: cada usuário só vê pacientes do seu tenant
CREATE POLICY "pacientes_select_own_tenant" ON pacientes
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "pacientes_insert_own_tenant" ON pacientes
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "pacientes_update_own_tenant" ON pacientes
  FOR UPDATE USING (tenant_id = current_tenant_id());

CREATE POLICY "pacientes_delete_own_tenant" ON pacientes
  FOR DELETE USING (tenant_id = current_tenant_id());

-- agendamentos: cada usuário só vê agendamentos do seu tenant
CREATE POLICY "agendamentos_select_own_tenant" ON agendamentos
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "agendamentos_insert_own_tenant" ON agendamentos
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "agendamentos_update_own_tenant" ON agendamentos
  FOR UPDATE USING (tenant_id = current_tenant_id());

CREATE POLICY "agendamentos_delete_own_tenant" ON agendamentos
  FOR DELETE USING (tenant_id = current_tenant_id());

-- ------------------------------------------------------------
-- 6. Trigger: atualizar updated_at automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pacientes_updated_at BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
