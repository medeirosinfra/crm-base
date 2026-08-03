-- ============================================================
-- 013_whatsapp_clinica.sql
-- Número do WhatsApp da clínica (para disparos/bots da própria clínica)
-- A dona/responsável cadastra o número; o sistema usa para os disparos.
-- ============================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_clinica text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_conectado boolean DEFAULT false;