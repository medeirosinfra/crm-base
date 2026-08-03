import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { applyTenantTheme, getTenantThemeFromStorage } from "@/lib/theme";

// Busca o tenant do usuário logado (via profile → tenant)
async function fetchUserTenant() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  // Busca o profile do usuário para obter o tenant_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) return null;

  // Busca o tenant (clínica) com o branding
  const { data: tenant } = await supabase
    .from("tenants")
    .select("cor_primaria, cor_segundaria, nome, logo_url")
    .eq("id", profile.tenant_id)
    .single();

  return tenant;
}

// Hook que aplica o tema white-label do tenant logado.
// Reage à sessão (useAuth) para reaplicar a cor ao trocar de usuário
// (ex: logout do master → login da clínica), evitando o fallback rosa.
export function useTenantTheme() {
  const { user } = useAuth();

  const { data: tenant } = useQuery({
    queryKey: ["user-tenant-theme", user?.id ?? "anon"],
    queryFn: fetchUserTenant,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  useEffect(() => {
    // Aplica o tema do banco se disponível, senão usa o salvo em storage
    if (tenant) {
      applyTenantTheme({
        corPrimaria: tenant.cor_primaria,
        corSegundaria: tenant.cor_segundaria,
      });
    } else if (!user) {
      // Sem usuário logado → volta ao tema padrão
      applyTenantTheme(null);
    } else {
      const saved = getTenantThemeFromStorage();
      if (saved) applyTenantTheme(saved);
    }
  }, [tenant, user]);
}
