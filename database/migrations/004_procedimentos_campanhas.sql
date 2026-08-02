-- ============================================================
-- Migration 004 - Procedimentos/Tratamentos e Campanhas
-- ============================================================

-- Procedimentos/Tratamentos (catálogo por clínica, adaptado ao segmento)
CREATE TABLE IF NOT EXISTS procedimentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  descricao   text,
  categoria   text,                                 -- ex: Harmonização, Implante, Pele
  duracao_min integer DEFAULT 30,                   -- duração em minutos
  preco       numeric(10,2) DEFAULT 0,
  ativo       boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Campanhas de WhatsApp (disparo em massa)
CREATE TABLE IF NOT EXISTS campanhas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  mensagem    text NOT NULL,
  status      text NOT NULL DEFAULT 'rascunho'
              CHECK (status IN ('rascunho','agendada','enviando','enviada','cancelada')),
  agendamento timestamptz,                          -- quando enviar (null = imediato)
  total_contatos integer DEFAULT 0,
  enviados     integer DEFAULT 0,
  falhas       integer DEFAULT 0,
  waha_sessao  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Registro dos contatos de cada campanha
CREATE TABLE IF NOT EXISTS campanha_contatos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  contato     text NOT NULL,                        -- telefone (whatsapp)
  nome        text,
  status      text NOT NULL DEFAULT 'pendente'
              CHECK (status IN ('pendente','enviado','falhou')),
  enviado_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_procedimentos_tenant ON procedimentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_tenant ON campanhas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campanha_contatos_campanha ON campanha_contatos(campanha_id);

-- RLS
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanha_contatos ENABLE ROW LEVEL SECURITY;

-- Procedimentos
CREATE POLICY "procedimentos_select_tenant" ON procedimentos
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "procedimentos_insert_tenant" ON procedimentos
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "procedimentos_update_tenant" ON procedimentos
  FOR UPDATE USING (tenant_id = current_tenant_id());
CREATE POLICY "procedimentos_delete_tenant" ON procedimentos
  FOR DELETE USING (tenant_id = current_tenant_id());

-- Campanhas
CREATE POLICY "campanhas_select_tenant" ON campanhas
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "campanhas_insert_tenant" ON campanhas
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "campanhas_update_tenant" ON campanhas
  FOR UPDATE USING (tenant_id = current_tenant_id());
CREATE POLICY "campanhas_delete_tenant" ON campanhas
  FOR DELETE USING (tenant_id = current_tenant_id());

-- Contatos da campanha
CREATE POLICY "campanha_contatos_select_tenant" ON campanha_contatos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM campanhas c WHERE c.id = campanha_id AND c.tenant_id = current_tenant_id())
  );
CREATE POLICY "campanha_contatos_insert_tenant" ON campanha_contatos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campanhas c WHERE c.id = campanha_id AND c.tenant_id = current_tenant_id())
  );

-- Seed: procedimentos demo (tenant odonto-pro)
INSERT INTO procedimentos (tenant_id, nome, categoria, duracao_min, preco) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Implante Dentário', 'Implantes', 120, 2500.00),
  ('00000000-0000-0000-0000-000000000001', 'Clareamento a Laser', 'Estética', 60, 400.00),
  ('00000000-0000-0000-0000-000000000001', 'Limpeza Profunda', 'Prevenção', 45, 250.00),
  ('00000000-0000-0000-0000-000000000001', 'Tratamento de Canal', 'Endodontia', 90, 800.00)
ON CONFLICT DO NOTHING;
