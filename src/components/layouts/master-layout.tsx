import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MasterSidebar } from "@/components/master-sidebar";
import { Toaster } from "@/components/ui/sonner";

/** Layout do painel Master (super_admin / dono da plataforma). */
export function MasterLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <MasterSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="hidden text-muted-foreground sm:inline">
                Painel Master — plataforma white-label
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
