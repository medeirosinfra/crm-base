-- ============================================================
-- Migration 005 - Modelo de dados operacional para clínicas
-- Relaciona agendamento a procedimento/profissional, enriquece
-- paciente e vincula transação a paciente/agendamento.
-- ============================================================

-- 1. Profissionais (para agenda, relatórios e escalas)
CREATE TABLE IF NOT EXISTS profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  especialidade text,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profissionais_tenant ON profissionais(tenant_id);
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profissionais_select_tenant" ON profissionais
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "profissionais_insert_tenant" ON profissionais
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "profissionais_update_tenant" ON profissionais
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- 2. Agendamento ganha procedimento, profissional e valor
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS procedimento_id uuid REFERENCES procedimentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS valor numeric(10,2);
CREATE INDEX IF NOT EXISTS idx_agendamentos_procedimento ON agendamentos(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);

-- 3. Paciente ganha campos clínicos (base da página de detalhe e anamnese futura)
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS ultima_consulta date;

-- 4. Vincula transação a paciente/agendamento (gastos do paciente, DRE real)
ALTER TABLE transacoes_financeiras
  ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agendamento_id uuid REFERENCES agendamentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transacoes_paciente ON transacoes_financeiras(paciente_id);

-- 5. Seed: profissionais demo
INSERT INTO profissionais (tenant_id, nome, especialidade) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dr. Carlos Almeida', 'Odontologia'),
  ('00000000-0000-0000-0000-000000000001', 'Dra. Fernanda Lima', 'Estética')
ON CONFLICT DO NOTHING;

-- 6. Vincula procedimentos aos agendamentos demo (para relatórios reais)
UPDATE agendamentos a SET procedimento_id = p.id, valor = p.preco
FROM procedimentos p
WHERE p.tenant_id = a.tenant_id
  AND a.procedimento_id IS NULL
  AND p.nome IN ('Implante Dentário', 'Clareamento a Laser');
