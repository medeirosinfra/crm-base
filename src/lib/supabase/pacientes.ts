import { supabase } from "./client";

// ============================================================
// Service de Pacientes — detalhe, histórico, financeiro
// ============================================================

const db = supabase;

export interface PacienteDetalhe {
  id: string;
  tenant_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  nascimento: string | null;
  observacoes: string | null;
  cpf: string | null;
  genero: string | null;
  endereco: string | null;
  origem: string | null;
  ultima_consulta: string | null;
  created_at: string;
}

export interface AgendamentoPaciente {
  id: string;
  data: string;
  status: string;
  tipo: string | null;
  valor: number | null;
  observacoes: string | null;
  procedimento: { nome: string } | null;
  profissional: { nome: string } | null;
}

export interface TransacaoPaciente {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  status: string;
}

/** Busca detalhe do paciente. */
export async function getPaciente(id: string): Promise<PacienteDetalhe | null> {
  const { data, error } = await db.from("pacientes").select("*").eq("id", id).single();
  if (error) return null;
  return data as PacienteDetalhe;
}

/** Lista agendamentos do paciente (com procedimento e profissional). */
export async function listAgendamentosDoPaciente(id: string): Promise<AgendamentoPaciente[]> {
  const { data, error } = await db
    .from("agendamentos")
    .select("id, data, status, tipo, valor, observacoes, procedimento:procedimentos(nome), profissional:profissionais(nome)")
    .eq("paciente_id", id)
    .order("data", { ascending: false });

  if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);
  return (data ?? []) as unknown as AgendamentoPaciente[];
}

/** Lista transações financeiras do paciente. */
export async function listTransacoesDoPaciente(id: string): Promise<TransacaoPaciente[]> {
  const { data, error } = await db
    .from("transacoes_financeiras")
    .select("id, descricao, valor, tipo, data, status")
    .eq("paciente_id", id)
    .order("data", { ascending: false });

  if (error) throw new Error(`Erro ao buscar transações: ${error.message}`);
  return (data ?? []) as TransacaoPaciente[];
}

/** Atualiza dados do paciente. */
export async function updatePaciente(
  id: string,
  input: Partial<PacienteDetalhe>,
): Promise<PacienteDetalhe> {
  const { data, error } = await db
    .from("pacientes")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar paciente: ${error.message}`);
  return data as PacienteDetalhe;
}
