// ============================================================
// Sistema de Roles & Permissões
// Cargos: super_admin, admin, gerente, financeiro, staff
// ============================================================

export type Cargo = "super_admin" | "admin" | "gerente" | "financeiro" | "staff";

export const CARGOS: Cargo[] = ["super_admin", "admin", "gerente", "financeiro", "staff"];

export const CARGO_LABELS: Record<Cargo, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  gerente: "Gerente",
  financeiro: "Financeiro",
  staff: "Atendente",
};

// Rótulos de módulos (rotas) para exibição
export type Modulo =
  | "dashboard"
  | "clinicas"
  | "agenda"
  | "pacientes"
  | "anamnese"
  | "contatos"
  | "procedimentos"
  | "campanhas"
  | "disparador"
  | "financeiro"
  | "white_label"
  | "automacoes"
  | "relatorios"
  | "funcionarios"
  | "setores";

export const MODULO_LABELS: Record<Modulo, string> = {
  dashboard: "Dashboard",
  clinicas: "Gestão de Clínicas",
  agenda: "Agenda",
  pacientes: "Pacientes",
  anamnese: "Anamnese & Avaliação",
  contatos: "Contatos & Leads",
  procedimentos: "Procedimentos",
  campanhas: "Campanhas",
  disparador: "Disparador WhatsApp",
  financeiro: "Financeiro",
  white_label: "White-Label",
  automacoes: "Automações",
  relatorios: "Relatórios",
  funcionarios: "Funcionários",
  setores: "Setores",
};

// Mapa de permissões por cargo.
// super_admin: acesso total (painel master, todas as clínicas)
// admin: gestão completa da própria clínica
// gerente: quase tudo, menos branding/white-label
// financeiro: foco em financeiro, relatórios
// staff: operação básica (agenda, pacientes, atendimento)
export const PERMISSOES: Record<Cargo, Modulo[]> = {
  super_admin: [
    "dashboard",
    "clinicas",
    "agenda",
    "pacientes",
    "anamnese",
    "contatos",
    "procedimentos",
    "campanhas",
    "disparador",
    "financeiro",
    "white_label",
    "automacoes",
    "relatorios",
    "funcionarios",
    "setores",
  ],
  admin: [
    "dashboard",
    "agenda",
    "pacientes",
    "anamnese",
    "contatos",
    "procedimentos",
    "campanhas",
    "disparador",
    "financeiro",
    "white_label",
    "automacoes",
    "relatorios",
    "funcionarios",
    "setores",
  ],
  gerente: [
    "dashboard",
    "agenda",
    "pacientes",
    "anamnese",
    "contatos",
    "procedimentos",
    "campanhas",
    "disparador",
    "financeiro",
    "relatorios",
    "funcionarios",
  ],
  financeiro: ["dashboard", "financeiro", "relatorios", "pacientes"],
  staff: ["dashboard", "agenda", "pacientes", "anamnese", "contatos", "disparador"],
};

/** Verifica se um cargo tem acesso a um módulo */
export function temPermissao(cargo: Cargo | string | null, modulo: Modulo): boolean {
  if (!cargo) return false;
  const permissoes = PERMISSOES[cargo as Cargo];
  if (!permissoes) return false;
  return permissoes.includes(modulo);
}

/** Mapeia rota → módulo para proteção por rota */
export function moduloDaRota(pathname: string): Modulo | null {
  const mapa: Record<string, Modulo> = {
    "/": "dashboard",
    "/clinicas": "clinicas",
    "/agenda": "agenda",
    "/pacientes": "pacientes",
    "/contatos": "contatos",
    "/procedimentos": "procedimentos",
    "/campanhas": "campanhas",
    "/disparador": "disparador",
    "/financeiro": "financeiro",
    "/white-label": "white_label",
    "/automacoes": "automacoes",
    "/relatorios": "relatorios",
  };
  return mapa[pathname] ?? null;
}
