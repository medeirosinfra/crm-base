// ============================================================
// Resolução de tenant por subdomínio
// Ex: clinicabotox.crm.medeirossolucoestech.com.br → 'clinicabotox'
// ============================================================

const NAO_SUBDOMINIO = [
  "localhost",
  "www",
  "app",
  "crm",
  "admin",
  "172",
  "10",
  "127",
  "192",
  "0",
  "::1",
];

/** Extrai o subdomínio de um host. Ex: sisluana.meudominio.com → sisluana */
export function getSubdomainFromHost(host: string): string | null {
  const hostname = (host || "").split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (parts.length < 3 || NAO_SUBDOMINIO.includes(parts[0])) return null;
  return parts[0];
}

/** Extrai o subdomínio do host atual (browser). */
export function getSubdomainFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  return getSubdomainFromHost(window.location.host);
}
