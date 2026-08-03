import { supabase } from "./client";

export interface Transacao {
  id: string;
  tenant_id: string;
  categoria_id?: string | null;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  data: string;
  status: "pago" | "pendente" | "cancelado";
  created_at: string;
}

export interface Produto {
  id: string;
  tenant_id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  custo?: number | null;
  quantidade: number;
  unidade?: string | null;
  created_at: string;
}

export interface CategoriaFinanceira {
  id: string;
  tenant_id: string;
  nome: string;
  tipo: "receita" | "despesa";
}

export async function listTransacoes(): Promise<Transacao[]> {
  const { data, error } = await supabase
    .from("transacoes_financeiras")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw new Error(`Erro ao buscar transações: ${error.message}`);
  return (data ?? []) as Transacao[];
}

export async function listProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome");

  if (error) throw new Error(`Erro ao buscar produtos: ${error.message}`);
  return (data ?? []) as Produto[];
}

export async function listCategoriasFinanceiras(): Promise<CategoriaFinanceira[]> {
  const { data, error } = await supabase.from("categorias_financeiras").select("*");
  if (error) throw new Error(`Erro ao buscar categorias: ${error.message}`);
  return (data ?? []) as CategoriaFinanceira[];
}

export async function createTransacao(
  input: Omit<Transacao, "id" | "tenant_id" | "created_at">,
): Promise<Transacao> {
  const { data, error } = await supabase
    .from("transacoes_financeiras")
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar transação: ${error.message}`);
  return data as Transacao;
}

export async function createProduto(
  input: Omit<Produto, "id" | "tenant_id" | "created_at">,
): Promise<Produto> {
  const { data, error } = await supabase.from("produtos").insert([input]).select().single();
  if (error) throw new Error(`Erro ao criar produto: ${error.message}`);
  return data as Produto;
}

// ============================================================
// DRE — Demonstração do Resultado do Exercício
// Receitas − despesas por categoria e evolução mensal
// ============================================================

export interface DreLinha {
  categoria: string; // "Consulta", "Botox", ou "(sem categoria)"
  tipo: "receita" | "despesa";
  valor: number;
  percentual: number; // % do total de receitas (para despesas) ou do total receitas (para receitas)
}

export interface DreMes {
  mes: string; // "2026-08"
  label: string; // "ago/26"
  receitas: number;
  despesas: number;
  resultado: number;
}

export interface DreResultado {
  totalReceitas: number;
  totalDespesas: number;
  resultado: number;
  margem: number; // resultado / receitas * 100
  porCategoria: DreLinha[];
  porMes: DreMes[];
}

/** Calcula o DRE completo a partir das transações pagas. */
export function calcularDre(
  transacoes: Transacao[],
  categorias?: CategoriaFinanceira[],
): DreResultado {
  const pagas = (transacoes ?? []).filter((t) => t.status === "pago");
  const nomeCategoria = (id?: string | null) => {
    if (!id) return "(sem categoria)";
    return categorias?.find((c) => c.id === id)?.nome ?? id;
  };

  const totalReceitas = pagas
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = pagas
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + Math.abs(Number(t.valor)), 0);
  const resultado = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0;

  // Por categoria (junta receitas e despesas da mesma categoria)
  const porCategoriaMap = new Map<string, DreLinha>();
  for (const t of pagas) {
    const chave = t.categoria_id ?? "sem-categoria";
    const valor = t.tipo === "despesa" ? Math.abs(Number(t.valor)) : Number(t.valor);
    const existente = porCategoriaMap.get(chave);
    const categoria = nomeCategoria(t.categoria_id);
    if (existente) {
      existente.valor += valor;
    } else {
      porCategoriaMap.set(chave, {
        categoria,
        tipo: t.tipo,
        valor,
        percentual: 0,
      });
    }
  }
  const porCategoria = [...porCategoriaMap.values()].map((l) => ({
    ...l,
    percentual: totalReceitas > 0 ? (l.valor / totalReceitas) * 100 : 0,
  }));

  // Por mês (receitas e despesas separadas por mês)
  const porMesMap = new Map<string, { receitas: number; despesas: number }>();
  for (const t of pagas) {
    const mes = String(t.data).slice(0, 7); // YYYY-MM
    if (!porMesMap.has(mes)) porMesMap.set(mes, { receitas: 0, despesas: 0 });
    const linha = porMesMap.get(mes)!;
    if (t.tipo === "receita") linha.receitas += Number(t.valor);
    else linha.despesas += Math.abs(Number(t.valor));
  }
  const porMes: DreMes[] = [...porMesMap.entries()]
    .map(([mes, v]) => {
      const [ano, m] = mes.split("-");
      const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      return {
        mes,
        label: `${meses[Number(m) - 1] ?? m}/${ano.slice(2)}`,
        receitas: v.receitas,
        despesas: v.despesas,
        resultado: v.receitas - v.despesas,
      };
    })
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return { totalReceitas, totalDespesas, resultado, margem, porCategoria, porMes };
}
