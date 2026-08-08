-- ============================================================
-- 019: Subdomínio por cliente (tenant)
-- ADITIVO — adiciona campo novo `subdominio` à tabela tenants.
-- NÃO altera `slug`, nem dados de nenhuma tabela existente.
-- O tenant da Luana ganha o subdomínio 'draluana' (só o campo novo).
-- ============================================================

-- Campo novo de subdomínio (o slug continua intacto)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdominio text;

-- Índice único por subdomínio (apenas onde preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdominio
  ON tenants(subdominio)
  WHERE subdominio IS NOT NULL;

-- Define o subdomínio da Dra. Luana (campo novo; nada mais muda)
UPDATE tenants SET subdominio = 'draluana' WHERE slug = 'Luanamenos' AND subdominio IS NULL;

-- NOTIFY para o PostgREST recarregar o schema
SELECT pg_notify('pgrst', 'reload schema');