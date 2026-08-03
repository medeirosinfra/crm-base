// ============================================================
// Tema White-Label dinâmico
// Cada tenant (clínica) tem sua cor primária. Aplicamos via
// CSS variables em data-theme no <html>.
// ============================================================

export interface TenantTheme {
  corPrimaria?: string | null;   // ex: "#e11d48"
  corSegundaria?: string | null;
}

// Converte hex (#e11d48) para oklch (para usar no CSS do projeto)
// Fallback: usa a cor hex direto (browser converte)
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// Extrai o matiz (hue em graus) de uma cor hex, para derivar tons de fundo
// que combinam com a cor primária do tenant (em vez de fundo roxo fixo).
function hueFromHex(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return Math.round(hue);
}

// Aplica o tema do tenant no documento (data-theme + CSS vars inline)
export function applyTenantTheme(theme: TenantTheme | null) {
  if (typeof document === "undefined") return; // SSR guard

  const root = document.documentElement;
  const primary = theme?.corPrimaria || "#e11d48";
  const secondary = theme?.corSegundaria || "#0f172a";

  // rgb da cor primária para gerar o glow
  const rgb = hexToRgb(primary);

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty("--primary-glow", `rgba(${rgb}, 0.6)`);
  root.style.setProperty("--ring", primary);

  // Gradiente e glow derivados da cor do tenant (antes eram fixos no master)
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, ${primary}, ${secondary})`);
  root.style.setProperty("--shadow-glow", `0 8px 32px -8px rgba(${rgb}, 0.45)`);

  // Deriva os tons de fundo do matiz da cor do tenant (antes eram roxo fixo 275).
  // Ex: azul → fundo azulado; verde → fundo esverdeado — identidade visual real.
  const hue = hueFromHex(primary);
  root.style.setProperty("--background", `oklch(0.16 0.015 ${hue})`);
  root.style.setProperty("--card", `oklch(0.20 0.018 ${hue})`);
  root.style.setProperty("--popover", `oklch(0.20 0.018 ${hue})`);
  root.style.setProperty("--secondary", `oklch(0.26 0.02 ${hue})`);
  root.style.setProperty("--muted", `oklch(0.24 0.018 ${hue})`);
  root.style.setProperty("--sidebar", `oklch(0.20 0.02 ${hue})`);
  root.style.setProperty("--border", `oklch(0.28 0.02 ${hue})`);
  root.style.setProperty("--input", `oklch(0.26 0.02 ${hue})`);

  // Marca o tema ativo (útil para debug)
  root.setAttribute("data-tenant-theme", theme?.corPrimaria ? "custom" : "default");
}

// Hook usado para carregar o tema do tenant logado
export function getTenantThemeFromStorage(): TenantTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("tenant-theme");
    return raw ? (JSON.parse(raw) as TenantTheme) : null;
  } catch {
    return null;
  }
}

export function saveTenantTheme(theme: TenantTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tenant-theme", JSON.stringify(theme));
  applyTenantTheme(theme);
}
