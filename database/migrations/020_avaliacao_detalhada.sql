-- ============================================================
-- 020_avaliacao_detalhada.sql
-- Extensão da Ficha de Avaliação: procedimentos alinhados no
-- orçamento + modelagem/odontograma de dentes anotada na consulta.
-- Aponta para o segmento odonto (Dra. Luana) sem quebrar estética/dermato.
-- ============================================================

-- Colunas extras na anamnese para refletir a avaliação presencial
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS procedimentos_alinhados jsonb DEFAULT '[]'::jsonb;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS valor_orcado numeric(10,2);
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS valor_entrada numeric(10,2);
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS previsao_inicio date;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS observacoes_orcamento text;

-- Odontograma: modelo de dentes marcado no dia da avaliação (FDI)
CREATE TABLE IF NOT EXISTS odontograma (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  dente       integer NOT NULL,           -- número FDI 11..48
  tratamento  text,                       -- ex: "Corôa", "Canal", "Restauração"
  observacao  text,
  cor         text DEFAULT 'amber',        -- cor no odontograma
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_odontograma_paciente ON odontograma(paciente_id);
CREATE INDEX IF NOT EXISTS idx_odontograma_tenant ON odontograma(tenant_id);

ALTER TABLE odontograma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "odontograma_select_tenant" ON odontograma
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "odontograma_insert_tenant" ON odontograma
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "odontograma_update_tenant" ON odontograma
  FOR UPDATE USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "odontograma_delete_tenant" ON odontograma
  FOR DELETE USING (tenant_id = current_tenant_id() OR is_super_admin());