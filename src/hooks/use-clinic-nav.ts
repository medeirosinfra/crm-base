import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { listModulosDoSegmento } from "@/lib/supabase/segmentos";
import { moduloToNavItem, type NavItem } from "@/lib/nav-config";
import { temPermissao } from "@/lib/permissions";

/**
 * Hook que retorna os itens de navegação da clínica logada,
 * derivados do segmento (especialidade) do tenant + cargo do usuário.
 */
export function useClinicNav(): { items: NavItem[]; isLoading: boolean } {
  const { segmento, cargo, tenantId } = useAuth();

  const { data: modulos, isLoading } = useQuery({
    queryKey: ["segmento-modulos", segmento?.codigo ?? "default"],
    queryFn: () => listModulosDoSegmento(segmento?.codigo ?? "default"),
    enabled: !!segmento?.codigo,
  });

  if (!segmento?.codigo) {
    return { items: [], isLoading: false };
  }

  const items = (modulos ?? [])
    .map(moduloToNavItem)
    .filter((item) => temPermissao(cargo, item.codigo as never))
    .filter((item) => !item.url.startsWith("/master")); // clínica não vê rotas master

  return { items, isLoading };
}
