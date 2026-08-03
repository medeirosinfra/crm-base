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
