-- ============================================================
-- 010_bots_whatsapp.sql — Bots de atendimento WhatsApp
-- Configuração persistida dos bots que respondem no WhatsApp
-- ============================================================

CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = bot do master (todas)
  nome text NOT NULL,
  saudacao text,
  keyword text,
  resposta text,
  transferir_humano boolean DEFAULT true,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bots_tenant ON bots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bots_ativo ON bots(ativo);

ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- super_admin e admin da clínica podem gerenciar bots
CREATE POLICY "bots_select" ON bots
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "bots_insert" ON bots
  FOR INSERT WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "bots_update" ON bots
  FOR UPDATE USING (tenant_id IS NULL OR tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "bots_delete" ON bots
  FOR DELETE USING (tenant_id IS NULL OR tenant_id = current_tenant_id() OR is_super_admin());

-- Seed: bot do master (atende qualquer clínica)
INSERT INTO bots (nome, saudacao, keyword, resposta, transferir_humano, ativo) VALUES
  ('Atendente Master', 'Olá! Sou o assistente virtual da clínica. 😊 Como posso ajudar?', NULL, 'Em instantes um atendente vai falar com você.', true, true)
ON CONFLICT DO NOTHING;
