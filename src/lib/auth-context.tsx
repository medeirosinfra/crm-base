import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  tenantId: string | null;
  cargo: string | null;
  signIn: (email: string, senha: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  tenantId: null,
  cargo: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [cargo, setCargo] = useState<string | null>(null);

  // Resolve o tenant do usuário logado (via profile)
  async function resolveProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("tenant_id, cargo, nome")
      .eq("id", uid)
      .single();
    if (data) {
      setTenantId(data.tenant_id ?? null);
      setCargo(data.cargo ?? null);
    }
  }

  useEffect(() => {
    // Busca sessão inicial
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) resolveProfile(u.id);
      setLoading(false);
    });

    // Ouve mudanças de auth (login/logout/refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) resolveProfile(u.id);
      else {
        setTenantId(null);
        setCargo(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setTenantId(null);
    setCargo(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, tenantId, cargo, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
