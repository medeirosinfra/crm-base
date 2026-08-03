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
