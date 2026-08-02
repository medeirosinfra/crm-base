import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL e anon key são obrigatórios (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)");
}

// Cliente público (browser) - respeita RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
