import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Wallet,
  Scissors,
  Users,
  CalendarDays,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getFaturamentoMensal,
  getTopProcedimentos,
  getNovosPacientesPorMes,
  getAgendamentosPorStatus,
  getTotaisRelatorio,
} from "@/lib/supabase/relatorios";
import { formatBRL } from "@/lib/formatters";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [{ title: "Relatórios & BI — MedeirosInfra" }],
  }),
  component: () => (
    <RequireAuth>
      <RelatoriosPage />
    </RequireAuth>
  ),
});

function RelatoriosPage() {
  const { data: faturamento, isLoading: loadingFat } = useQuery({
    queryKey: ["relatorio", "faturamento"],
    queryFn: () => getFaturamentoMensal(6),
  });
  const { data: procedimentos } = useQuery({
    queryKey: ["relatorio", "procedimentos"],
    queryFn: () => getTopProcedimentos(5),
  });
  const { data: pacientesMes } = useQuery({
    queryKey: ["relatorio", "pacientes"],
    queryFn: () => getNovosPacientesPorMes(6),
  });
  const { data: statusAgenda } = useQuery({
    queryKey: ["relatorio", "agendamentos"],
    queryFn: getAgendamentosPorStatus,
  });
  const { data: totais } = useQuery({
    queryKey: ["relatorio", "totais"],
    queryFn: getTotaisRelatorio,
  });

  const maxFaturamento = Math.max(
    ...(faturamento ?? []).map((m) => Math.max(m.receitas, m.despesas, 1)),
  );
  const maxPacientes = Math.max(...(pacientesMes ?? []).map((m) => m.total, 1));
  const maxProced = Math.max(...(procedimentos ?? []).map((p) => p.quantidade, 1));

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Analytics
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Relatórios & BI
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            DRE, faturamento, procedimentos, pacientes e agenda com dados reais da sua clínica.
          </p>
        </header>

        {/* Cards de totais */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-border/60 p-5">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="mt-1 font-display text-xl font-bold text-success">
              {totais ? formatBRL(totais.receitas) : "—"}
            </p>
            <TrendingUp className="mt-2 h-4 w-4 text-success" />
          </Card>
          <Card className="border-border/60 p-5">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="mt-1 font-display text-xl font-bold text-destructive">
              {totais ? formatBRL(totais.despesas) : "—"}
            </p>
            <TrendingDown className="mt-2 h-4 w-4 text-destructive" />
          </Card>
          <Card className="border-border/60 p-5">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">
              {totais ? formatBRL(totais.saldo) : "—"}
            </p>
          </Card>
          <Card className="border-border/60 p-5">
            <p className="text-xs text-muted-foreground">Agendamentos / Pacientes</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">
              {totais ? `${totais.agendamentos} / ${totais.pacientes}` : "—"}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="financeiro" className="mt-8">
          <TabsList>
            <TabsTrigger value="financeiro">
              <Wallet className="mr-1.5 h-3.5 w-3.5" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="procedimentos">
              <Scissors className="mr-1.5 h-3.5 w-3.5" /> Procedimentos
            </TabsTrigger>
            <TabsTrigger value="pacientes">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="agenda">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Agenda
            </TabsTrigger>
          </TabsList>

          {/* Financeiro */}
          <TabsContent value="financeiro">
            <Card className="gradient-surface border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">
                Faturamento mensal (receitas × despesas)
              </h2>
              {loadingFat ? (
                <div className="grid h-56 place-items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-6 items-end gap-3">
                  {(faturamento ?? []).map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="flex h-44 w-full items-end justify-center gap-1">
                        <div
                          className="w-3.5 rounded-t-md bg-success/80"
                          style={{ height: `${Math.max((m.receitas / maxFaturamento) * 100, 2)}%` }}
                          title={`Receitas: ${formatBRL(m.receitas)}`}
                        />
                        <div
                          className="w-3.5 rounded-t-md bg-destructive/80"
                          style={{ height: `${Math.max((m.despesas / maxFaturamento) * 100, 2)}%` }}
                          title={`Despesas: ${formatBRL(m.despesas)}`}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground capitalize">
                        {m.mes}
                      </span>
                      <span className="text-[10px] font-bold text-foreground">
                        {formatBRL(m.saldo)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-success/80" /> Receitas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-destructive/80" /> Despesas
                </span>
              </div>
            </Card>
          </TabsContent>

          {/* Procedimentos */}
          <TabsContent value="procedimentos">
            <Card className="gradient-surface border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">
                Top procedimentos (por agendamentos concluídos)
              </h2>
              {(procedimentos ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum procedimento concluído ainda.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {(procedimentos ?? []).map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{p.nome}</span>
                        <span className="text-muted-foreground">
                          {p.quantidade}× · {formatBRL(p.receita)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full gradient-primary"
                          style={{ width: `${Math.max((p.quantidade / maxProced) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Pacientes */}
          <TabsContent value="pacientes">
            <Card className="gradient-surface border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">
                Novos pacientes por mês
              </h2>
              <div className="mt-6 grid grid-cols-6 items-end gap-3">
                {(pacientesMes ?? []).map((m, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end justify-center">
                      <div
                        className="w-6 rounded-t-md bg-primary/80"
                        style={{ height: `${Math.max((m.total / maxPacientes) * 100, m.total > 0 ? 8 : 2)}%` }}
                        title={`${m.total} pacientes`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground capitalize">
                      {m.mes}
                    </span>
                    <span className="text-xs font-bold text-foreground">{m.total}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Agenda */}
          <TabsContent value="agenda">
            <Card className="gradient-surface border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">
                Agendamentos por status
              </h2>
              {(statusAgenda ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum agendamento.</p>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(statusAgenda ?? []).map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/60 bg-card/50 p-4 text-center"
                    >
                      <p className="text-xs text-muted-foreground">{s.status}</p>
                      <p className="mt-1 font-display text-3xl font-bold text-foreground">
                        {s.total}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
