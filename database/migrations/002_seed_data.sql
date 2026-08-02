-- ============================================================
-- Migration 002 - Seed de dados de demonstração
-- Cria tenants de exemplo e um super_admin
-- ============================================================

-- Tenants de demonstração (clínicas white-label)
INSERT INTO tenants (id, slug, nome, descricao, especialidade, status, cor_primaria, plano, mrr, waha_sessao, whatsapp_sessions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'odonto-pro', 'Odonto Pró Campinas', 'Utilizando funil de Implantes e Ortodontia integrado ao disparador de confirmações de consulta.', 'Odontologia', 'ativa', '#0ea5e9', 'pro', 497.00, 'crmprincipal', 2),
  ('00000000-0000-0000-0000-000000000002', 'slim-body', 'Clínica Slim Body', 'Estética avançada com foco em redução de medidas.', 'Estética Avançada', 'ativa', '#f43f5e', 'pro', 349.00, NULL, 1),
  ('00000000-0000-0000-0000-000000000003', 'derma-plus', 'Derma Plus', 'Dermatologia clínica e estética.', 'Dermatologia', 'trial', '#8b5cf6', 'starter', 0, NULL, 0)
ON CONFLICT (slug) DO NOTHING;

-- Pacientes de exemplo para o tenant 1 (odonto-pro)
INSERT INTO pacientes (tenant_id, nome, telefone, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Maria Silva', '55119991234567', 'maria@gmail.com'),
  ('00000000-0000-0000-0000-000000000001', 'João Santos', '55119887654321', 'joao@hotmail.com'),
  ('00000000-0000-0000-0000-000000000002', 'Ana Oliveira', '5511977778899', 'ana@gmail.com'),
  ('00000000-0000-0000-0000-000000000002', 'Carlos Pereira', '5511966665544', 'carlos@gmail.com')
ON CONFLICT DO NOTHING;

-- Agendamentos de exemplo
INSERT INTO agendamentos (tenant_id, paciente_id, data, tipo, status) VALUES
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM pacientes WHERE nome='Maria Silva'), now() + interval '1 day', 'consulta', 'agendado'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM pacientes WHERE nome='João Santos'), now() + interval '2 days', 'retorno', 'agendado'),
  ('00000000-0000-0000-0000-000000000002', (SELECT id FROM pacientes WHERE nome='Ana Oliveira'), now() + interval '1 day', 'avaliacao', 'agendado')
ON CONFLICT DO NOTHING;
