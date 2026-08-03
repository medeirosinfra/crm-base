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

interface WahaPayload {
  from?: string;
  body?: string;
  text?: string;
  isGroup?: boolean;
  fromMe?: boolean;
}

async function encontrarBotWaha(texto: string) {
  const textoLower = texto.toLowerCase();
  const { data: bots } = await supabaseAdmin.from("bots").select("*").eq("ativo", true);
  const porKeyword = (bots ?? []).find(
    (b) => b.keyword && textoLower.includes(String(b.keyword).toLowerCase()),
  );
  if (porKeyword) return porKeyword;
  return (bots ?? []).find((b) => !b.keyword) ?? null;
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

    const bot = await encontrarBotWaha(texto);
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
