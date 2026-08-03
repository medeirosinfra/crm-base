import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/lib/supabase/server";

// ============================================================
// Server function: criar clínica com admin automático
// Cria: tenant + usuário admin (auth) + profile admin + funcionario raiz
// Usa service_role (nunca no browser)
// ============================================================

export interface CreateClinicInput {
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

export const createClinicWithAdmin = createServerFn({ method: "POST" })
  .validator((input: CreateClinicInput) => input)
  .handler(async ({ data }) => {
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
        ativo: true,
        waha_sessao: data.wahaSessao ?? null,
      })
      .select()
      .single();

    if (tErr) {
      throw new Error(`Erro ao criar clínica: ${tErr.message}`);
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

    // 4. Criar funcionario raiz (vínculo com o perfil)
    await supabaseAdmin.from("funcionarios").insert({
      tenant_id: tenant.id,
      profile_id: authUser.user.id,
      nome: data.adminNome,
      cargo: "admin",
      email: data.adminEmail,
    });

    return {
      tenant,
      credenciais: {
        email: data.adminEmail,
        senha: data.adminSenha,
      },
    };
  });
