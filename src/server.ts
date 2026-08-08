import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

// ============================================================
// Webhook do WAHA — URL estável /webhook/waha
// Recebe mensagens e responde via bots configurados
// (interceptado ANTES do router TanStack)
// ============================================================
import { supabaseAdmin } from "./lib/supabase/server";
import { sendWhatsAppText } from "./lib/waha";
import { criarClinica } from "./server-functions/api-clinicas";
import { iniciarConexaoWhatsapp, statusConexaoWhatsapp, desconectarWhatsapp, setConexaoTenant, nomeSessaoClinica } from "./lib/supabase/whatsapp-connect";
import { gerarMensagemIA } from "./lib/ia";
import { criarDisparoA, listarDisparos, executarDevidos, cancelarDisparo } from "./lib/supabase/disparos-agendados";

interface WahaPayload {
  from?: string;
  body?: string;
  text?: string;
  isGroup?: boolean;
  fromMe?: boolean;
}

async function encontrarBotWaha(texto: string, sessao?: string) {
  const textoLower = texto.toLowerCase();

  // Resolve a clínica (tenant) pela sessão WAHA. Se não achar, usa bots do master.
  let tenantId: string | null = null;
  if (sessao) {
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("waha_sessao", sessao)
      .eq("status", "ativa")
      .maybeSingle();
    tenantId = tenant?.id ?? null;
  }

  // Bots candidatos: do tenant (se resolvido) + bots do master (tenant_id NULL)
  let query = supabaseAdmin.from("bots").select("*").eq("ativo", true);
  if (tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  } else {
    query = query.is("tenant_id", null);
  }
  const { data: bots } = await query;

  // Prioridade: bot do tenant com keyword que bate → master com keyword → geral do tenant → geral do master
  const ordenados = (bots ?? []).sort((a, b) => {
    const aTenant = a.tenant_id ? 1 : 0;
    const bTenant = b.tenant_id ? 1 : 0;
    return bTenant - aTenant; // tenant primeiro
  });

  const porKeyword = ordenados.find(
    (b) => b.keyword && textoLower.includes(String(b.keyword).toLowerCase()),
  );
  if (porKeyword) return porKeyword;
  return ordenados.find((b) => !b.keyword) ?? null;
}

async function handleWahaWebhook(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      session?: string;
      payload?: WahaPayload;
    };
    const session = body.session ?? "crmprincipal";
    const payload = body.payload ?? {};
    const from = payload.from;
    const texto = payload.body ?? payload.text ?? "";
    const ehGrupo = payload.isGroup === true;
    const ehMeu = payload.fromMe === true;

    if (ehGrupo || ehMeu || !from || !texto) {
      return new Response(JSON.stringify({ responded: false, motivo: "ignorada" }), {
        headers: { "content-type": "application/json" },
      });
    }

    const bot = await encontrarBotWaha(texto, session);
    if (!bot) {
      return new Response(JSON.stringify({ responded: false, motivo: "sem_bot" }), {
        headers: { "content-type": "application/json" },
      });
    }

    const respostaTexto = bot.resposta || bot.saudacao || "Em instantes um atendente vai falar com você.";
    await sendWhatsAppText(session, from, respostaTexto);
    return new Response(JSON.stringify({ responded: true, bot: bot.nome }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ responded: false, erro: String(e) }), {
      headers: { "content-type": "application/json" },
    });
  }
}

// ============================================================
// POST /api/clinicas — criar clínica com admin automático
// (rota customizada que contorna o server-fn do TanStack no Docker)
// ============================================================
async function handleCreateClinica(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      nome?: string;
      slug?: string;
      especialidade?: string;
      adminEmail?: string;
      adminNome?: string;
      adminSenha?: string;
      corPrimaria?: string;
      plano?: string;
      wahaSessao?: string;
    };

    if (!body.nome || !body.adminEmail || !body.adminSenha) {
      return new Response(JSON.stringify({ erro: "nome, adminEmail e adminSenha são obrigatórios" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const resultado = await criarClinica({
      nome: body.nome,
      slug: body.slug || body.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      especialidade: body.especialidade ?? "Clínica",
      adminEmail: body.adminEmail,
      adminNome: body.adminNome || body.nome,
      adminSenha: body.adminSenha,
      corPrimaria: body.corPrimaria,
      plano: body.plano,
      wahaSessao: body.wahaSessao,
    });

    return new Response(JSON.stringify(resultado), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

// ============================================================
// WhatsApp da Clínica — POST/GET /api/whatsapp/...
// Conexão por QR: criar/iniciar sessão WAHA da clínica, obter QR,
// checar status. Roda no servidor (não expõe API key do WAHA).
// ============================================================
async function handleWhatsappRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname; // ex: /api/whatsapp/conectar, /api/whatsapp/status

  try {
    // /api/whatsapp/conectar?tenant=&slug=  (cria sessão e retorna QR)
    if (request.method === "POST" && path === "/api/whatsapp/conectar") {
      const body = (await request.json().catch(() => ({}))) as { slug?: string; tenantId?: string };
      if (!body.slug || !body.tenantId) {
        return new Response(JSON.stringify({ erro: "slug e tenantId obrigatórios" }), { status: 400, headers: { "content-type": "application/json" } });
      }
      const result = await iniciarConexaoWhatsapp(body.slug);
      if (result.ok && result.status === "WORKING") {
        await setConexaoTenant(body.tenantId, true);
      }
      return new Response(JSON.stringify(result), { status: result.ok ? 200 : 502, headers: { "content-type": "application/json" } });
    }

    // /api/whatsapp/status?slug=X
    if (request.method === "GET" && path === "/api/whatsapp/status") {
      const slug = url.searchParams.get("slug") ?? "";
      const tenantId = url.searchParams.get("tenantId") ?? "";
      const result = await statusConexaoWhatsapp(slug);
      return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
    }

    // /api/whatsapp/desconectar
    if (request.method === "POST" && path === "/api/whatsapp/desconectar") {
      const body = (await request.json().catch(() => ({}))) as { slug?: string; tenantId?: string };
      if (body.slug) await desconectarWhatsapp(body.slug);
      if (body.tenantId) await setConexaoTenant(body.tenantId, false);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ erro: "rota não encontrada" }), { status: 404, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String((e as Error).message ?? e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

// ============================================================
// Assinatura digital da negociação — GET/POST /api/assinatura/:id
// Página pública (a cliente assina pelo celular, sem login).
// ============================================================
function parseAssinaturaId(url: URL): string | null {
  const m = url.pathname.match(/^\/api\/assinatura\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function handleAssinaturaRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = parseAssinaturaId(url);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  if (!id) return json({ erro: "id inválido" }, 400);

  try {
    // GET — dados públicos do plano p/ exibir o resumo (paciente + procedimento + valor + parcelas)
    if (request.method === "GET") {
      const { data: plano, error } = await supabaseAdmin
        .from("planos_pagamento")
        .select("*, pacientes(nome), procedimentos(nome)")
        .eq("id", id)
        .maybeSingle();
      if (error || !plano) return json({ erro: "Plano não encontrado" }, 404);
      const { data: parcelas } = await supabaseAdmin.from("parcelas").select("numero, vencimento, valor, pago, status").eq("plano_id", id).order("numero");
      return json({
        id: plano.id,
        descricao: plano.descricao,
        valor_total: plano.valor_total,
        entrada: plano.entrada,
        num_parcelas: plano.num_parcelas,
        paciente_nome: (plano.pacientes as { nome?: string } | null)?.nome ?? null,
        procedimento_nome: (plano.procedimentos as { nome?: string } | null)?.nome ?? null,
        status: plano.status,
        assinado: Boolean(plano.assinatura_data && plano.assinatura_nome),
        assinatura_nome: plano.assinatura_nome,
        assinatura_em: plano.assinatura_em,
        parcelas: parcelas ?? [],
      });
    }

    // POST — recebe a assinatura (imagem base64 + nome) e grava no plano
    if (request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { imagem?: string; nome?: string };
      if (!body.imagem || !body.nome?.trim()) {
        return json({ erro: "imagem e nome são obrigatórios" }, 400);
      }
      const nome = body.nome.trim().slice(0, 200);
      const imagem = body.imagem.startsWith("data:") ? body.imagem : `data:image/png;base64,${body.imagem}`;
      const { error } = await supabaseAdmin
        .from("planos_pagamento")
        .update({ assinatura_data: imagem, assinatura_nome: nome, assinatura_em: new Date().toISOString() })
        .eq("id", id);
      if (error) return json({ erro: `Erro ao salvar assinatura: ${error.message}` }, 500);
      return json({ ok: true });
    }

    return json({ erro: "método não suportado" }, 405);
  } catch (e) {
    return json({ erro: String((e as Error).message ?? e) }, 500);
  }
}

// ============================================================
// Automações: geração de mensagem com IA + disparos agendados
// POST /api/ia/gerar-mensagem     → gera texto com a IA
// GET  /api/disparos              → lista disparos (master)
// POST /api/disparos/agendar      → agenda um disparo
// GET  /api/disparos/devidos      → processa disparos vencidos (cron)
// POST /api/disparos/:id/cancelar → cancela um disparo
// ============================================================
const j = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// ============================================================
// GET /api/tenant/:subdominio — branding público da clínica
// (usado na página de login p/ exibir nome/cor do tenant)
// Retorna só dados públicos (nome, cor) — service_role no servidor.
// ============================================================
async function handleTenantBySubdominio(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/api\/tenant\/([^/]+)$/);
  if (!m) return j({ erro: "subdomínio inválido" }, 400);
  const sub = m[1].toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, nome, cor_primaria, cor_segundaria, logo_url")
    .eq("subdominio", sub)
    .maybeSingle();
  if (error || !data) return j({ erro: "clínica não encontrada" }, 404);

  return j({
    id: data.id,
    nome: data.nome,
    corPrimaria: data.cor_primaria,
    corSegundaria: data.cor_segundaria,
    logoUrl: data.logo_url,
  });
}

async function handleGerarMensagem(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      servico?: string;
      clinica?: string;
      publico?: string;
      tom?: string;
    };
    if (!body.servico?.trim()) return j({ erro: "servico é obrigatório" }, 400);
    const texto = await gerarMensagemIA({
      servico: body.servico.trim(),
      clinica: body.clinica,
      publico: body.publico,
      tom: body.tom,
    });
    return j({ texto });
  } catch (e) {
    return j({ erro: String((e as Error).message ?? e) }, 500);
  }
}

async function handleDisparosRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    const idMatch = path.match(/^\/api\/disparos\/([^/]+)\/cancelar$/);
    if (idMatch && request.method === "POST") {
      await cancelarDisparo(idMatch[1]);
      return j({ ok: true });
    }

    if (request.method === "POST" && path === "/api/disparos/agendar") {
      const body = (await request.json().catch(() => ({}))) as {
        nome?: string;
        tenantId?: string;
        mensagem?: string;
        wahaSessao?: string;
        contatos?: { telefone: string; nome?: string | null }[];
        janela?: string | null;
        horaAgendamento?: string | null;
        mensagemIa?: boolean;
      };
      if (!body.nome || !body.tenantId || !body.mensagem || !body.contatos?.length || !body.wahaSessao) {
        return j({ erro: "nome, tenantId, mensagem, contatos e wahaSessao são obrigatórios" }, 400);
      }
      const res = await criarDisparoA({
        nome: body.nome,
        tenantId: body.tenantId,
        mensagem: body.mensagem,
        wahaSessao: body.wahaSessao,
        contatos: body.contatos,
        janela: body.janela,
        horaAgendamento: body.horaAgendamento,
        mensagemIa: body.mensagemIa,
      });
      return j({ id: res.id, next_due: res.next_due }, 201);
    }

    if (request.method === "GET" && path === "/api/disparos/devidos") {
      const res = await executarDevidos();
      return j(res);
    }

    if (request.method === "GET" && path === "/api/disparos") {
      const disparos = await listarDisparos();
      return j({ data: disparos });
    }

    return j({ erro: "rota não encontrada" }, 404);
  } catch (e) {
    return j({ erro: String((e as Error).message ?? e) }, 500);
  }
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Webhook do WAHA — intercepta antes do router
    if (request.method === "POST" && new URL(request.url).pathname === "/webhook/waha") {
      return handleWahaWebhook(request);
    }

    // Criar clínica — rota customizada (contorna server-fn)
    if (request.method === "POST" && new URL(request.url).pathname === "/api/clinicas") {
      return handleCreateClinica(request);
    }

    // WhatsApp da clínica — conexão por QR
    if (new URL(request.url).pathname.startsWith("/api/whatsapp/")) {
      return handleWhatsappRoute(request);
    }

    // Assinatura digital da negociação — público
    if (new URL(request.url).pathname.startsWith("/api/assinatura/")) {
      return handleAssinaturaRoute(request);
    }

    // Tenant por subdomínio — branding público (login)
    if (request.method === "GET" && new URL(request.url).pathname.startsWith("/api/tenant/")) {
      return handleTenantBySubdominio(request);
    }

    // IA — gera mensagem de venda (server-side, protege a API key)
    if (request.method === "POST" && new URL(request.url).pathname === "/api/ia/gerar-mensagem") {
      return handleGerarMensagem(request);
    }

    // Disparos agendados — criar/listar/executar/cancelar
    if (new URL(request.url).pathname.startsWith("/api/disparos")) {
      return handleDisparosRoute(request);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
