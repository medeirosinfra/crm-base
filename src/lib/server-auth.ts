import { supabaseAdmin } from "./supabase/server";

// ============================================================
// Resolução de sessão/tenant no servidor, para rotas cruas de
// server.ts que não passam pelo RLS (usam supabaseAdmin/service_role).
// Nunca confiar em tenantId/slug vindos do corpo da requisição —
// sempre derivar do token de acesso do usuário autenticado.
// ============================================================

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export interface SessionTenant {
  userId: string;
  tenantId: string | null;
  cargo: string | null;
  isSuperAdmin: boolean;
}

/** Extrai e valida o Bearer token, resolve o tenant/cargo do usuário via profiles. */
export async function resolveSessionTenant(request: Request): Promise<SessionTenant> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) throw new AuthError("Não autenticado");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new AuthError("Sessão inválida ou expirada");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tenant_id, cargo")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    userId: data.user.id,
    tenantId: profile?.tenant_id ?? null,
    cargo: profile?.cargo ?? null,
    isSuperAdmin: profile?.cargo === "super_admin",
  };
}

/**
 * Resolve o tenant-alvo de uma ação: sempre o próprio tenant do usuário,
 * a menos que seja super_admin explicitamente atuando sobre outro tenant
 * (nesse caso, e só nesse caso, aceita um tenantId pedido explicitamente).
 */
export function resolveTargetTenantId(session: SessionTenant, requestedTenantId?: string | null): string {
  if (session.isSuperAdmin && requestedTenantId) return requestedTenantId;
  if (!session.tenantId) throw new AuthError("Usuário sem clínica vinculada", 403);
  return session.tenantId;
}

export function authErrorResponse(e: unknown): Response {
  const status = e instanceof AuthError ? e.status : 500;
  const erro = e instanceof Error ? e.message : String(e);
  return new Response(JSON.stringify({ erro }), { status, headers: { "content-type": "application/json" } });
}
