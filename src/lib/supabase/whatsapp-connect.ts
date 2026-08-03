import { supabaseAdmin } from "./server";

// ============================================================
// Service de Conexão do WhatsApp da clínica (via WAHA)
// Cada clínica tem sua própria sessão WAHA (nome = slug da clínica).
// Usa o WAHA base (172.16.0.50:3000) com a API key do servidor.
// RODA NO SERVIDOR (server.ts) — não expõe credenciais no browser.
// ============================================================

const WAHA_URL = process.env.WAHA_BASE_URL_HTTP || "http://172.16.0.50:3000";
const WAHA_KEY = process.env.WAHA_API_KEY || "";

async function waha(method: string, path: string, body?: unknown, accept?: string) {
  const res = await fetch(`${WAHA_URL}${path}`, {
    method,
    headers: {
      "X-Api-Key": WAHA_KEY,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(accept ? { Accept: accept } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("image")) {
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, image: `data:image/png;base64,${buf.toString("base64")}` };
  }
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

/** Retorna o nome da sessão WAHA da clínica (slug do tenant). */
export function nomeSessaoClinica(slug: string): string {
  return `clinica_${slug}`;
}

/** Cria e inicia a sessão WAHA da clínica, retornando o QR. */
export async function iniciarConexaoWhatsapp(slug: string): Promise<{
  ok: boolean;
  status: string;
  qr?: string;
  erro?: string;
}> {
  const sessao = nomeSessaoClinica(slug);

  // 1. Cria a sessão (idempotente)
  await waha("POST", `/api/sessions`, { name: sessao });

  // 2. Inicia (SCAN_QR_CODE)
  await waha("POST", `/api/sessions/${sessao}/start`, {});

  // 3. Aguarda entrar em SCAN_QR_CODE e lê o QR
  for (let i = 0; i < 8; i++) {
    const s = await waha("GET", `/api/sessions/${sessao}`);
    const status = (s.json as { status?: string })?.status ?? "";
    if (status === "SCAN_QR_CODE") {
      const qr = await waha("GET", `/api/${sessao}/auth/qr`, undefined, "image/png");
      return { ok: true, status, qr: qr.image };
    }
    if (status === "WORKING") return { ok: true, status };
    await new Promise((r) => setTimeout(r, 500));
  }

  return { ok: false, status: "timeout", erro: "Tempo esgotado ao obter o QR" };
}

/** Checa o status atual da sessão WAHA da clínica. */
export async function statusConexaoWhatsapp(slug: string): Promise<{
  ok: boolean;
  status: string;
  numero?: string;
  erro?: string;
}> {
  const sessao = nomeSessaoClinica(slug);
  const s = await waha("GET", `/api/sessions/${sessao}`);
  const j = (s.json ?? {}) as { status?: string; me?: { id?: string } | null };
  if (s.status === 404) return { ok: false, status: "inexistente" };
  return {
    ok: j.status === "WORKING",
    status: j.status ?? "desconhecido",
    conectado: j.me?.id ?? undefined,
  };
}

/** Remove a sessão (desconexão). */
export async function desconectarWhatsapp(slug: string): Promise<void> {
  const sessao = nomeSessaoClinica(slug);
  await waha("DELETE", `/api/sessions/${sessao}`);
}

/** Marca o tenant como conectado/desconectado. */
export async function setConexaoTenant(tenantId: string, conectado: boolean): Promise<void> {
  await supabaseAdmin.from("tenants").update({ whatsapp_conectado: conectado }).eq("id", tenantId);
}