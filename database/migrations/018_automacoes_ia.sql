-- ============================================================
-- 018: Automações & Disparos Agendados com IA (campanhas)
-- Aditivo (só ADD COLUMN / INDEX) — NÃO altera dados existentes.
-- Reusa as tabelas campanhas + campanha_contatos (migration 004).
-- ============================================================

-- Janela de horário do disparo (manhã/tarde/noite) — NULL = hora exata
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS janela text;
-- Hora exata personalizada (quando janela é NULL)
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS hora_agendamento time;

-- Mensagem gerada por IA (vs. digitada manualmente)
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS mensagem_ia boolean DEFAULT false;
-- Personalizar {nome}/variáveis por contato
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS personalizar boolean DEFAULT false;

-- Próximo momento de execução (campo que o scheduler varre)
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS next_due timestamptz;

-- Erro da última tentativa de execução (se falhou)
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS erro text;

-- Índice para o scheduler (busca rápida de disparos vencidos)
CREATE INDEX IF NOT EXISTS idx_campanhas_next_due
  ON campanhas(next_due)
  WHERE status = 'agendada';

-- RLS do Master (super_admin) nas campanhas e nos contatos da campanha,
-- para o painel Master listar disparos de todas as clínicas.
DROP POLICY IF EXISTS campanhas_select_super_admin ON campanhas;
CREATE POLICY campanhas_select_super_admin ON campanhas
  FOR SELECT
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS campanhas_update_super_admin ON campanhas;
CREATE POLICY campanhas_update_super_admin ON campanhas
  FOR UPDATE
  USING (is_super_admin() OR tenant_id = current_tenant_id());

-- NOTIFY para o PostgREST recarregar o schema (senão dá "column not found")
SELECT pg_notify('pgrst', 'reload schema');