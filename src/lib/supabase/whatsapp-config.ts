import { supabase } from "./client";
import { useAuth } from "../auth-context";

// ============================================================
// Service de configuração do WhatsApp da clínica
// A dona/responsável cadastra o número do WhatsApp da clínica.
// Este número será usado para disparos, bots, lembretes etc.
// NÃO usa o número do WAHA master (separado por clínica).
// ============================================================

export interface WhatsappConfig {
  numero: string | null;     // ex: "5511988887777"
  conectado: boolean;
}

/** Busca a config atual do WhatsApp da clínica logada. */
export async function getWhatsappConfig(tenantId: string): Promise<WhatsappConfig | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("whatsapp_clinica, whatsapp_conectado")
    .eq("id", tenantId)
    .single();
  if (error) throw new Error(`Erro ao buscar config WhatsApp: ${error.message}`);
  if (!data) return null;
  return { numero: data.whatsapp_clinica ?? "", conectado: data.whatsapp_conectado ?? false };
}

/** Salva o número do WhatsApp da clínica (liga o flag "em análise"). */
export async function salvarWhatsappClinica(tenantId: string, numero: string): Promise<void> {
  const numeroLimpo = numero.replace(/\D/g, "");
  if (numeroLimpo.length < 10) throw new Error("Número de WhatsApp inválido");
  const { error } = await supabase
    .from("tenants")
    .update({ whatsapp_clinica: numeroLimpo })
    .eq("id", tenantId);
  if (error) throw new Error(`Erro ao salvar número: ${error.message}`);
}

/** Liga/desliga o flag de conexão (placeholder — conexão real futura). */
export async function setWhatsappConectado(tenantId: string, conectado: boolean): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update({ whatsapp_conectado: conectado })
    .eq("id", tenantId);
  if (error) throw new Error(`Erro ao atualizar conexão: ${error.message}`);
}

// Re-export para conveniência no componente
export { useAuth };