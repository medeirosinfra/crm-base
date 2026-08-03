import { supabase } from "./client";

// ============================================================
// Service de Funcionários e Setores (painel da clínica)
// ============================================================

export interface Funcionario {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  nome: string;
  cargo: "admin" | "gerente" | "financeiro" | "staff";
  setor_id: string | null;
  telefone: string | null;
  email: string | null;
  cpf?: string | null;
  especialidade?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at: string;
  setor?: { nome: string } | null;
}

export interface Setor {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

/** Lista funcionários da clínica (com setor). */
export async function listFuncionarios(): Promise<Funcionario[]> {
  const { data, error } = await supabase
    .from("funcionarios")
    .select("*, setor:setores(nome)")
    .order("nome");

  if (error) throw new Error(`Erro ao buscar funcionários: ${error.message}`);
  return (data ?? []) as Funcionario[];
}

/** Lista setores da clínica. */
export async function listSetores(): Promise<Setor[]> {
  const { data, error } = await supabase.from("setores").select("*").order("nome");
  if (error) throw new Error(`Erro ao buscar setores: ${error.message}`);
  return (data ?? []) as Setor[];
}

/** Cria um setor. */
export async function createSetor(input: { nome: string; descricao?: string | null }): Promise<Setor> {
  const { data, error } = await supabase.from("setores").insert([input]).select().single();
  if (error) throw new Error(`Erro ao criar setor: ${error.message}`);
  return data as Setor;
}

/** Cria um funcionário (sem login ainda — vincular profile depois). */
export async function createFuncionario(
  input: Omit<Funcionario, "id" | "tenant_id" | "created_at" | "ativo" | "setor">,
): Promise<Funcionario> {
  const { data, error } = await supabase
    .from("funcionarios")
    .insert([{ ...input, ativo: true }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar funcionário: ${error.message}`);
  return data as Funcionario;
}

/** Atualiza um funcionário. */
export async function updateFuncionario(
  id: string,
  input: Partial<Funcionario>,
): Promise<Funcionario> {
  const { data, error } = await supabase
    .from("funcionarios")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar funcionário: ${error.message}`);
  return data as Funcionario;
}

/** Exclui um funcionário. */
export async function deleteFuncionario(id: string): Promise<void> {
  const { error } = await supabase.from("funcionarios").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir funcionário: ${error.message}`);
}
