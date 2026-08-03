import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Stethoscope,
  MessageSquareMore,
  Palette,
  Wallet,
  CalendarDays,
  Users,
  Bot,
  Users2,
  BarChart3,
  Settings,
  LogOut,
  Scissors,
  Megaphone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { temPermissao, type Modulo } from "@/lib/permissions";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  modulo: Modulo;
}

const primaryNav: NavItem[] = [
  { title: "Visão Geral SaaS", url: "/", icon: LayoutDashboard, modulo: "dashboard" },
  { title: "Gestão de Clínicas (CRM)", url: "/clinicas", icon: Stethoscope, modulo: "clinicas" },
  { title: "Agenda & Agendamentos", url: "/agenda", icon: CalendarDays, modulo: "agenda" },
  { title: "Pacientes", url: "/pacientes", icon: Users, modulo: "pacientes" },
  { title: "Contatos & Leads", url: "/contatos", icon: Users2, modulo: "contatos" },
  { title: "Procedimentos & Tratamentos", url: "/procedimentos", icon: Scissors, modulo: "procedimentos" },
  { title: "Campanhas", url: "/campanhas", icon: Megaphone, modulo: "campanhas" },
  { title: "Disparador Multicanal", url: "/disparador", icon: MessageSquareMore, modulo: "disparador" },
  { title: "Financeiro", url: "/financeiro", icon: Wallet, modulo: "financeiro" },
];

const configNav: NavItem[] = [
  { title: "White-Label (Branding)", url: "/white-label", icon: Palette, modulo: "white_label" },
  { title: "Automações & IA", url: "/automacoes", icon: Bot, modulo: "automacoes" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, modulo: "relatorios" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { signOut, user, cargo } = useAuth();
  const collapsed = state === "collapsed";

  // Fallback: se o cargo ainda não carregou mas há usuário logado,
  // mostra todos os itens (evita menu vazio). O RBAC real é validado
  // no backend/RLS e nas rotas com RequireRole.
  const cargoEfetivo = cargo ?? (user ? "super_admin" : null);

  // Filtra a navegação conforme o cargo do usuário
  const primaryVisible = primaryNav.filter((item) => temPermissao(cargoEfetivo, item.modulo));
  const configVisible = configNav.filter((item) => temPermissao(cargoEfetivo, item.modulo));
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow font-display text-sm font-bold">
            MI
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-sidebar-foreground">
                MedeirosInfra
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Clínicas Suite
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Gestão da Clínica
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryVisible.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-10 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate text-sm">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Configuração
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {configVisible.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-10 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate text-sm">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
            {user?.email?.charAt(0).toUpperCase() || "M"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.email ?? "Usuário"}
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Painel da Clínica
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Desconectar Painel
          </button>
        )}
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">v1.0 · Clínicas</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
