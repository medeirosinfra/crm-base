import { supabaseAdmin } from "./server";
import { dispararMensagens } from "./disparos";
import { getTenantWahaSessao } from "./whatsapp-connect";

// ============================================================
// Disparos Agendados com IA (campanhas + campanha_contatos)
// Servidor (service_role) — gerencia o agendamento e a execução
// dos disparos automáticos de WhatsApp via WAHA.
// ============================================================

export interface DisparoAgendado {
  id: string;
  tenant_id: string;
  nome: string;
  mensagem: string;
  status: string;
  agendamento: string | null;
  janela: string | null; // manha | tarde | noite
  hora_agendamento: string | null; // "09:00" etc
  mensagem_ia: boolean;
  next_due: string | null;
  total_contatos: number;
  enviados: number;
  falhas: number;
  waha_sessao: string | null;
  erro: string | null;
  created_at: string;
}

/** Converte "manha"/"tarde"/"noite" ou hora exata em hora do dia (e se já passou, para amanhã). */
export function resolverNextDue(opts: {
  janela?: string | null;
  hora_agendamento?: string | null;
}): string {
  const now = new Date();
  let target: Date;

  if (opts.hora_agendamento) {
    const [h, m] = opts.hora_agendamento.split(":").map(Number);
    target = new Date(now);
    target.setHours(h ?? 0, m ?? 0, 0, 0);
  } else {
    const hora: Record<string, number> = { manha: 9, tarde: 14, noite: 19 };
    const h = hora[opts.janela ?? "manha"] ?? 9;
    target = new Date(now);
    target.setHours(h, 0, 0, 0);
  }

  // Se já passou hoje, agenda para o mesmo horário amanhã
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString();
}

/** Agenda um disparo: cria a campanha + insere os contatos. */
export async function criarDisparoA(input: {
  nome: string;
  tenantId: string;
  mensagem: string;
  wahaSessao: string;
  contatos: { telefone: string; nome?: string | null }[];
  janela?: string | null;
  horaAgendamento?: string | null;
  mensagemIa?: boolean;
}): Promise<{ id: string; next_due: string }> {
  const nextDue = resolverNextDue({ janela: input.janela, hora_agendamento: input.horaAgendamento });

  const { data: campanha, error: er1 } = await supabaseAdmin
    .from("campanhas")
    .insert({
      tenant_id: input.tenantId,
      nome: input.nome,
      mensagem: input.mensagem,
      status: "agendada",
      agendamento: nextDue,
      next_due: nextDue,
      janela: input.janela ?? null,
      hora_agendamento: input.horaAgendamento ?? null,
      mensagem_ia: input.mensagemIa ?? false,
      total_contatos: input.contatos.length,
      enviados: 0,
      falhas: 0,
      waha_sessao: input.wahaSessao,
    })
    .select("id")
    .single();
  if (er1 || !campanha) {
    throw new Error(`Erro ao agendar disparo: ${er1?.message ?? "sem id"}`);
  }

  // Insere os contatos da campanha
  const linhas = input.contatos.map((c) => ({
    campanha_id: campanha.id,
    contato: c.telefone,
    nome: c.nome ?? null,
    status: "pendente",
  }));
  if (linhas.length) {
    const { error: ins2 } = await supabaseAdmin.from("campanha_contatos").insert(linhas);
    if (ins2) throw new Error(`Erro ao salvar contatos: ${ins2.message}`);
  }

  return { id: campanha.id, next_due: nextDue };
}

/** Lista os disparos agendados (para o Master ver todos). */
export async function listarDisparos(): Promise<DisparoAgendado[]> {
  const { data, error } = await supabaseAdmin
    .from("campanhas")
    .select("*")
    .neq("status", "rascunho")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Erro ao listar disparos: ${error.message}`);
  return (data ?? []) as DisparoAgendado[];
}

/**
 * Executa os disparos vencidos (next_due <= now, status='agendada').
 * Idempotente: marca como 'enviando' antes, só processa os que estão 'agendada'.
 */
export async function executarDevidos(): Promise<{ executados: number }> {
  const { data: devidos, error } = await supabaseAdmin
    .from("campanhas")
    .select("*")
    .eq("status", "agendada")
    .lte("next_due", new Date().toISOString())
    .limit(10);
  if (error) throw new Error(`Erro ao buscar devidos: ${error.message}`);
  if (!devidos?.length) return { executados: 0 };

  let executados = 0;
  for (const campanha of devidos) {
    // Marca como enviando (evita re-processamento em crash)
    await supabaseAdmin
      .from("campanhas")
      .update({ status: "enviando" })
      .eq("id", campanha.id);

    // Busca os contatos pendentes da campanha
    const { data: contatos } = await supabaseAdmin
      .from("campanha_contatos")
      .select("contato")
      .eq("campanha_id", campanha.id)
      .eq("status", "pendente");
    const telefones = (contatos ?? []).map((c) => c.contato as string);

    if (telefones.length === 0) {
      await supabaseAdmin.from("campanhas").update({ status: "enviada", erro: "sem contatos" }).eq("id", campanha.id);
      executados++;
      continue;
    }

    try {
      // Sessão sempre derivada do tenant_id da própria campanha — nunca do
      // valor gravado em waha_sessao, que pode ter vindo de um formulário
      // que deixava escolher a sessão de outro tenant (campanhas.tsx).
      const sessao = (await getTenantWahaSessao(campanha.tenant_id)) ?? campanha.waha_sessao ?? "crmprincipal";
      const res = await dispararMensagens(sessao, telefones, campanha.mensagem);
      await supabaseAdmin
        .from("campanhas")
        .update({ status: "enviada", enviados: res.enviados, falhas: res.falhas, erro: null })
        .eq("id", campanha.id);

      // Marca cada contato com o status individual
      for (const d of res.detalhes) {
        await supabaseAdmin
          .from("campanha_contatos")
          .update({ status: d.ok ? "enviado" : "falhou", enviado_at: new Date().toISOString() })
          .eq("campanha_id", campanha.id)
          .eq("contato", d.chatId.replace(/@c\.us$/, ""));
      }
      executados++;
    } catch (e) {
      await supabaseAdmin
        .from("campanhas")
        .update({ status: "cancelada", erro: String((e as Error).message ?? e) })
        .eq("id", campanha.id);
      executados++;
    }
  }
  return { executados };
}

/** Busca o tenant_id dono de uma campanha (para checagem de posse antes de agir sobre ela). */
export async function getCampanhaTenantId(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("campanhas").select("tenant_id").eq("id", id).maybeSingle();
  return data?.tenant_id ?? null;
}

/** Cancela um disparo agendado (se ainda não enviado). */
export async function cancelarDisparo(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("campanhas").update({ status: "cancelada" }).eq("id", id);
  if (error) throw new Error(`Erro ao cancelar: ${error.message}`);
}