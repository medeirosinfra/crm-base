// ============================================================
// Query keys centralizadas (evita strings mágicas)
// Uso: queryKeys.pacientes.list, queryKeys.agendamentos.detail(id)
// ============================================================

export const queryKeys = {
  dashboard: {
    resumo: ["dashboard", "resumo"] as const,
    faturamento: ["dashboard", "faturamento"] as const,
    procedimentosTop: ["dashboard", "procedimentos-top"] as const,
    pacientesNovos: ["dashboard", "pacientes-novos"] as const,
  },
  tenants: {
    list: ["tenants"] as const,
    detail: (id: string) => ["tenants", id] as const,
  },
  pacientes: {
    list: ["pacientes"] as const,
    detail: (id: string) => ["pacientes", id] as const,
    agendamentos: (id: string) => ["pacientes", id, "agendamentos"] as const,
    transacoes: (id: string) => ["pacientes", id, "transacoes"] as const,
  },
  agendamentos: {
    list: ["agendamentos"] as const,
    detail: (id: string) => ["agendamentos", id] as const,
  },
  procedimentos: {
    list: ["procedimentos"] as const,
  },
  campanhas: {
    list: ["campanhas"] as const,
  },
  financeiro: {
    transacoes: ["transacoes"] as const,
    produtos: ["produtos"] as const,
  },
  waha: {
    sessions: ["waha-sessions"] as const,
  },
};
