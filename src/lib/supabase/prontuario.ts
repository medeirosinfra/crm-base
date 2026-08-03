import { supabase } from "./client";

// ============================================================
// Service de Anamnese & Prontuário (Harmonização Facial)
// ============================================================

export interface Anamnese {
  id: string;
  tenant_id: string;
  paciente_id: string;
  alergias: string | null;
  medicamentos: string | null;
  doencas_cronicas: string | null;
  cirurgias_previas: string | null;
  gravidez: boolean;
  amamentando: boolean;
  fuma: boolean;
  consome_alcool: boolean;
  exposicao_sol: string | null;
  tipo_pele: string | null;
  queixa_principal: string | null;
  procedimentos_anteriores: string | null;
  expectativas: string | null;
  profissional_id: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface ProntuarioRegistro {
  id: string;
  tenant_id: string;
  paciente_id: string;
  agendamento_id: string | null;
  tipo: "avaliacao" | "evolucao" | "procedimento" | "retorno" | "medicacao";
  titulo: string | null;
  descricao: string | null;
  data_registro: string | null;
  procedimento_realizado: string | null;
  medicacao: string | null;
  receita: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  retorno_em: string | null;
  profissional_id: string | null;
  created_at: string;
}

/** Busca a anamnese do paciente (se existir). */
export async function getAnamnese(pacienteId: string): Promise<Anamnese | null> {
  const { data, error } = await supabase
    .from("anamneses")
    .select("*")
    .eq("paciente_id", pacienteId)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar anamnese: ${error.message}`);
  return data as Anamnese | null;
}

/** Cria ou atualiza a anamnese do paciente. */
export async function upsertAnamnese(
  pacienteId: string,
  input: Omit<Anamnese, "id" | "tenant_id" | "paciente_id" | "created_at">,
): Promise<Anamnese> {
  const existente = await getAnamnese(pacienteId);

  if (existente) {
    const { data, error } = await supabase
      .from("anamneses")
      .update({ ...input })
      .eq("id", existente.id)
      .select()
      .single();
    if (error) throw new Error(`Erro ao atualizar anamnese: ${error.message}`);
    return data as Anamnese;
  }

  const { data, error } = await supabase
    .from("anamneses")
    .insert([{ ...input, paciente_id: pacienteId }])
    .select()
    .single();
  if (error) throw new Error(`Erro ao criar anamnese: ${error.message}`);
  return data as Anamnese;
}

/** Lista registros do prontuário do paciente (mais recentes primeiro). */
export async function listProntuario(pacienteId: string): Promise<ProntuarioRegistro[]> {
  const { data, error } = await supabase
    .from("prontuario_registros")
    .select("*, profissional:profissionais(nome)")
    .eq("paciente_id", pacienteId)
    .order("data_registro", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar prontuário: ${error.message}`);
  return (data ?? []) as ProntuarioRegistro[];
}

/** Cria um registro no prontuário. */
export async function createProntuarioRegistro(
  input: Omit<ProntuarioRegistro, "id" | "tenant_id" | "created_at">,
): Promise<ProntuarioRegistro> {
  const { data, error } = await supabase
    .from("prontuario_registros")
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar registro: ${error.message}`);
  return data as ProntuarioRegistro;
}

/** Atualiza um registro do prontuário. */
export async function updateProntuarioRegistro(
  id: string,
  input: Partial<ProntuarioRegistro>,
): Promise<ProntuarioRegistro> {
  const { data, error } = await supabase
    .from("prontuario_registros")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar registro: ${error.message}`);
  return data as ProntuarioRegistro;
}

/** Exclui um registro do prontuário. */
export async function deleteProntuarioRegistro(id: string): Promise<void> {
  const { error } = await supabase.from("prontuario_registros").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir registro: ${error.message}`);
}
