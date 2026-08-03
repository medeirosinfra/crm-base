import { supabase } from "./client";

// ============================================================
// Dashboard com dados REAIS do Supabase
// Usa supabaseAdmin (service_role) para que o super_admin veja
// os dados agregados de todas as clínicas (RLS por tenant faria
// o super_admin ver zero, pois tem tenant_id NULL).
// Obs: para admin/staff de clínica, usar o cliente normal com RLS.
// ============================================================

// Cliente usado: supabaseAdmin para o painel master (todas as clínicas).
// Se no futuro um admin de clínica usar este dashboard, trocar para
// `supabase` (RLS filtra pelo tenant logado).
const db = supabase;

export interface DashboardResumo {
  totalPacientes: number;
  agendamentosHoje: number;
  agendamentosPendentes: number;
  totalProcedimentos: number;
  receitas: number;
  despesas: number;
  saldo: number;
  campanhas: number;
}

export interface FaturamentoMensal {
  mes: string;
  receitas: number;
  despesas: number;
}

export interface ProcedimentoTop {
  nome: string;
  preco: number;
}

/** Busca o resumo geral do dashboard (counts + somas financeiras). */
export async function getDashboardResumo(): Promise<DashboardResumo> {
  const [pacientes, agendamentos, procedimentos, transacoes, campanhas] = await Promise.all([
    db.from("pacientes").select("id", { count: "exact", head: true }),
    db.from("agendamentos").select("id, data, status", { count: "exact" }),
    db.from("procedimentos").select("id", { count: "exact", head: true }),
    db.from("transacoes_financeiras").select("valor, tipo"),
    db.from("campanhas").select("id", { count: "exact", head: true }),
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  const agendamentosData = agendamentos.data ?? [];

  const receitas = (transacoes.data ?? [])
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + Number(t.valor), 0);
  const despesas = (transacoes.data ?? [])
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + Math.abs(Number(t.valor)), 0);

  return {
    totalPacientes: pacientes.count ?? 0,
    agendamentosHoje: agendamentosData.filter((a) => a.data.slice(0, 10) === hoje).length,
    agendamentosPendentes: agendamentosData.filter((a) => a.status === "agendado").length,
    totalProcedimentos: procedimentos.count ?? 0,
    receitas,
    despesas,
    saldo: receitas - despesas,
    campanhas: campanhas.count ?? 0,
  };
}

/** Faturamento mensal (últimos N meses) para o gráfico de evolução. */
export async function getFaturamentoMensal(meses = 6): Promise<FaturamentoMensal[]> {
  // Data limite (N meses atrás)
  const limite = new Date();
  limite.setMonth(limite.getMonth() - (meses - 1));
  limite.setDate(1);

  const { data, error } = await db
    .from("transacoes_financeiras")
    .select("valor, tipo, data")
    .gte("data", limite.toISOString().slice(0, 10))
    .order("data");

  if (error) throw new Error(`Erro ao buscar faturamento: ${error.message}`);

  // Monta os últimos N meses (inclusive vazios)
  const resultado: FaturamentoMensal[] = [];
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (meses - 1));
  inicio.setDate(1);

  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio);
    d.setMonth(inicio.getMonth() + i);
    const chave = d.toISOString().slice(0, 7); // YYYY-MM
    resultado.push({
      mes: d.toLocaleDateString("pt-BR", { month: "short" }),
      receitas: 0,
      despesas: 0,
    });
    // O índice do loop é o mês; preenche depois
  }

  // Agrupa as transações por mês
  const porMes = new Map<string, FaturamentoMensal>();
  for (const t of data ?? []) {
    const mes = t.data.slice(0, 7);
    if (!porMes.has(mes)) {
      porMes.set(mes, { mes, receitas: 0, despesas: 0 });
    }
    const entry = porMes.get(mes)!;
    if (t.tipo === "receita") entry.receitas += Number(t.valor);
    else entry.despesas += Math.abs(Number(t.valor));
  }

  // Combina com os últimos N meses
  const chaves = resultado.map((r) => r.mes); // mas usamos labels, não chaves
  const final: FaturamentoMensal[] = [];
  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio);
    d.setMonth(inicio.getMonth() + i);
    const chave = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("pt-BR", { month: "short" });
    const entry = porMes.get(chave);
    final.push({
      mes: label,
      receitas: entry?.receitas ?? 0,
      despesas: entry?.despesas ?? 0,
    });
  }

  return final;
}

/** Procedimentos mais caros (para destaques). */
export async function getProcedimentosTop(limit = 5): Promise<ProcedimentoTop[]> {
  const { data, error } = await supabase
    .from("procedimentos")
    .select("nome, preco")
    .order("preco", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Erro ao buscar procedimentos: ${error.message}`);
  return (data ?? []) as ProcedimentoTop[];
}

/** Pacientes criados no período (para "pacientes novos"). */
export async function getPacientesNovos(dias = 30): Promise<number> {
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);

  const { count, error } = await supabase
    .from("pacientes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", limite.toISOString());

  if (error) throw new Error(`Erro ao buscar pacientes novos: ${error.message}`);
  return count ?? 0;
}
