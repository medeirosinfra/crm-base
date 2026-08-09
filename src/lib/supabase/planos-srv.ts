import { supabaseAdmin } from "./server";

// ============================================================
// Planos de Pagamento via SERVIDOR (service_role)
// Contorna qualquer falha de RLS/JWT do browser ao gerar
// parcelas automaticamente — padrão já comprovado no projeto
// (assinatura, clinicas, whatsapp-connect).
// ============================================================

export type CriarPlanoSrvInput = {
  paciente_id: string | null;
  procedimento_id?: string | null;
  descricao?: string | null;
  valor_total: number;
  entrada?: number;
  num_parcelas: number;
  vencimento: string;
  forma_pagamento?: string | null;
};

/** Cria o plano + todas as parcelas atômicamente (service_role). */
export async function criarPlanoSrv(input: CriarPlanoSrvInput) {
  const entrada = input.entrada ?? 0;
  const numParcelas = Math.max(1, Math.floor(input.num_parcelas) || 1);
  const valorTotal = Number(input.valor_total) || 0;

  // 0) Resolve o tenant_id a partir do paciente (quem são os dados)
  const { data: paciente } = await supabaseAdmin
    .from("pacientes")
    .select("tenant_id")
    .eq("id", input.paciente_id ?? "")
    .maybeSingle();
  const tenantId = (paciente as { tenant_id?: string } | null)?.tenant_id as string;
  if (!input.paciente_id || !tenantId) {
    throw new Error("Paciente não encontrado ou sem clínica vinculada");
  }

  // 1) Plano — atribui tenant_id do paciente (service_role evita RLS)
  const { data: plano, error } = await supabaseAdmin
    .from("planos_pagamento")
    .insert({
      tenant_id: tenantId,
      paciente_id: input.paciente_id,
      procedimento_id: input.procedimento_id ?? null,
      descricao: input.descricao ?? null,
      valor_total: valorTotal,
      entrada,
      num_parcelas: numParcelas,
      vencimento: input.vencimento,
      forma_pagamento: input.forma_pagamento ?? null,
      status: "ativo",
    })
    .select("*")
    .single();

  if (error || !plano) throw new Error(`Erro ao criar plano: ${error?.message ?? "desconhecido"}`);

  // 2) Calcula parcelas (restante dividido; última parcela ajusta arredondamento)
  const restante = Math.max(valorTotal - entrada, 0);
  const valorParcela = Math.round((restante / numParcelas) * 100) / 100;
  const parcelas = Array.from({ length: numParcelas }, (_, i) => {
    const venc = new Date(input.vencimento + "T00:00:00");
    venc.setMonth(venc.getMonth() + i);
    const valor = i === numParcelas - 1 ? restante - valorParcela * (numParcelas - 1) : valorParcela;
    return {
      plano_id: plano.id,
      tenant_id: plano.tenant_id,
      numero: i + 1,
      vencimento: venc.toISOString().slice(0, 10),
      valor: Math.round(valor * 100) / 100,
      pago: 0,
      status: "pendente",
    };
  });

  const { error: pErr } = await supabaseAdmin.from("parcelas").insert(parcelas);
  if (pErr) {
    // Rollback do plano
    await supabaseAdmin.from("planos_pagamento").delete().eq("id", plano.id);
    throw new Error(`Erro ao gerar parcelas (${pErr.code}): ${pErr.message}`);
  }

  return { ...plano, parcelas };
}

// ============================================================
// Pagamento de parcela via SERVIDOR (service_role)
// Atualiza parcelas.pago + registra receita no financeiro.
// Evita qualquer erro de RLS/NaN do browser ao marcar como paga.
// ============================================================

/** Marca entrada como paga e registra a receita da entrada. */
export async function marcarEntradaSrv(planoId: string) {
  const { data: plano, error } = await supabaseAdmin
    .from("planos_pagamento")
    .select("tenant_id, entrada, descricao")
    .eq("id", planoId)
    .single();
  if (error || !plano) throw new Error(`Erro ao buscar plano: ${error?.message ?? "desconhecido"}`);

  const { error: uErr } = await supabaseAdmin
    .from("planos_pagamento")
    .update({ entrada_paga: true })
    .eq("id", planoId);
  if (uErr) throw new Error(`Erro ao registrar entrada: ${uErr.message}`);

  const entradaValor = Number(plano.entrada) || 0;
  if (entradaValor > 0) {
    const { error: tErr } = await supabaseAdmin.from("transacoes_financeiras").insert({
      tenant_id: plano.tenant_id,
      descricao: `Entrada${plano.descricao ? ` — ${plano.descricao}` : ""}`,
      valor: entradaValor,
      tipo: "receita",
      data: new Date().toISOString().slice(0, 10),
      status: "pago",
      paciente_id: null,
    });
    if (tErr) throw new Error(`Erro ao registrar receita da entrada: ${tErr.message}`);
  }

  return { ok: true };
}

/** Registra pagamento (parcial ou total) de uma parcela + receita. */
export async function registrarPagamentoParcelaSrv(parcelaId: string, valorPago: number) {
  const valorInput = Math.round((Number(valorPago) || 0) * 100) / 100;
  if (!valorInput || valorInput <= 0) throw new Error("Valor do pagamento inválido");

  const { data: parcela, error } = await supabaseAdmin
    .from("parcelas")
    .select("plano_id, tenant_id, numero, valor, pago, status")
    .eq("id", parcelaId)
    .single();
  if (error || !parcela) throw new Error(`Erro ao buscar parcela: ${error?.message}`);

  const pagoAtual = Number(parcela.pago) || 0;
  const valor = Number(parcela.valor) || 0;
  const novoPago = Math.min(Math.round((pagoAtual + valorInput) * 100) / 100, valor);
  const status = novoPago >= valor ? "pago" : "parcial";

  const { error: uErr } = await supabaseAdmin
    .from("parcelas")
    .update({ pago: novoPago, status, pago_em: new Date().toISOString().slice(0, 10) })
    .eq("id", parcelaId);
  if (uErr) throw new Error(`Erro ao atualizar parcela: ${uErr.message}`);

  const receitaEstaParcela = Math.round((novoPago - pagoAtual) * 100) / 100;
  if (receitaEstaParcela > 0) {
    const { data: plano } = await supabaseAdmin
      .from("planos_pagamento")
      .select("descricao")
      .eq("id", parcela.plano_id)
      .maybeSingle();
    const { error: tErr } = await supabaseAdmin.from("transacoes_financeiras").insert({
      tenant_id: parcela.tenant_id,
      descricao: `Parcela ${parcela.numero}${plano?.descricao ? ` — ${plano.descricao}` : ""}`,
      valor: receitaEstaParcela,
      tipo: "receita",
      data: new Date().toISOString().slice(0, 10),
      status: "pago",
      paciente_id: null,
    });
    if (tErr) throw new Error(`Erro ao registrar receita: ${tErr.message}`);
  }

  return { ok: true, status };
}