import { supabase } from "./client";
import { supabaseAdmin } from "./server";
import type { Database } from "./types";

// Tipos locais (espelham o schema do banco)
export interface Tenant {
  id: string;
  slug: string;
  nome: string;
  descricao?: string | null;
  especialidade?: string | null;
  status: "ativa" | "trial" | "inadimplente" | "suspensa";
  logo_url?: string | null;
  cor_primaria: string;
  cor_segundaria?: string | null;
  dominio?: string | null;
  plano: "starter" | "pro" | "empresarial";
  mrr?: number | null;
  waha_sessao?: string | null;
  whatsapp_sessions?: number | null;
  created_at: string;
}

export interface Paciente {
  id: string;
  tenant_id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  nascimento?: string | null;
  observacoes?: string | null;
  created_at: string;
}

export interface Agendamento {
  id: string;
  tenant_id: string;
  paciente_id?: string | null;
  data: string;
  tipo?: string | null;
  status: "agendado" | "confirmado" | "cancelado" | "concluido";
  observacoes?: string | null;
}

// ---------------- TENANTS (painel master - super_admin) ----------------

/** Lista todos os tenants (usado pelo painel master). Requer super_admin ou service_role. */
export async function listTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar tenants: ${error.message}`);
  return (data ?? []) as Tenant[];
}

/** Cria um novo tenant (clínica). Requer super_admin. */
export async function createTenant(input: Omit<Tenant, "id" | "created_at">): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar tenant: ${error.message}`);
  return data as Tenant;
}

/** Atualiza um tenant (ex: branding white-label). */
export async function updateTenant(id: string, input: Partial<Tenant>): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar tenant: ${error.message}`);
  return data as Tenant;
}

/** Busca tenant pelo slug (subdomínio). Usa service_role para resolução de branding. */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Tenant;
}

// ---------------- PACIENTES (área logada do tenant) ----------------

export async function listPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar pacientes: ${error.message}`);
  return (data ?? []) as Paciente[];
}

export async function createPaciente(input: Omit<Paciente, "id" | "tenant_id" | "created_at">): Promise<Paciente> {
  const { data, error } = await supabase
    .from("pacientes")
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar paciente: ${error.message}`);
  return data as Paciente;
}

// ---------------- AGENDAMENTOS ----------------

export async function listAgendamentos(): Promise<Agendamento[]> {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .order("data", { ascending: true });

  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  return (data ?? []) as Agendamento[];
}
