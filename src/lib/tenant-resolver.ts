// ============================================================
// Resolução de tenant por subdomínio
// Ex: draluana.medeirossolucoestech.com.br → 'draluana'
// ============================================================

const DOMINIO_RAIZ = "medeirossolucoestech.com.br";

// Prefixos que NUNCA são subdomínio de clínica
const NAO_SUBDOMINIO = [
  "localhost",
  "www",
  "app",
  "crm",
  "admin",
  "gestao",
  "prospect",
  "site",
  "supabase",
  "n8n",
  "172",
  "10",
  "127",
  "192",
  "0",
  "::1",
];

/**
 * Extrai o subdomínio de um host.
 * Suporta 2 formatos:
 *   crm.medeirossolucoestech.com.br           → null (crm = app master)
 *   draluana.medeirossolucoestech.com.br      → 'draluana'
 *   draluana.crm.medeirossolucoestech.com.br  → 'draluana' (legado, 3 partes)
 *   medeirossolucoestech.com.br               → null (raiz)
 */
export function getSubdomainFromHost(host: string): string | null {
  const hostname = (host || "").split(":")[0].toLowerCase().replace(/\.$/, "");
  const parts = hostname.split(".");

  // Host é só "localhost" ou IP simples → sem subdomínio
  if (parts.length < 2 || NAO_SUBDOMINIO.includes(parts[0])) return null;

  // Formato 2 partes: draluana.medeirossolucoestech.com.br
  // parts = ['draluana','medeirossolucoestech','com','br']
  if (parts.length === 4 && hostname.endsWith(DOMINIO_RAIZ)) {
    const sub = parts[0];
    // "www" e "crm" já estão na lista de exclusão
    return NAO_SUBDOMINIO.includes(sub) ? null : sub;
  }

  // Formato 3+ partes (legado): draluana.crm.medeirossolucoestech.com.br
  if (parts.length >= 5 && hostname.endsWith(`crm.${DOMINIO_RAIZ}`)) {
    const sub = parts[0];
    return NAO_SUBDOMINIO.includes(sub) ? null : sub;
  }

  return null;
}

/** Extrai o subdomínio do host atual (browser). */
export function getSubdomainFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  return getSubdomainFromHost(window.location.host);
}

/**
 * Resolve o tenant (clínica) pelo subdomínio, com branding.
 * Usa o endpoint público do servidor (/api/tenant/:sub) — o browser
 * não pode ler a tabela tenants (RLS bloqueia anon), então o servidor
 * (service_role) retorna só os dados públicos de branding.
 */
export async function resolverTenantPorSubdominio(
  sub: string,
): Promise<{ id: string; nome: string; corPrimaria?: string | null; corSegundaria?: string | null; logoUrl?: string | null } | null> {
  if (!sub) return null;
  try {
    const res = await fetch(`/api/tenant/${encodeURIComponent(sub)}`);
    if (!res.ok) return null;
    return (await res.json()) as {
      id: string;
      nome: string;
      corPrimaria?: string | null;
      corSegundaria?: string | null;
      logoUrl?: string | null;
    };
  } catch {
    return null;
  }
}
