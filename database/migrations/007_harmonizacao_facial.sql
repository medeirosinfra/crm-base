-- ============================================================
-- Migration 007 - Sistema para Clínica de Harmonização Facial
-- Procedimentos específicos do ramo + profissionais especialistas
-- + anamnese facial (ficha de avaliação)
-- ============================================================

-- 1. Limpa procedimentos genéricos de odonto (troca pelo ramo de harmonização)
DELETE FROM procedimentos WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 2. Procedimentos de Harmonização Facial / Estética Avançada
INSERT INTO procedimentos (tenant_id, nome, categoria, duracao_min, preco) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Toxina Botulínica (Botox) - Região Frontal', 'Toxina Botulínica', 30, 850.00),
  ('00000000-0000-0000-0000-000000000001', 'Toxina Botulínica (Botox) - Glabela', 'Toxina Botulínica', 30, 650.00),
  ('00000000-0000-0000-0000-000000000001', 'Toxina Botulínica (Botox) - Código de Barras', 'Toxina Botulínica', 30, 550.00),
  ('00000000-0000-0000-0000-000000000001', 'Preenchimento Labial', 'Preenchimento', 45, 1200.00),
  ('00000000-0000-0000-0000-000000000001', 'Preenchimento Bigode Chinês', 'Preenchimento', 45, 980.00),
  ('00000000-0000-0000-0000-000000000001', 'Preenchimento Olheiras', 'Preenchimento', 45, 1100.00),
  ('00000000-0000-0000-0000-000000000001', 'Harmonização Facial Completa', 'Harmonização', 120, 3500.00),
  ('00000000-0000-0000-0000-000000000001', 'Fios de PDO (Lifting)', 'Fios de PDO', 90, 1800.00),
  ('00000000-0000-0000-0000-000000000001', 'Bioestimulador de Colágeno (Sculptra)', 'Bioestimuladores', 60, 1600.00),
  ('00000000-0000-0000-0000-000000000001', 'Skinbooster (Hidratação Profunda)', 'Skinbooster', 45, 950.00),
  ('00000000-0000-0000-0000-000000000001', 'Bichectomia (Procedimento)', 'Cirurgia', 90, 2500.00),
  ('00000000-0000-0000-0000-000000000001', 'Limpeza de Pele Profunda', 'Limpeza de Pele', 60, 300.00),
  ('00000000-0000-0000-0000-000000000001', 'Peeling Químico', 'Peeling', 45, 450.00),
  ('00000000-0000-0000-0000-000000000001', 'Microagulhamento', 'Microagulhamento', 60, 550.00),
  ('00000000-0000-0000-0000-000000000001', 'Protocolo de Manutenção (Botox Retorno)', 'Manutenção', 30, 500.00)
ON CONFLICT DO NOTHING;

-- 3. Profissionais especialistas em Harmonização Facial
DELETE FROM profissionais WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
INSERT INTO profissionais (tenant_id, nome, especialidade) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dra. Marina Alves', 'Harmonização Facial'),
  ('00000000-0000-0000-0000-000000000001', 'Dr. Ricardo Souza', 'Botox & Preenchimento'),
  ('00000000-0000-0000-0000-000000000001', 'Dra. Patrícia Lima', 'Bioestimuladores & Fios'),
  ('00000000-0000-0000-0000-000000000001', 'Felipe Martins', 'Biomedicina Estética')
ON CONFLICT DO NOTHING;

-- 4. TABELA: Anamnese facial (ficha de avaliação do paciente)
CREATE TABLE IF NOT EXISTS anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  -- Histórico e saúde
  alergias text,
  medicamentos text,
  doencas_cronicas text,
  cirurgias_previas text,
  gravidez boolean DEFAULT false,
  amamentando boolean DEFAULT false,
  -- Hábitos
  fuma boolean DEFAULT false,
  consome_alcool boolean DEFAULT false,
  exposicao_sol text,
  -- Avaliação facial
  tipo_pele text,                     -- oleosa, seca, mista, normal, sensivel
  queixa_principal text,
  procedimentos_anteriores text,
  expectativas text,
  -- Profissional que avaliou
  profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_anamneses_paciente ON anamneses(paciente_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_tenant ON anamneses(tenant_id);

ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anamneses_select_tenant" ON anamneses
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "anamneses_insert_tenant" ON anamneses
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "anamneses_update_tenant" ON anamneses
  FOR UPDATE USING (tenant_id = current_tenant_id() OR is_super_admin());

-- 5. TABELA: Prontuário / Registros de evolução
CREATE TABLE IF NOT EXISTS prontuario_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  agendamento_id uuid REFERENCES agendamentos(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'evolucao'
              CHECK (tipo IN ('avaliacao','evolucao','procedimento','retorno')),
  titulo text,
  descricao text,
  fotos jsonb DEFAULT '[]',
  profissional_id uuid REFERENCES profissionais(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prontuario_paciente ON prontuario_registros(paciente_id);

ALTER TABLE prontuario_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prontuario_select_tenant" ON prontuario_registros
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "prontuario_insert_tenant" ON prontuario_registros
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());
