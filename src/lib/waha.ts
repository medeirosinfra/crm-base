// ============================================================
// Integração com WAHA (WhatsApp HTTP API)
// Envio de mensagens via WAHA já rodando no servidor.
// ============================================================

const WAHA_BASE_URL = import.meta.env.VITE_WAHA_BASE_URL || "http://172.16.0.50:3000";
const WAHA_API_KEY = import.meta.env.VITE_WAHA_API_KEY || "";

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
