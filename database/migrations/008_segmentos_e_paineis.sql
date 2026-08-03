-- ============================================================
-- 008_segmentos_e_paineis.sql — Segmentos, Módulos, Funcionários, Setores
-- Base para menus dinâmicos por segmento + gestão da clínica
-- ============================================================

-- 1. Catálogo de segmentos (especialidades)
CREATE TABLE IF NOT EXISTS segmentos (
  codigo     text PRIMARY KEY,
  nome       text NOT NULL UNIQUE,
  descricao  text,
  ativo      boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Módulos disponíveis no produto
CREATE TABLE IF NOT EXISTS modulos (
  codigo          text PRIMARY KEY,
  nome            text NOT NULL,
  descricao       text,
  caminho         text,
  icone           text,
  exigencia_cargo text,
  ativo           boolean DEFAULT true,
  ordem           integer DEFAULT 0
);

-- 3. Quais módulos cada segmento ativa
CREATE TABLE IF NOT EXISTS segmento_modulos (
  segmento_codigo text NOT NULL REFERENCES segmentos(codigo) ON DELETE CASCADE,
  modulo_codigo   text NOT NULL REFERENCES modulos(codigo) ON DELETE CASCADE,
  ordem           integer DEFAULT 0,
  PRIMARY KEY (segmento_codigo, modulo_codigo)
);

-- 4. Setores da clínica (recepção, sala procedimentos, etc.)
CREATE TABLE IF NOT EXISTS setores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  descricao   text,
  ativo       boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. Funcionários (login próprio + agenda individual)
CREATE TABLE IF NOT EXISTS funcionarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  nome        text NOT NULL,
  cargo       text NOT NULL DEFAULT 'staff'
              CHECK (cargo IN ('admin','gerente','financeiro','staff')),
  setor_id    uuid REFERENCES setores(id) ON DELETE SET NULL,
  telefone    text,
  email       text,
  ativo       boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant ON funcionarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_profile ON funcionarios(profile_id);
CREATE INDEX IF NOT EXISTS idx_setores_tenant ON setores(tenant_id);

-- RLS
ALTER TABLE segmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE segmento_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;

-- Catálogo: leitura para todos logados
CREATE POLICY "segmentos_select_all" ON segmentos FOR SELECT USING (true);
CREATE POLICY "modulos_select_all" ON modulos FOR SELECT USING (true);
CREATE POLICY "segmento_modulos_select_all" ON segmento_modulos FOR SELECT USING (true);

-- Funcionários/Setores: RLS por tenant + super_admin vê tudo
CREATE POLICY "funcionarios_select_tenant" ON funcionarios
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "funcionarios_insert_tenant" ON funcionarios
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "funcionarios_update_tenant" ON funcionarios
  FOR UPDATE USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "setores_select_tenant" ON setores
  FOR SELECT USING (tenant_id = current_tenant_id() OR is_super_admin());
CREATE POLICY "setores_insert_tenant" ON setores
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin());

-- ===== SEED =====
INSERT INTO segmentos (codigo, nome, descricao) VALUES
  ('estetica', 'Harmonização Facial', 'Clínicas de harmonização facial e estética avançada'),
  ('odonto', 'Odontologia', 'Consultórios e clínicas odontológicas'),
  ('dermato', 'Dermatologia', 'Dermatologia e estética médica'),
  ('fisio', 'Fisioterapia', 'Clínicas de fisioterapia e reabilitação'),
  ('psi', 'Psicologia', 'Consultórios de psicologia')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO modulos (codigo, nome, caminho, icone, exigencia_cargo, ordem) VALUES
  ('dashboard',     'Dashboard',          '/',                    'layout-dashboard',   'staff',      10),
  ('agenda',        'Agenda',             '/agenda',              'calendar-days',      'staff',      20),
  ('pacientes',     'Pacientes',          '/pacientes',           'users',              'staff',      30),
  ('anamnese',      'Anamnese & Avaliação', '/anamnese',          'clipboard-list',     'staff',      40),
  ('contatos',      'Contatos & Leads',   '/contatos',            'users-2',            'staff',      50),
  ('procedimentos', 'Procedimentos',      '/procedimentos',       'scissors',           'staff',      60),
  ('campanhas',     'Campanhas',          '/campanhas',           'megaphone',          'gerente',    70),
  ('disparador',    'Disparador WhatsApp','/disparador',          'message-square-more','staff',      80),
  ('financeiro',    'Financeiro',         '/financeiro',          'wallet',             'financeiro', 90),
  ('relatorios',    'Relatórios',         '/relatorios',          'bar-chart-3',        'gerente',    100),
  ('white_label',   'White-Label',        '/master/white-label',  'palette',            'super_admin', 110),
  ('automacoes',    'Automações & IA',    '/master/automacoes',   'bot',                'super_admin', 120),
  ('clinicas',      'Gestão de Clínicas', '/master/clinicas',     'stethoscope',        'super_admin', 130)
ON CONFLICT (codigo) DO NOTHING;

-- Harmonização Facial: com anamnese
INSERT INTO segmento_modulos (segmento_codigo, modulo_codigo, ordem) VALUES
  ('estetica', 'dashboard', 10),
  ('estetica', 'agenda', 20),
  ('estetica', 'pacientes', 30),
  ('estetica', 'anamnese', 40),
  ('estetica', 'procedimentos', 50),
  ('estetica', 'contatos', 60),
  ('estetica', 'campanhas', 70),
  ('estetica', 'disparador', 80),
  ('estetica', 'financeiro', 90),
  ('estetica', 'relatorios', 100)
ON CONFLICT (segmento_codigo, modulo_codigo) DO NOTHING;

-- Odontologia: sem anamnese facial
INSERT INTO segmento_modulos (segmento_codigo, modulo_codigo, ordem) VALUES
  ('odonto', 'dashboard', 10),
  ('odonto', 'agenda', 20),
  ('odonto', 'pacientes', 30),
  ('odonto', 'procedimentos', 40),
  ('odonto', 'contatos', 50),
  ('odonto', 'campanhas', 60),
  ('odonto', 'disparador', 70),
  ('odonto', 'financeiro', 80),
  ('odonto', 'relatorios', 90)
ON CONFLICT (segmento_codigo, modulo_codigo) DO NOTHING;

-- Dermatologia: com anamnese (pele)
INSERT INTO segmento_modulos (segmento_codigo, modulo_codigo, ordem) VALUES
  ('dermato', 'dashboard', 10),
  ('dermato', 'agenda', 20),
  ('dermato', 'pacientes', 30),
  ('dermato', 'anamnese', 40),
  ('dermato', 'procedimentos', 50),
  ('dermato', 'contatos', 60),
  ('dermato', 'campanhas', 70),
  ('dermato', 'disparador', 80),
  ('dermato', 'financeiro', 90),
  ('dermato', 'relatorios', 100)
ON CONFLICT (segmento_codigo, modulo_codigo) DO NOTHING;

-- Fisioterapia
INSERT INTO segmento_modulos (segmento_codigo, modulo_codigo, ordem) VALUES
  ('fisio', 'dashboard', 10),
  ('fisio', 'agenda', 20),
  ('fisio', 'pacientes', 30),
  ('fisio', 'procedimentos', 40),
  ('fisio', 'contatos', 50),
  ('fisio', 'campanhas', 60),
  ('fisio', 'disparador', 70),
  ('fisio', 'financeiro', 80),
  ('fisio', 'relatorios', 90)
ON CONFLICT (segmento_codigo, modulo_codigo) DO NOTHING;

-- Psicologia
INSERT INTO segmento_modulos (segmento_codigo, modulo_codigo, ordem) VALUES
  ('psi', 'dashboard', 10),
  ('psi', 'agenda', 20),
  ('psi', 'pacientes', 30),
  ('psi', 'procedimentos', 40),
  ('psi', 'contatos', 50),
  ('psi', 'campanhas', 60),
  ('psi', 'disparador', 70),
  ('psi', 'financeiro', 80),
  ('psi', 'relatorios', 90)
ON CONFLICT (segmento_codigo, modulo_codigo) DO NOTHING;

-- 6. Tenant demo odonto-pro recebe funcionários e setores
INSERT INTO setores (tenant_id, nome) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Recepção'),
  ('00000000-0000-0000-0000-000000000001', 'Sala de Procedimentos')
ON CONFLICT DO NOTHING;
