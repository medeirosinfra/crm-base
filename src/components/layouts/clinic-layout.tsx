import type { ReactNode } from "react";
import { Radio } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClinicSidebar } from "@/components/clinic-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useTenantTheme } from "@/hooks/use-tenant-theme";

/** Layout do painel da Clínica (admin/staff da clínica). */
export function ClinicLayout({ children }: { children: ReactNode }) {
  // Aplica o tema white-label da clínica logada
  useTenantTheme();

  return (
    <SidebarProvider>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <ClinicSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-semibold text-success">
                <Radio className="h-3 w-3" />
                WhatsApp Online
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
