-- ============================================================
-- 017_prontuario_completo.sql
-- Prontuário completo do paciente: campos estruturados de
-- procedimento, medicação, receita, período e retorno.
-- ============================================================

ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS data_registro date;
ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS procedimento_realizado text;
ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS medicacao text;
ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS receita text;
ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS periodo_inicio date;
ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS periodo_fim date;
ALTER TABLE prontuario_registros ADD COLUMN IF NOT EXISTS retorno_em date;

-- Inclui o tipo "medicacao" no CHECK constraint (antes só tinha os 4 tipos)
ALTER TABLE prontuario_registros DROP CONSTRAINT IF EXISTS prontuario_registros_tipo_check;
ALTER TABLE prontuario_registros ADD CONSTRAINT prontuario_registros_tipo_check
  CHECK (tipo IN ('avaliacao','evolucao','procedimento','retorno','medicacao'));