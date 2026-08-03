import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

/**
 * Guard: usuário de clínica (com tenant_id). Se for super_admin (sem tenant),
 * redireciona para o painel master.
 */
export function RequireClinic({ children }: { children: ReactNode }) {
  const { tenantId, cargo, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Super admin sem tenant vai para o master
  if (cargo === "super_admin" && !tenantId) {
    return <Navigate to="/master" />;
  }

  return <>{children}</>;
}
