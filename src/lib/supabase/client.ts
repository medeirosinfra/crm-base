import { createClient } from "@supabase/supabase-js";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_ANON_KEY) {
  throw new Error("Supabase anon key é obrigatória (VITE_SUPABASE_PUBLISHABLE_KEY)");
}

/**
 * Resolve a URL do Supabase:
 * - No browser: MESMO host atual + /supabase (mesma origem → sem CORS),
 *   para funcionar em qualquer subdomínio de clínica (draluana.…, clinicaX.…).
 * - Em SSR/node (sem window): a URL fixa do build (`https://crm.…/supabase`).
 * O app já proxiia /supabase/** → Kong local para qualquer host (vite routeRules),
 * então cada subdomínio conversa com a própria instância sem fetch cross-origin.
 */
function resolverSupabaseUrl(): string {
  if (typeof window !== "undefined") {
    try {
      return `${window.location.origin}/supabase`;
    } catch {
      // fallback abaixo
    }
  }
  return import.meta.env.VITE_SUPABASE_URL as string;
}

const supabaseUrl = resolverSupabaseUrl();

// Cliente público (browser) - respeita RLS
export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);