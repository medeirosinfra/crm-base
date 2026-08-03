-- ============================================================
-- 016_lembretes_vencimento.sql
-- Config de lembretes de vencimento de parcelas via WhatsApp
-- Cada tenant define se envia lembrete e quantos dias antes.
-- ============================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lembrete_vencimento boolean DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lembrete_dias_antes integer DEFAULT 3;