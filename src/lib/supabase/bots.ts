import { supabase } from "./client";

// ============================================================
// Service de Bots de Atendimento (WhatsApp)
// ============================================================

export interface Bot {
  id: string;
  tenant_id: string | null;
  nome: string;
  saudacao: string | null;
  keyword: string | null;
  resposta: string | null;
  transferir_humano: boolean;
  ativo: boolean;
  created_at: string;
}

/** Lista os bots ativos (para o master e para a clínica). */
export async function listBots(): Promise<Bot[]> {
  const { data, error } = await supabase.from("bots").select("*").order("nome");
  if (error) throw new Error(`Erro ao buscar bots: ${error.message}`);
  return (data ?? []) as Bot[];
}

/** Cria um bot. */
export async function createBot(
  input: Omit<Bot, "id" | "created_at" | "ativo" | "tenant_id"> & { tenant_id?: string | null },
): Promise<Bot> {
  const { data, error } = await supabase
    .from("bots")
    .insert([{ ...input, tenant_id: input.tenant_id ?? null, ativo: true }])
    .select()
    .single();
  if (error) throw new Error(`Erro ao criar bot: ${error.message}`);
  return data as Bot;
}

/** Atualiza um bot. */
export async function updateBot(id: string, input: Partial<Bot>): Promise<Bot> {
  const { data, error } = await supabase.from("bots").update(input).eq("id", id).select().single();
  if (error) throw new Error(`Erro ao atualizar bot: ${error.message}`);
  return data as Bot;
}

/** Exclui um bot. */
export async function deleteBot(id: string): Promise<void> {
  const { error } = await supabase.from("bots").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir bot: ${error.message}`);
}
