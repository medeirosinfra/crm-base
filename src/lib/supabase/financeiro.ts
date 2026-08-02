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
