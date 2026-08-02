import { supabase } from "./client";

// ---------------- PROCEDIMENTOS ----------------

export interface Procedimento {
  id: string;
  tenant_id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  duracao_min?: number | null;
  preco: number;
  ativo: boolean;
  created_at: string;
}

export async function listProcedimentos(): Promise<Procedimento[]> {
  const { data, error } = await supabase
    .from("procedimentos")
    .select("*")
    .order("nome");

  if (error) throw new Error(`Erro ao buscar procedimentos: ${error.message}`);
  return (data ?? []) as Procedimento[];
}

export async function createProcedimento(
  input: Omit<Procedimento, "id" | "tenant_id" | "created_at" | "ativo">,
): Promise<Procedimento> {
  const { data, error } = await supabase
    .from("procedimentos")
    .insert([{ ...input, ativo: true }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar procedimento: ${error.message}`);
  return data as Procedimento;
}

export async function deleteProcedimento(id: string): Promise<void> {
  const { error } = await supabase.from("procedimentos").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir procedimento: ${error.message}`);
}

// ---------------- CAMPANHAS ----------------

export interface Campanha {
  id: string;
  tenant_id: string;
  nome: string;
  mensagem: string;
  status: "rascunho" | "agendada" | "enviando" | "enviada" | "cancelada";
  agendamento?: string | null;
  total_contatos: number;
  enviados: number;
  falhas: number;
  waha_sessao?: string | null;
  created_at: string;
}

export async function listCampanhas(): Promise<Campanha[]> {
  const { data, error } = await supabase
    .from("campanhas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar campanhas: ${error.message}`);
  return (data ?? []) as Campanha[];
}

export async function createCampanha(
  input: Omit<Campanha, "id" | "tenant_id" | "created_at" | "total_contatos" | "enviados" | "falhas">,
): Promise<Campanha> {
  const { data, error } = await supabase
    .from("campanhas")
    .insert([{ ...input, total_contatos: 0, enviados: 0, falhas: 0 }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar campanha: ${error.message}`);
  return data as Campanha;
}

export async function deleteCampanha(id: string): Promise<void> {
  const { error } = await supabase.from("campanhas").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir campanha: ${error.message}`);
}
