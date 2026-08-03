import { supabaseAdmin } from "./server";
import { sendWhatsAppText } from "@/lib/waha";

// ============================================================
// Disparo em massa (master) — envia para contatos via WAHA
// Usa service_role no servidor (server function) para evitar
// expor a API key no browser.
// ============================================================

const db = supabaseAdmin;

export interface DisparoResultado {
  enviados: number;
  falhas: number;
  detalhes: { chatId: string; ok: boolean; erro?: string }[];
}

/**
 * Envia uma mensagem para uma lista de telefones via WAHA.
 * Usado pelo master para disparos em massa.
 */
export async function dispararMensagens(
  session: string,
  telefones: string[],
  mensagem: string,
  personalizar = false,
): Promise<DisparoResultado> {
  const resultados: DisparoResultado["detalhes"] = [];
  let enviados = 0;
  let falhas = 0;

  for (const telefone of telefones) {
    const digits = telefone.replace(/\D/g, "");
    if (digits.length < 10) {
      falhas++;
      resultados.push({ chatId: telefone, ok: false, erro: "telefone inválido" });
      continue;
    }

    try {
      // Personalização simples: {nome} não é resolvido aqui (requer lookup)
      await sendWhatsAppText(session, `${digits}@c.us`, mensagem);
      enviados++;
      resultados.push({ chatId: digits, ok: true });
    } catch (e) {
      falhas++;
      resultados.push({ chatId: digits, ok: false, erro: String(e) });
    }
  }

  return { enviados, falhas, detalhes: resultados };
}

/** Busca contatos/pacientes de todas as clínicas (para selecionar no disparo). */
export async function listarContatosParaDisparo(): Promise<{ telefone: string | null; nome: string; clinica: string }[]> {
  const { data: pacientes } = await db.from("pacientes").select("nome, telefone, tenant_id");
  const { data: tenants } = await db.from("tenants").select("id, nome");

  const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t.nome]));

  return (pacientes ?? [])
    .filter((p) => p.telefone)
    .map((p) => ({
      telefone: p.telefone,
      nome: p.nome,
      clinica: tenantMap.get(p.tenant_id) ?? "—",
    }));
}
