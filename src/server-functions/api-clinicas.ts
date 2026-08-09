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

  // 5. Seed de configuração padrão (procedimentos, categorias, setores) por segmento
  //    Assim toda clínica nova (ex: Odonto) nasce JÁ configurada igual à Dra. Luana.
  const seedErro = await seedConfiguracaoSegmento(tenant.id, data.especialidade);
  if (seedErro) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    throw new Error(`Erro no seed de configuração: ${seedErro}`);
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

// ============================================================
// Seed de configuração padrão por segmento.
// Toda clínica nova nasce com procedimentos/categorias/setores
// do segmento, idênticos à base usada pela Dra. Luana (odonto).
// ============================================================

const SEEDS: Record<string, { procedimentos: string[]; categorias: { nome: string; tipo: string }[]; setores: string[] }> = {
  Odontologia: {
    procedimentos: ["Restauração", "Extração", "Limpeza", "Clareamento", "Canal (Endodontia)", "Faceta", "Coroa", "Implante", "Ortodontia", "Preenchimento", "Botox"],
    categorias: [
      { nome: "Consultas", tipo: "receita" },
      { nome: "Procedimentos", tipo: "receita" },
      { nome: "Materiais", tipo: "despesa" },
      { nome: "Equipamentos", tipo: "despesa" },
      { nome: "Funcionários", tipo: "despesa" },
    ],
    setores: ["Recepção", "Clínica", "Cirúrgico", "Administrativo"],
  },
  "Harmonização Facial": {
    procedimentos: ["Botox", "Preenchimento", "Fios de PDO", "Bioestimuladores", "Skinbooster", "Limpeza de pele", "Peeling químico"],
    categorias: [
      { nome: "Procedimentos", tipo: "receita" },
      { nome: "Produtos", tipo: "despesa" },
      { nome: "Consultas", tipo: "receita" },
    ],
    setores: ["Recepção", "Sala de Procedimentos", "Administrativo"],
  },
  Dermatologia: {
    procedimentos: ["Consulta", "Exame de lesão", "Biópsia", "Crioterapia", "Cirurgia dermatológica"],
    categorias: [
      { nome: "Consultas", tipo: "receita" },
      { nome: "Exames", tipo: "receita" },
      { nome: "Procedimentos", tipo: "receita" },
    ],
    setores: ["Recepção", "Consultório", "Administrativo"],
  },
  Fisioterapia: {
    procedimentos: ["Avaliação", "Sessão de fisioterapia", "RPG", "Pilates terapêutico", "Drenagem linfática"],
    categorias: [
      { nome: "Sessões", tipo: "receita" },
      { nome: "Avaliações", tipo: "receita" },
      { nome: "Equipamentos", tipo: "despesa" },
    ],
    setores: ["Recepção", "Sala de Atendimento", "Administrativo"],
  },
  Psicologia: {
    procedimentos: ["Consulta", "Acompanhamento", "Avaliação psicológica", "Terapia de casal"],
    categorias: [
      { nome: "Consultas", tipo: "receita" },
      { nome: "Avaliações", tipo: "receita" },
    ],
    setores: ["Recepção", "Consultório", "Administrativo"],
  },
};

async function seedConfiguracaoSegmento(tenantId: string, especialidade: string): Promise<string | null> {
  const seed = SEEDS[especialidade];
  if (!seed) return null; // segmento sem seed → ok, clínica começa vazia

  const { error: pErr } = await supabaseAdmin.from("procedimentos").insert(
    seed.procedimentos.map((nome) => ({
      tenant_id: tenantId,
      nome,
      preco: 0,
      duracao_min: 30,
      ativo: true,
    })),
  );
  if (pErr) return `procedimentos: ${pErr.message}`;

  const { error: cErr } = await supabaseAdmin.from("categorias_financeiras").insert(
    seed.categorias.map((c) => ({
      tenant_id: tenantId,
      nome: c.nome,
      tipo: c.tipo,
    })),
  );
  if (cErr) return `categorias: ${cErr.message}`;

  const { error: sErr } = await supabaseAdmin.from("setores").insert(
    seed.setores.map((nome) => ({ tenant_id: tenantId, nome })),
  );
  if (sErr) return `setores: ${sErr.message}`;

  return null;
}
