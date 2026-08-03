import { supabase } from "./client";

// ============================================================
// Service de Lembretes de Vencimento (parcelas via WhatsApp)
// PREPARADO: gera os avisos das parcelas a vencer. O envio real
// será feito quando a clínica conectar seu próprio número (tela /whatsapp).
// ============================================================

export interface LembreteVencimento {
  ativo: boolean;
  diasAntes: number;
}

export interface ParcelaAVencer {
  parcela_id: string;
  paciente_nome: string | null;
  telefone_paciente: string | null;
  descricao: string | null;
  numero: number;
  vencimento: string;
  valor: number;
  restante: number;
}

/** Busca a config de lembretes da clínica logada. */
export async function getConfigLembrete(tenantId: string): Promise<LembreteVencimento> {
  const { data, error } = await supabase
    .from("tenants")
    .select("lembrete_vencimento, lembrete_dias_antes")
    .eq("id", tenantId)
    .single();
  if (error) throw new Error(`Erro ao buscar config de lembrete: ${error.message}`);
  return { ativo: data?.lembrete_vencimento ?? false, diasAntes: data?.lembrete_dias_antes ?? 3 };
}

/** Salva a config de lembretes. */
export async function salvarConfigLembrete(tenantId: string, ativo: boolean, diasAntes: number): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update({ lembrete_vencimento: ativo, lembrete_dias_antes: Math.max(1, Math.min(30, diasAntes)) })
    .eq("id", tenantId);
  if (error) throw new Error(`Erro ao salvar config de lembrete: ${error.message}`);
}

/**
 * Lista as parcelas que vencem nos próximos N dias e ainda não foram pagas.
 * (usado para gerar o lembrete / mostrar no painel)
 */
export async function listarParcelasAVencer(tenantId: string, dias: number): Promise<ParcelaAVencer[]> {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);

  const isoHoje = hoje.toISOString().slice(0, 10);
  const isoLimite = limite.toISOString().slice(0, 10);

  // Busca planos do tenant com paciente e parcelas
  const { data: planos, error } = await supabase
    .from("planos_pagamento")
    .select("*, pacientes(nome, telefone)")
    .eq("tenant_id", tenantId);

  if (error) throw new Error(`Erro ao buscar planos: ${error.message}`);

  const { data: parcelas, error: pErr } = await supabase
    .from("parcelas")
    .select("*")
    .eq("tenant_id", tenantId);

  if (pErr) throw new Error(`Erro ao buscar parcelas: ${pErr.message}`);

  const resultado: ParcelaAVencer[] = [];

  for (const plano of planos ?? []) {
    const paciente = plano.pacientes as { nome?: string; telefone?: string } | null;
    for (const par of parcelas ?? []) {
      if (par.plano_id !== plano.id) continue;
      if (par.status === "pago" || par.status === "cancelado") continue;
      const venc = String(par.vencimento);
      if (venc < isoHoje) continue; // atrasadas (poderia incluir, mas aqui foco nas a vencer)
      if (venc > isoLimite) continue;
      const restante = Number(par.valor) - Number(par.pago);
      if (restante <= 0) continue;

      resultado.push({
        parcela_id: par.id,
        paciente_nome: paciente?.nome ?? null,
        telefone_paciente: paciente?.telefone ?? null,
        descricao: plano.descricao ?? "Plano",
        numero: par.numero,
        vencimento: venc,
        valor: Number(par.valor),
        restante,
      });
    }
  }

  return resultado.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

/**
 * Gera o texto do lembrete que seria enviado via WhatsApp.
 * (Pronto para envio quando houver número conectado.)
 */
export function textoLembrete(p: ParcelaAVencer): string {
  const data = new Date(p.vencimento + "T00:00:00").toLocaleDateString("pt-BR");
  const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  return `Olá, ${p.paciente_nome ?? ""}! 👋 Lembrete da clínica:\n\n` +
    `Sua parcela ${p.numero} do ${p.descricao} vence em ${data}.\n` +
    `Valor: ${brl(p.valor)} (restante: ${brl(p.restante)}).\n\n` +
    `Qualquer dúvida, estamos à disposição! 😊`;
}
