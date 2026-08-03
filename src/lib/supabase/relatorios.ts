import { supabase } from "./client";

// ============================================================
// Relatórios & BI — dados agregados reais
// Usa supabaseAdmin (service_role) para o painel master.
// ============================================================

const db = supabase;

export interface FaturamentoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ProcedimentoRelatorio {
  nome: string;
  quantidade: number;
  receita: number;
}

export interface PacientesPorMes {
  mes: string;
  total: number;
}

export interface AgendamentoPorStatus {
  status: string;
  total: number;
}

/** Faturamento mensal (receitas × despesas) para DRE resumido. */
export async function getFaturamentoMensal(meses = 6): Promise<FaturamentoMensal[]> {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - (meses - 1));
  limite.setDate(1);

  const { data, error } = await db
    .from("transacoes_financeiras")
    .select("valor, tipo, data")
    .gte("data", limite.toISOString().slice(0, 10));

  if (error) throw new Error(`Erro ao buscar faturamento: ${error.message}`);

  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (meses - 1));
  inicio.setDate(1);

  const porMes = new Map<string, { receitas: number; despesas: number }>();
  for (const t of data ?? []) {
    const chave = t.data.slice(0, 7);
    if (!porMes.has(chave)) porMes.set(chave, { receitas: 0, despesas: 0 });
    const e = porMes.get(chave)!;
    if (t.tipo === "receita") e.receitas += Number(t.valor);
    else e.despesas += Math.abs(Number(t.valor));
  }

  const final: FaturamentoMensal[] = [];
  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio);
    d.setMonth(inicio.getMonth() + i);
    const chave = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("pt-BR", { month: "short" });
    const e = porMes.get(chave) ?? { receitas: 0, despesas: 0 };
    final.push({
      mes: label,
      receitas: e.receitas,
      despesas: e.despesas,
      saldo: e.receitas - e.despesas,
    });
  }
  return final;
}

/** Top procedimentos realizados (por agendamentos concluídos). */
export async function getTopProcedimentos(limite = 5): Promise<ProcedimentoRelatorio[]> {
  const { data, error } = await db
    .from("agendamentos")
    .select("procedimento:procedimentos(nome), valor")
    .eq("status", "concluido");

  if (error) throw new Error(`Erro ao buscar procedimentos: ${error.message}`);

  const porNome = new Map<string, { quantidade: number; receita: number }>();
  for (const a of data ?? []) {
    const nome = (a.procedimento as { nome?: string } | null)?.nome ?? "Não informado";
    if (!porNome.has(nome)) porNome.set(nome, { quantidade: 0, receita: 0 });
    const e = porNome.get(nome)!;
    e.quantidade += 1;
    e.receita += Number(a.valor ?? 0);
  }

  return [...porNome.entries()]
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limite);
}

/** Novos pacientes por mês. */
export async function getNovosPacientesPorMes(meses = 6): Promise<PacientesPorMes[]> {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - (meses - 1));
  limite.setDate(1);

  const { data, error } = await db
    .from("pacientes")
    .select("created_at")
    .gte("created_at", limite.toISOString());

  if (error) throw new Error(`Erro ao buscar pacientes: ${error.message}`);

  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (meses - 1));
  inicio.setDate(1);

  const porMes = new Map<string, number>();
  for (const p of data ?? []) {
    const chave = p.created_at.slice(0, 7);
    porMes.set(chave, (porMes.get(chave) ?? 0) + 1);
  }

  const final: PacientesPorMes[] = [];
  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio);
    d.setMonth(inicio.getMonth() + i);
    const chave = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("pt-BR", { month: "short" });
    final.push({ mes: label, total: porMes.get(chave) ?? 0 });
  }
  return final;
}

/** Agendamentos por status (funil de conversão). */
export async function getAgendamentosPorStatus(): Promise<AgendamentoPorStatus[]> {
  const { data, error } = await db.from("agendamentos").select("status");

  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);

  const labels: Record<string, string> = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const porStatus = new Map<string, number>();
  for (const a of data ?? []) {
    const label = labels[a.status] ?? a.status;
    porStatus.set(label, (porStatus.get(label) ?? 0) + 1);
  }

  return [...porStatus.entries()]
    .map(([status, total]) => ({ status, total }))
    .sort((a, b) => b.total - a.total);
}

/** Totais agregados (para cards de resumo do relatório). */
export async function getTotaisRelatorio(): Promise<{
  receitas: number;
  despesas: number;
  saldo: number;
  agendamentos: number;
  pacientes: number;
}> {
  const { data: transacoes } = await db.from("transacoes_financeiras").select("valor, tipo");
  const { count: agendamentos } = await db
    .from("agendamentos")
    .select("id", { count: "exact", head: true });
  const { count: pacientes } = await db
    .from("pacientes")
    .select("id", { count: "exact", head: true });

  const receitas = (transacoes ?? [])
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + Number(t.valor), 0);
  const despesas = (transacoes ?? [])
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + Math.abs(Number(t.valor)), 0);

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    agendamentos: agendamentos ?? 0,
    pacientes: pacientes ?? 0,
  };
}
