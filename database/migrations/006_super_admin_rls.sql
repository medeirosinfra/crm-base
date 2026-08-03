-- ============================================================
-- Migration 006 - Super admin vê dados de todas as clínicas
-- As políticas atuais usam current_tenant_id() que retorna NULL
-- para super_admin (tenant_id NULL) → ele via zero.
-- Nova política: super_admin (cargo no profiles) vê tudo.
-- ============================================================

-- Helper: o usuário é super_admin?
-- SECURITY DEFINER evita recursão (a política de profiles chama esta função,
-- e esta função consulta profiles — sem security definer causa stack depth).
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND cargo = 'super_admin'
  );
$$;

-- Permite leitura para super_admin em cada tabela de negócio
DROP POLICY IF EXISTS "pacientes_select_own_tenant" ON pacientes;
CREATE POLICY "pacientes_select_tenant" ON pacientes
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "agendamentos_select_own_tenant" ON agendamentos;
CREATE POLICY "agendamentos_select_tenant" ON agendamentos
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "procedimentos_select_tenant" ON procedimentos;
CREATE POLICY "procedimentos_select_tenant" ON procedimentos
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "campanhas_select_tenant" ON campanhas;
CREATE POLICY "campanhas_select_tenant" ON campanhas
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "transacoes_select_tenant" ON transacoes_financeiras;
CREATE POLICY "transacoes_select_tenant" ON transacoes_financeiras
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "produtos_select_tenant" ON produtos;
CREATE POLICY "produtos_select_tenant" ON produtos
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "profissionais_select_tenant" ON profissionais;
CREATE POLICY "profissionais_select_tenant" ON profissionais
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "categorias_select_tenant" ON categorias_financeiras;
CREATE POLICY "categorias_select_tenant" ON categorias_financeiras
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());

-- O perfil próprio continua visível
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_super_admin());
