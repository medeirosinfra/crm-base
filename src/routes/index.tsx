import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  CalendarDays,
  Wallet,
  Scissors,
  TrendingUp,
  ArrowDownCircle,
  Loader2,
  Megaphone,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { getDashboardResumo, getFaturamentoMensal } from "@/lib/supabase/dashboard";
import { queryKeys } from "@/lib/query-keys";
import { formatBRLInt } from "@/lib/formatters";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — MedeirosInfra Clínicas" },
      {
        name: "description",
        content:
          "Métricas reais da sua clínica: pacientes, agendamentos, receitas, despesas e procedimentos.",
      },
    ],
  }),
  component: () => (
    <RequireClinic>
      <DashboardPage />
    </RequireClinic>
  ),
});

function DashboardPage() {
  const { data: resumo, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard.resumo,
    queryFn: getDashboardResumo,
    staleTime: 60_000,
  });

  const { data: faturamento } = useQuery({
    queryKey: queryKeys.dashboard.faturamento,
    queryFn: () => getFaturamentoMensal(6),
    staleTime: 60_000,
  });

  const stats = resumo
    ? [
        { label: "Pacientes", value: String(resumo.totalPacientes), icon: Users },
        { label: "Agendamentos hoje", value: String(resumo.agendamentosHoje), icon: CalendarDays },
        { label: "Pendentes de confirmação", value: String(resumo.agendamentosPendentes), icon: CalendarDays },
        { label: "Receitas", value: formatBRLInt(resumo.receitas), icon: Wallet },
        { label: "Despesas", value: formatBRLInt(resumo.despesas), icon: ArrowDownCircle },
        { label: "Procedimentos", value: String(resumo.totalProcedimentos), icon: Scissors },
      ]
    : [];

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Painel da Clínica
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Visão Geral da Sua Clínica
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe pacientes, agendamentos, receitas e procedimentos em tempo real.
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Carregando dados...
            </div>
          )}
        </header>

        {error ? (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-semibold text-destructive">Erro ao carregar o painel</p>
            <p className="mt-2 text-sm text-muted-foreground">{String(error)}</p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading
                ? [0, 1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="border-border/60 p-5">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
                    </Card>
                  ))
                : stats.map((s) => (
                    <Card
                      key={s.label}
                      className="gradient-surface shadow-card border-border/60 p-5 transition-all hover:border-primary/40 hover:shadow-glow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {s.label}
                          </p>
                          <p className="mt-2 font-display text-2xl font-bold text-foreground">
                            {s.value}
                          </p>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                          <s.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </Card>
                  ))}
            </section>

            <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="gradient-surface shadow-card border-border/60 p-6 lg:col-span-2">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Evolução de Faturamento (últimos 6 meses)
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receitas e despesas mensais da sua clínica.
                </p>
                <div className="mt-6">
                  {!faturamento ? (
                    <div className="grid h-52 place-items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid h-56 grid-cols-6 items-end gap-3">
                      {faturamento.map((m, i) => {
                        const max = Math.max(
                          ...faturamento.map((x) => Math.max(x.receitas, x.despesas, 1)),
                        );
                        const altR = (m.receitas / max) * 100;
                        const altD = (m.despesas / max) * 100;
                        return (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className="flex h-40 w-full items-end justify-center gap-1">
                              <div
                                className="w-3 rounded-t-md bg-success/80"
                                style={{ height: `${Math.max(altR, 2)}%` }}
                                title={`Receitas: ${formatBRLInt(m.receitas)}`}
                              />
                              <div
                                className="w-3 rounded-t-md bg-destructive/80"
                                style={{ height: `${Math.max(altD, 2)}%` }}
                                title={`Despesas: ${formatBRLInt(m.despesas)}`}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground capitalize">
                              {m.mes}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-success/80" /> Receitas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-destructive/80" /> Despesas
                  </span>
                </div>
              </Card>

              <Card className="gradient-surface shadow-card border-border/60 p-6">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Saldo do Período
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receitas menos despesas.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-6">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <p className="font-display text-3xl font-bold text-foreground">
                    {resumo ? formatBRLInt(resumo.saldo) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resumo?.campanhas ?? 0} campanhas cadastradas
                  </p>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </ClinicLayout>
  );
}
