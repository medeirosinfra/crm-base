import { supabase } from "./client";

const db = supabase;

// ============================================================
// Service de Agendamentos — CRUD completo com joins
// ============================================================

export type AgendamentoStatus = "agendado" | "confirmado" | "concluido" | "cancelado";

export interface AgendamentoComRels {
  id: string;
  tenant_id: string;
  paciente_id: string | null;
  procedimento_id: string | null;
  profissional_id: string | null;
  valor: number | null;
  data: string;
  tipo: string | null;
  status: AgendamentoStatus;
  observacoes: string | null;
  paciente?: { nome: string } | null;
  procedimento?: { nome: string; preco: number } | null;
  profissional?: { nome: string } | null;
}

export interface NovoAgendamento {
  paciente_id: string;
  procedimento_id?: string | null;
  profissional_id?: string | null;
  data: string; // ISO timestamptz
  tipo?: string | null;
  observacoes?: string | null;
}

const SELECT = `
  *,
  paciente:pacientes(nome),
  procedimento:procedimentos(nome, preco),
  profissional:profissionais(nome)
`;

/** Lista agendamentos com joins (paciente, procedimento, profissional). */
export async function listAgendamentosComRels(): Promise<AgendamentoComRels[]> {
  const { data, error } = await db
    .from("agendamentos")
    .select(SELECT)
    .order("data", { ascending: true });

  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  return (data ?? []) as AgendamentoComRels[];
}

/** Busca agendamentos de um período (dataInicio até dataFim). */
export async function listAgendamentosPeriodo(
  dataInicio: string,
  dataFim: string,
): Promise<AgendamentoComRels[]> {
  const { data, error } = await db
    .from("agendamentos")
    .select(SELECT)
    .gte("data", dataInicio)
    .lte("data", dataFim)
    .order("data", { ascending: true });

  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  return (data ?? []) as AgendamentoComRels[];
}

/** Cria um novo agendamento. */
export async function createAgendamento(input: NovoAgendamento): Promise<AgendamentoComRels> {
  // Se não informou valor e tem procedimento, busca o preço
  let valor: number | null = null;
  if (input.procedimento_id) {
    const { data: proc } = await db
      .from("procedimentos")
      .select("preco")
      .eq("id", input.procedimento_id)
      .single();
    if (proc) valor = proc.preco;
  }

  const { data, error } = await db
    .from("agendamentos")
    .insert([{ ...input, valor, status: "agendado" }])
    .select(SELECT)
    .single();

  if (error) throw new Error(`Erro ao criar agendamento: ${error.message}`);
  return data as AgendamentoComRels;
}

/** Atualiza o status de um agendamento. */
export async function updateAgendamentoStatus(
  id: string,
  status: AgendamentoStatus,
): Promise<AgendamentoComRels> {
  const { data, error } = await db
    .from("agendamentos")
    .update({ status })
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
  return data as AgendamentoComRels;
}

/** Exclui um agendamento. */
export async function deleteAgendamento(id: string): Promise<void> {
  const { error } = await db.from("agendamentos").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir agendamento: ${error.message}`);
}

/** Lista profissionais da clínica (para o form de agendamento). */
export async function listProfissionais(): Promise<{ id: string; nome: string; especialidade: string | null }[]> {
  const { data, error } = await db.from("profissionais").select("id, nome, especialidade").order("nome");
  if (error) throw new Error(`Erro ao buscar profissionais: ${error.message}`);
  return (data ?? []) as { id: string; nome: string; especialidade: string | null }[];
}
