import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { temPermissao, type Modulo } from "@/lib/permissions";

/**
 * Guard por permissão de módulo.
 * Se o cargo do usuário não tem acesso ao módulo, mostra acesso negado.
 */
export function RequireRole({ modulo, children }: { modulo: Modulo; children: ReactNode }) {
  const { cargo, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!temPermissao(cargo, modulo)) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-background px-4">
        <div className="max-w-sm rounded-xl border border-warning/30 bg-warning/5 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">
            Acesso restrito
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu cargo atual não tem permissão para acessar este módulo.
            {cargo && (
              <span className="mt-1 block font-semibold text-foreground">
                Cargo: {cargo}
              </span>
            )}
          </p>
          <a
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
