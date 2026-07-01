import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Stethoscope,
  MessageSquareMore,
  Palette,
  Wallet,
  ShoppingCart,
  Bot,
  Users2,
  BarChart3,
  Settings,
  LogOut,
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

const primaryNav = [
  { title: "Visão Geral SaaS", url: "/", icon: LayoutDashboard },
  { title: "Gestão de Clínicas (CRM)", url: "/clinicas", icon: Stethoscope },
  { title: "Disparador Multicanal", url: "/disparador", icon: MessageSquareMore },
  { title: "Configuração White-Label", url: "/white-label", icon: Palette },
  { title: "Financeiro & Estoque", url: "/financeiro", icon: Wallet },
];

const businessNav = [
  { title: "PDV & Vendas", url: "/pdv", icon: ShoppingCart },
  { title: "Automações & IA", url: "/automacoes", icon: Bot },
  { title: "Contatos & Leads", url: "/contatos", icon: Users2 },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

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
                Business Suite
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Painel White-Label
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-11 rounded-lg data-[active=true]:gradient-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-glow data-[active=true]:font-semibold"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
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
              Business Suite
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {businessNav.map((item) => (
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
            MM
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                Marcio Medeiros
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Administrador Master
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              aria-label="Sair"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Desconectar Painel
          </button>
        )}
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">v1.0 · WAHA + N8N</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
