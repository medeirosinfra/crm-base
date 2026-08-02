-- ============================================================
-- Migration 003 - Financeiro & Estoque (multi-tenant)
-- ============================================================

-- Categorias financeiras (por tenant)
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  tipo        text NOT NULL DEFAULT 'receita'
              CHECK (tipo IN ('receita','despesa')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Transações financeiras (fluxo de caixa)
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  descricao   text NOT NULL,
  valor       numeric(10,2) NOT NULL,
  tipo        text NOT NULL DEFAULT 'receita'
              CHECK (tipo IN ('receita','despesa')),
  data        date NOT NULL DEFAULT CURRENT_DATE,
  status      text NOT NULL DEFAULT 'pago'
              CHECK (status IN ('pago','pendente','cancelado')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Produtos (estoque)
CREATE TABLE IF NOT EXISTS produtos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  descricao   text,
  preco       numeric(10,2) NOT NULL DEFAULT 0,
  custo       numeric(10,2) DEFAULT 0,
  quantidade  integer NOT NULL DEFAULT 0,
  unidade     text DEFAULT 'un',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transacoes_tenant ON transacoes_financeiras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data);
CREATE INDEX IF NOT EXISTS idx_produtos_tenant ON produtos(tenant_id);

-- RLS
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_select_tenant" ON categorias_financeiras
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "categorias_insert_tenant" ON categorias_financeiras
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "transacoes_select_tenant" ON transacoes_financeiras
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "transacoes_insert_tenant" ON transacoes_financeiras
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "transacoes_update_tenant" ON transacoes_financeiras
  FOR UPDATE USING (tenant_id = current_tenant_id());
CREATE POLICY "transacoes_delete_tenant" ON transacoes_financeiras
  FOR DELETE USING (tenant_id = current_tenant_id());

CREATE POLICY "produtos_select_tenant" ON produtos
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "produtos_insert_tenant" ON produtos
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "produtos_update_tenant" ON produtos
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Seed de categorias para o tenant demo
INSERT INTO categorias_financeiras (tenant_id, nome, tipo) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Consultas', 'receita'),
  ('00000000-0000-0000-0000-000000000001', 'Procedimentos', 'receita'),
  ('00000000-0000-0000-0000-000000000001', 'Insumos', 'despesa'),
  ('00000000-0000-0000-0000-000000000001', 'Salários', 'despesa')
ON CONFLICT DO NOTHING;

-- Transações demo
INSERT INTO transacoes_financeiras (tenant_id, descricao, valor, tipo, data) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Consulta - Maria Silva', 250.00, 'receita', CURRENT_DATE - 1),
  ('00000000-0000-0000-0000-000000000001', 'Limpeza dental - João Santos', 350.00, 'receita', CURRENT_DATE - 2),
  ('00000000-0000-0000-0000-000000000001', 'Compra de insumos', -180.00, 'despesa', CURRENT_DATE - 3)
ON CONFLICT DO NOTHING;

-- Produtos demo
INSERT INTO produtos (tenant_id, nome, preco, custo, quantidade, unidade) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Clareamento dental', 400.00, 150.00, 10, 'sessão'),
  ('00000000-0000-0000-0000-000000000001', 'Restauração', 200.00, 60.00, 25, 'procedimento')
ON CONFLICT DO NOTHING;
