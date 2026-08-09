import { supabase } from "./client";

// ============================================================
// Service de Pagamentos Parcelados (Planos de Pagamento)
// Plano → N parcelas. Cada parcela controla pago/parcial/restante.
// ============================================================

export interface PlanoPagamento {
  id: string;
  tenant_id: string;
  paciente_id: string | null;
  procedimento_id: string | null;
  descricao: string | null;
  valor_total: number;
  entrada: number;
  num_parcelas: number;
  vencimento: string;
  forma_pagamento: string | null;
  status: "ativo" | "quitado" | "cancelado";
  assinatura_data: string | null;
  assinatura_nome: string | null;
  assinatura_em: string | null;
  entrada_paga: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parcela {
  id: string;
  plano_id: string;
  tenant_id: string;
  numero: number;
  vencimento: string;
  valor: number;
  pago: number;
  status: "pendente" | "pago" | "parcial" | "atrasado" | "cancelado";
  pago_em: string | null;
  created_at: string;
}

export interface PlanoComParcelas extends PlanoPagamento {
  parcelas: Parcela[];
  paciente_nome?: string | null;
  procedimento_nome?: string | null;
  total_pago: number;
  restante: number;
}

/** Lista planos com parcelas e dados do paciente. */
export async function listPlanosPagamento(): Promise<PlanoComParcelas[]> {
  const { data: planos, error } = await supabase
    .from("planos_pagamento")
    .select("*, pacientes(nome), procedimentos(nome)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar planos: ${error.message}`);

  const { data: parcelas } = await supabase.from("parcelas").select("*");

  return (planos ?? []).map((p) => {
    const pags = (parcelas ?? []).filter((x) => x.plano_id === p.id);
    const totalPago = pags.reduce((s, x) => s + Number(x.pago), 0);
    return {
      ...p,
      parcelas: pags.sort((a, b) => a.numero - b.numero),
      paciente_nome: (p.pacientes as { nome?: string } | null)?.nome ?? null,
      procedimento_nome: (p.procedimentos as { nome?: string } | null)?.nome ?? null,
      total_pago: totalPago,
      restante: Math.max(Number(p.valor_total) - totalPago, 0),
    };
  });
}

/**
 * Cria um plano de pagamento gerando as parcelas automaticamente.
 * Usa a rota do SERVIDOR (/api/planos/criar) com service_role —
 * contorna qualquer falha de RLS/JWT do browser ao inserir parcelas.
 */
export async function criarPlanoPagamento(input: {
  paciente_id: string | null;
  procedimento_id?: string | null;
  descricao?: string | null;
  valor_total: number;
  entrada?: number;
  num_parcelas: number;
  vencimento: string;
  forma_pagamento?: string | null;
}): Promise<PlanoComParcelas> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${base}/api/planos/criar`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.erro ?? `Erro ao criar plano (${res.status})`);
  }

  // Monta o retorno no mesmo formato de antes (lista de parcelas salvas no banco)
  const { id } = data as { id: string };
  const { data: plano } = await supabase
    .from("planos_pagamento")
    .select("*")
    .eq("id", id)
    .single();
  if (!plano) throw new Error("Plano criado mas não localizado");

  const { data: parcelas } = await supabase.from("parcelas").select("*").eq("plano_id", id);
  const arr = (parcelas ?? []) as Parcela[];

  return {
    ...(plano as unknown as PlanoPagamento),
    parcelas: arr,
    paciente_nome: null,
    procedimento_nome: null,
    total_pago: arr.reduce((s, p) => s + Number(p.pago), 0),
    restante: Math.max(Number(plano.valor_total) - arr.reduce((s, p) => s + Number(p.pago), 0), 0),
  };
}

/**
 * Registra um pagamento (parcial ou total) de uma parcela.
 * Usa a rota do SERVIDOR (/api/planos/pagar-parcela) com service_role —
 * atualiza parcelas.pago + registra a receita, sem depender de RLS/JWT.
 */
export async function registrarPagamentoParcela(
  parcelaId: string,
  valorPago: number,
): Promise<void> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${base}/api/planos/pagar-parcela`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ parcela_id: parcelaId, valor: Number(valorPago) || 0 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.erro ?? `Erro ao registrar pagamento (${res.status})`);
}

/** Registra a receita no financeiro. */
async function registrarReceita(tenantId: string, valor: number, parcela: Parcela) {
  const { data: plano } = await supabase
    .from("planos_pagamento")
    .select("descricao")
    .eq("id", parcela.plano_id)
    .single();

  await supabase.from("transacoes_financeiras").insert({
    tenant_id: tenantId,
    descricao: `Parcela ${parcela.numero}${plano?.descricao ? ` — ${plano.descricao}` : ""}`,
    valor,
    tipo: "receita",
    data: new Date().toISOString().slice(0, 10),
    status: "pago",
    paciente_id: null,
  });
}

/** Registra a receita da ENTRADA no financeiro. */
async function registrarReceitaEntrada(tenantId: string, valor: number, planoId: string) {
  const { data: plano } = await supabase
    .from("planos_pagamento")
    .select("descricao")
    .eq("id", planoId)
    .single();

  await supabase.from("transacoes_financeiras").insert({
    tenant_id: tenantId,
    descricao: `Entrada${plano?.descricao ? ` — ${plano.descricao}` : ""}`,
    valor,
    tipo: "receita",
    data: new Date().toISOString().slice(0, 10),
    status: "pago",
    paciente_id: null,
  });
}

/** Marca a entrada de um plano como paga e registra a receita no financeiro. */
export async function marcarEntradaPaga(planoId: string): Promise<void> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${base}/api/planos/pagar-entrada`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ plano_id: planoId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.erro ?? `Erro ao registrar entrada (${res.status})`);
}

/** Cancela um plano (e suas parcelas pendentes). */
export async function cancelarPlano(id: string): Promise<void> {
  const { error } = await supabase
    .from("planos_pagamento")
    .update({ status: "cancelado" })
    .eq("id", id);
  if (error) throw new Error(`Erro ao cancelar plano: ${error.message}`);
}

/** Exclui permanentemente um plano de pagamento e suas parcelas. */
export async function deletarPlano(id: string): Promise<void> {
  const { error } = await supabase
    .from("planos_pagamento")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Erro ao excluir plano: ${error.message}`);
}
