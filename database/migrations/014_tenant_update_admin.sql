-- ============================================================
-- 014_tenant_update_admin.sql
-- Permite o admin da PRÓPRIA clínica atualizar o tenant
-- (ex: cadastrar o número do WhatsApp da clínica).
-- Antes só super_admin/service_role podiam atualizar tenants.
-- ============================================================

DROP POLICY IF EXISTS "tenants_admin_update" ON tenants;
CREATE POLICY "tenants_admin_update" ON tenants
  FOR UPDATE USING (
    id = current_tenant_id()                    -- admin do próprio tenant
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.cargo = 'super_admin')
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );