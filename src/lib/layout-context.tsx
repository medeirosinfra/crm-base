import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

// Contexto simples que indica se o usuário está no painel master ou da clínica.
// Útil para componentes que precisam saber o "modo" (ex: sidebar).
interface LayoutContextValue {
  isMaster: boolean;
}

const LayoutContext = createContext<LayoutContextValue>({ isMaster: false });

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { isMaster } = useAuth();
  return <LayoutContext.Provider value={{ isMaster }}>{children}</LayoutContext.Provider>;
}

export function useLayoutMode() {
  return useContext(LayoutContext);
}
