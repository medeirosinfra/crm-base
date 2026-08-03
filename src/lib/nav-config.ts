import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Users2,
  Scissors,
  Megaphone,
  MessageSquareMore,
  MessageCircle,
  Wallet,
  BarChart3,
  Palette,
  Bot,
  Stethoscope,
  ShieldCheck,
  Package,
  Building2,
} from "lucide-react";

// ============================================================
// Catálogo de navegação por módulo
// Alimenta MasterSidebar e ClinicSidebar
// ============================================================

export interface NavItem {
  codigo: string;
  titulo: string;
  url: string;
  icon: LucideIcon;
  grupo: "principal" | "configuracao";
  exigenciaCargo: string | null;
}

/** Mapa de ícones por código de módulo (do banco). */
const ICONES: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-days": CalendarDays,
  users: Users,
  "clipboard-list": ClipboardList,
  "users-2": Users2,
  scissors: Scissors,
  megaphone: Megaphone,
  "message-square-more": MessageSquareMore,
  wallet: Wallet,
  "bar-chart-3": BarChart3,
  palette: Palette,
  bot: Bot,
  stethoscope: Stethoscope,
  "shield-check": ShieldCheck,
  package: Package,
  "building-2": Building2,
  "message-circle": MessageCircle,
};

/** Retorna o ícone para um código (fallback: LayoutDashboard). */
export function getIcon(codigo: string): LucideIcon {
  return ICONES[codigo] ?? LayoutDashboard;
}

/** Converte um módulo do banco em NavItem. */
export function moduloToNavItem(modulo: {
  codigo: string;
  nome: string;
  caminho: string | null;
  icone: string | null;
}): NavItem {
  const url = modulo.caminho ?? `/${modulo.codigo}`;
  return {
    codigo: modulo.codigo,
    titulo: modulo.nome,
    url,
    icon: getIcon(modulo.icone ?? modulo.codigo),
    grupo: url.startsWith("/master") ? "configuracao" : "principal",
    exigenciaCargo: null,
  };
}
