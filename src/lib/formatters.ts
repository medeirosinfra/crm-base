// ============================================================
// Formatters reutilizáveis (BRL, datas, telefone)
// ============================================================

/** Formata número para moeda brasileira (R$). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Formata valor sem casas decimais (para KPIs). */
export function formatBRLInt(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formata data ISO (YYYY-MM-DD ou timestamptz) para pt-BR.
 * IMPORTANTE: renderização determinística (sem toLocaleDateString/Intl,
 * que dependem de timezone do ambiente) para garantir hidratação SSR == client
 * e evitar o bug "React hydration #418" ao abrir páginas.
 */
export function formatData(iso: string | null | undefined, comHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  if (comHora) {
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }
  return `${dd}/${mm}/${yyyy}`;
}

/** Formata data longa (ex: "02 de agosto"). Determinístico (UTC). */
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
export function formatDataLonga(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")} de ${MESES_LONGOS[d.getUTCMonth()]}`;
}

/** Formata telefone (5511999999999 → (11) 99999-9999). */
export function formatTelefone(telefone: string | null | undefined): string {
  if (!telefone) return "—";
  const digits = telefone.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return telefone;
}

/** Extrai hora de um ISO (HH:mm). Determinístico (UTC) p/ hidratação estável. */
export function formatHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
