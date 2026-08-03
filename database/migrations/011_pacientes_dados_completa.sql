-- ============================================================
-- 011_pacientes_dados_completos.sql
-- Campos de identificação e contato do paciente: RG e redes sociais
-- ============================================================

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS facebook text;