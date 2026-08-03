import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Guard: só super_admin acessa (painel master do dono).
 */
export function RequireMaster({ children }: { children: ReactNode }) {
  const { cargo, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (cargo !== "super_admin") {
    return <Navigate to="/agenda" />;
  }

  return <>{children}</>;
}
