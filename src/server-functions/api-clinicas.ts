import { supabaseAdmin } from "@/lib/supabase/server";

// ============================================================
// Rota customizada de criação de clínica — POST /api/clinicas
// (contorna o server-fn do TanStack Start, que falha no Docker)
// Executa os 4 passos: tenant + auth admin + profile + funcionário
// ============================================================

export interface CreateClinicBody {
  nome: string;
  slug: string;
  especialidade: string;
  adminEmail: string;
  adminNome: string;
  adminSenha: string;
  corPrimaria?: string;
  plano?: string;
  wahaSessao?: string;
}

export async function criarClinica(data: CreateClinicBody) {
  // 1. Criar tenant via service_role
  const { data: tenant, error: tErr } = await supabaseAdmin
    .from("tenants")
    .insert({
      nome: data.nome,
      slug: data.slug,
      especialidade: data.especialidade,
      cor_primaria: data.corPrimaria ?? "#e11d48",
      plano: data.plano ?? "starter",
      status: "ativa",
      waha_sessao: data.wahaSessao ?? null,
    })
    .select()
    .single();

  if (tErr || !tenant) {
    throw new Error(`Erro ao criar clínica: ${tErr?.message ?? "desconhecido"}`);
  }

  // 2. Criar usuário admin no auth (sem confirmação de email)
  const { data: authUser, error: uErr } = await supabaseAdmin.auth.admin.createUser({
    email: data.adminEmail,
    password: data.adminSenha,
    email_confirm: true,
    user_metadata: { tenant_id: tenant.id, cargo: "admin" },
  });

  if (uErr || !authUser.user) {
    // Rollback: excluir tenant
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    throw new Error(`Erro ao criar usuário admin: ${uErr?.message ?? "desconhecido"}`);
  }

  // 3. Criar profile admin vinculado ao tenant
  const { error: pErr } = await supabaseAdmin.from("profiles").insert({
    id: authUser.user.id,
    tenant_id: tenant.id,
    nome: data.adminNome,
    email: data.adminEmail,
    cargo: "admin",
  });

  if (pErr) {
    // Rollback: excluir usuário auth + tenant
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    throw new Error(`Erro ao criar perfil admin: ${pErr.message}`);
  }

  // 4. Criar funcionário raiz (vínculo com o perfil)
  const { error: fErr } = await supabaseAdmin.from("funcionarios").insert({
    tenant_id: tenant.id,
    profile_id: authUser.user.id,
    nome: data.adminNome,
    cargo: "admin",
    email: data.adminEmail,
  });

  if (fErr) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    throw new Error(`Erro ao criar funcionário: ${fErr.message}`);
  }

  return {
    tenant: {
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug,
      especialidade: tenant.especialidade,
      status: tenant.status,
      plano: tenant.plano,
    },
    credenciais: {
      email: data.adminEmail,
      senha: data.adminSenha,
    },
  };
}
