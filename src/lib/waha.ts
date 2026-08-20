// ============================================================
// Integração com WAHA (WhatsApp HTTP API)
// Envio de mensagens via WAHA já rodando no servidor.
//
// IMPORTANTE: só pode ser importado por código server-only (server.ts e
// server-functions/*). Usa process.env (nunca import.meta.env/VITE_*)
// de propósito — se algum componente de página importar este arquivo,
// o bundler não consegue inlinar a chave real no JS do navegador, e a
// chamada simplesmente falha em vez de vazar a API key pra qualquer
// visitante do site.
// ============================================================

const WAHA_BASE_URL = process.env.WAHA_BASE_URL_HTTP || "http://172.16.0.50:3000";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";

export interface SendTextResult {
  id: string;
  [key: string]: unknown;
}

/** Envia uma mensagem de texto via WAHA para um chatId (ex: 5511999999999@c.us) */
export async function sendWhatsAppText(
  session: string,
  chatId: string,
  text: string,
): Promise<SendTextResult> {
  const res = await fetch(`${WAHA_BASE_URL}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": WAHA_API_KEY,
    },
    body: JSON.stringify({ session, chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WAHA erro ${res.status}: ${body}`);
  }

  return (await res.json()) as SendTextResult;
}

/** Lista as sessões do WAHA (para o painel mostrar quais estão conectadas) */
export async function listWahaSessions(): Promise<{ name: string; status: string }[]> {
  const res = await fetch(`${WAHA_BASE_URL}/api/sessions`, {
    headers: { "X-Api-Key": WAHA_API_KEY },
  });
  if (!res.ok) throw new Error(`WAHA erro ${res.status}`);
  const data = await res.json();
  return (data as { name: string; status: string }[]).map((s) => ({
    name: s.name,
    status: s.status,
  }));
}
