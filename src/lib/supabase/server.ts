import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase URL e service role key são obrigatórios (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
}

// Cliente de servidor (service role) - BYPASSA RLS (uso restrito ao backend)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
