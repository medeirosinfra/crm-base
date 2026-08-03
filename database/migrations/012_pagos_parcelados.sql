-- ============================================================
-- 012_pagamentos_parcelados.sql
-- Planos de pagamento parcelado (boleto / parcelamento amigável)
-- Um plano pertence a um paciente + procedimento, com N parcelas.
-- Cada parcela controla pago, parcial e restante.
-- ============================================================

CREATE TABLE IF NOT EXISTS planos_pagamento (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  procedimento_id uuid REFERENCES procedimentos(id) ON DELETE SET NULL,
  descricao   text,                                 -- ex: "Ciclo de botox" / "Aparelho"
  valor_total numeric(10,2) NOT NULL DEFAULT 0,
  entrada     numeric(10,2) NOT NULL DEFAULT 0,     -- valor pago no ato (se houver)
  num_parcelas integer NOT NULL DEFAULT 1,
  vencimento  date NOT NULL,                        -- vencimento da 1ª parcela
  forma_pagamento text,                             -- "boleto" | "pix" | "cartao" | "amigavel" | null
  status      text NOT NULL DEFAULT 'ativo'
              CHECK (status IN ('ativo','quitado','cancelado')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planos_tenant ON planos_pagamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_planos_paciente ON planos_pagamento(paciente_id);

CREATE TABLE IF NOT EXISTS parcelas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id   uuid NOT NULL REFERENCES planos_pagamento(id) ON DELETE CASCADE,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero     integer NOT NULL,                      -- 1, 2, 3...
  vencimento date NOT NULL,
  valor      numeric(10,2) NOT NULL DEFAULT 0,
  pago       numeric(10,2) NOT NULL DEFAULT 0,      -- quanto já foi pago (permite parcial)
  status     text NOT NULL DEFAULT 'pendente'
             CHECK (status IN ('pendente','pago','parcial','atrasado','cancelado')),
  pago_em    date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcelas_plano ON parcelas(plano_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_tenant ON parcelas(tenant_id);

-- RLS
ALTER TABLE planos_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

-- planos_pagamento: dono da clínica
CREATE POLICY "planos_select_tenant" ON planos_pagamento
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "planos_insert_tenant" ON planos_pagamento
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "planos_update_tenant" ON planos_pagamento
  FOR UPDATE USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "planos_delete_tenant" ON planos_pagamento
  FOR DELETE USING (tenant_id = current_tenant_id() OR is_super_admin());

-- parcelas: dono da tenant
CREATE POLICY "parcelas_select_tenant" ON parcelas
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "parcelas_insert_tenant" ON parcelas
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "parcelas_update_tenant" ON parcelas
  FOR UPDATE USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "parcelas_delete_tenant" ON parcelas
  FOR DELETE USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Trigger updated_at para planos
DROP TRIGGER IF EXISTS trg_planos_updated_at ON planos_pagamento;
CREATE TRIGGER trg_planos_updated_at
  BEFORE UPDATE ON planos_pagamento
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();