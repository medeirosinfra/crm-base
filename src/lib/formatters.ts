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

/** Formata data ISO (YYYY-MM-DD ou timestamptz) para pt-BR. */
export function formatData(iso: string | null | undefined, comHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = comHora
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" };
  return d.toLocaleDateString("pt-BR", opts);
}

/** Formata data longa (ex: "segunda-feira, 2 de agosto"). */
export function formatDataLonga(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
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

/** Extrai hora de um ISO (HH:mm). */
export function formatHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
