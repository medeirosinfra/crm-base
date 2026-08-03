import { supabase } from "./client";

// ============================================================
// Service de Segmentos & Módulos (menus dinâmicos por segmento)
// ============================================================

export interface Segmento {
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface Modulo {
  codigo: string;
  nome: string;
  caminho: string | null;
  icone: string | null;
  exigencia_cargo: string | null;
  ordem: number;
}

/** Lista todos os segmentos (catálogo). */
export async function listSegmentos(): Promise<Segmento[]> {
  const { data, error } = await supabase.from("segmentos").select("*").order("nome");
  if (error) throw new Error(`Erro ao buscar segmentos: ${error.message}`);
  return (data ?? []) as Segmento[];
}

/** Busca um segmento pelo código (ex: 'estetica'). */
export async function getSegmento(codigo: string): Promise<Segmento | null> {
  const { data, error } = await supabase.from("segmentos").select("*").eq("codigo", codigo).maybeSingle();
  if (error) return null;
  return data as Segmento | null;
}

/** Busca um segmento pelo nome (ex: 'Harmonização Facial'). */
export async function getSegmentoPorNome(nome: string): Promise<Segmento | null> {
  const { data, error } = await supabase.from("segmentos").select("*").eq("nome", nome).maybeSingle();
  if (error) return null;
  return data as Segmento | null;
}

/** Lista os módulos ativos de um segmento (na ordem definida). */
export async function listModulosDoSegmento(segmentoCodigo: string): Promise<Modulo[]> {
  const { data, error } = await supabase
    .from("segmento_modulos")
    .select("modulo:modulos(*)")
    .eq("segmento_codigo", segmentoCodigo)
    .order("ordem");

  if (error) throw new Error(`Erro ao buscar módulos do segmento: ${error.message}`);

  return (data ?? [])
    .map((row) => (row.modulo as Modulo) ?? null)
    .filter((m): m is Modulo => m !== null && m.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/** Lista todos os módulos (catálogo). */
export async function listModulos(): Promise<Modulo[]> {
  const { data, error } = await supabase.from("modulos").select("*").order("ordem");
  if (error) throw new Error(`Erro ao buscar módulos: ${error.message}`);
  return (data ?? []) as Modulo[];
}

// ---------------- CRUD (master / super_admin) ----------------

/** Cria um segmento. */
export async function createSegmento(input: { codigo: string; nome: string; descricao?: string }): Promise<Segmento> {
  const { data, error } = await supabase.from("segmentos").insert([input]).select().single();
  if (error) throw new Error(`Erro ao criar segmento: ${error.message}`);
  return data as Segmento;
}

/** Atualiza um segmento. */
export async function updateSegmento(codigo: string, input: Partial<Segmento>): Promise<Segmento> {
  const { data, error } = await supabase.from("segmentos").update(input).eq("codigo", codigo).select().single();
  if (error) throw new Error(`Erro ao atualizar segmento: ${error.message}`);
  return data as Segmento;
}

/** Exclui um segmento. */
export async function deleteSegmento(codigo: string): Promise<void> {
  const { error } = await supabase.from("segmentos").delete().eq("codigo", codigo);
  if (error) throw new Error(`Erro ao excluir segmento: ${error.message}`);
}

/** Define quais módulos um segmento ativa. */
export async function setModulosDoSegmento(segmentoCodigo: string, modulos: string[]): Promise<void> {
  // Remove os atuais e insere os novos
  const { error: delErr } = await supabase.from("segmento_modulos").delete().eq("segmento_codigo", segmentoCodigo);
  if (delErr) throw new Error(`Erro ao atualizar módulos: ${delErr.message}`);

  if (modulos.length > 0) {
    const rows = modulos.map((moduloCodigo, i) => ({
      segmento_codigo: segmentoCodigo,
      modulo_codigo: moduloCodigo,
      ordem: (i + 1) * 10,
    }));
    const { error: insErr } = await supabase.from("segmento_modulos").insert(rows);
    if (insErr) throw new Error(`Erro ao salvar módulos: ${insErr.message}`);
  }
}

/** Lista os códigos de módulos ativos de um segmento (para checkboxes). */
export async function listModuloCodigosDoSegmento(segmentoCodigo: string): Promise<string[]> {
  const { data, error } = await supabase.from("segmento_modulos").select("modulo_codigo").eq("segmento_codigo", segmentoCodigo);
  if (error) throw new Error(`Erro ao buscar módulos: ${error.message}`);
  return (data ?? []).map((r) => r.modulo_codigo);
}
