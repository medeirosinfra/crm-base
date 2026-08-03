-- ============================================================
-- 009_admin_automatico.sql — Políticas para admin automático
-- Permite admin da clínica criar funcionários no próprio tenant
-- ============================================================

-- RLS: INSERT em profiles — admin do próprio tenant ou super_admin
DROP POLICY IF EXISTS "profiles_insert_admin_tenant" ON profiles;
CREATE POLICY "profiles_insert_admin_tenant" ON profiles
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR tenant_id = current_tenant_id()
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Funcionários: admin do próprio tenant cria funcionários
DROP POLICY IF EXISTS "funcionarios_insert_tenant" ON funcionarios;
CREATE POLICY "funcionarios_insert_tenant" ON funcionarios
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    OR is_super_admin()
  );
