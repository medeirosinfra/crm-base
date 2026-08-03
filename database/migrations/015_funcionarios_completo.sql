-- ============================================================
-- 015_funcionarios_completo.sql
-- Campos adicionais do funcionário: CPF, especialidade, observações
-- ============================================================

ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS especialidade text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS observacoes text;