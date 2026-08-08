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

/** Cria um plano de pagamento gerando as parcelas automaticamente. */
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
  const entrada = input.entrada ?? 0;
  const numParcelas = Math.max(1, input.num_parcelas);

  // Insere o plano
  const { data: plano, error } = await supabase
    .from("planos_pagamento")
    .insert({
      paciente_id: input.paciente_id,
      procedimento_id: input.procedimento_id ?? null,
      descricao: input.descricao ?? null,
      valor_total: input.valor_total,
      entrada,
      num_parcelas: numParcelas,
      vencimento: input.vencimento,
      forma_pagamento: input.forma_pagamento ?? null,
      status: "ativo",
    })
    .select()
    .single();

  if (error || !plano) throw new Error(`Erro ao criar plano: ${error?.message ?? "desconhecido"}`);

  // Calcula o valor de cada parcela (o restante dividido pelo nº de parcelas)
  const restante = Math.max(Number(input.valor_total) - entrada, 0);
  const valorParcela = Math.round((restante / numParcelas) * 100) / 100;

  // Ajusta a última parcela para a diferença de arredondamento
  const parcelas = Array.from({ length: numParcelas }, (_, i) => {
    const venc = new Date(input.vencimento);
    venc.setMonth(venc.getMonth() + i);
    const valor = i === numParcelas - 1 ? restante - valorParcela * (numParcelas - 1) : valorParcela;
    return {
      plano_id: plano.id,
      tenant_id: plano.tenant_id,
      numero: i + 1,
      vencimento: venc.toISOString().slice(0, 10),
      valor: Math.round(valor * 100) / 100,
      pago: 0,
      status: "pendente" as const,
    };
  });

  const { error: pErr } = await supabase.from("parcelas").insert(parcelas);
  if (pErr) {
    // Rollback do plano
    await supabase.from("planos_pagamento").delete().eq("id", plano.id);
    throw new Error(`Erro ao gerar parcelas: ${pErr.message}`);
  }

  return { ...plano, parcelas, paciente_nome: null, procedimento_nome: null, total_pago: 0, restante };
}

/** Registra um pagamento (parcial ou total) de uma parcela. */
export async function registrarPagamentoParcela(
  parcelaId: string,
  valorPago: number,
): Promise<void> {
  if (!valorPago || valorPago <= 0) throw new Error("Valor do pagamento inválido");

  const { data: parcela, error } = await supabase
    .from("parcelas")
    .select("*")
    .eq("id", parcelaId)
    .single();
  if (error || !parcela) throw new Error(`Erro ao buscar parcela: ${error?.message}`);

  const valor = Number(parcela.valor);
  const novoPago = Math.min(Number(parcela.pago) + valorPago, valor);
  const status = novoPago >= valor ? "pago" : "parcial";

  const { error: uErr } = await supabase
    .from("parcelas")
    .update({ pago: novoPago, status, pago_em: new Date().toISOString().slice(0, 10) })
    .eq("id", parcelaId);
  if (uErr) throw new Error(`Erro ao registrar pagamento: ${uErr.message}`);

  // Se a parcela foi totalmente paga, registra transação financeira (receita)
  if (status === "pago") {
    await registrarReceita(parcela.tenant_id, valorPago > 0 ? novoPago - Number(parcela.pago) : novoPago, parcela);
  } else if (valorPago > 0) {
    await registrarReceita(parcela.tenant_id, valorPago, parcela);
  }
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

/** Cancela um plano (e suas parcelas pendentes). */
export async function cancelarPlano(id: string): Promise<void> {
  const { error } = await supabase
    .from("planos_pagamento")
    .update({ status: "cancelado" })
    .eq("id", id);
  if (error) throw new Error(`Erro ao cancelar plano: ${error.message}`);
}
