import { createFileRoute } from "@tanstack/react-router";
import { Building2, DollarSign, TrendingDown, MessageCircle, Users, Activity } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { saasMetrics, clinicsMock } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral SaaS — MedeirosInfra Business Suite" },
      {
        name: "description",
        content:
          "Métricas SaaS em tempo real: MRR, ARR, churn, sessões WAHA e tenants ativos no painel White-Label.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

const stats = [
  {
    label: "MRR (Receita Recorrente)",
    value: formatBRL(saasMetrics.mrr),
    delta: "+12,4%",
    positive: true,
    icon: DollarSign,
  },
  {
    label: "ARR Projetado",
    value: formatBRL(saasMetrics.arr),
    delta: "+18,7%",
    positive: true,
    icon: TrendingDown,
  },
  {
    label: "Tenants Ativos",
    value: String(saasMetrics.activeTenants),
    delta: `${clinicsMock.length} recentes`,
    positive: true,
    icon: Building2,
  },
  {
    label: "Taxa de Churn",
    value: `${saasMetrics.churnRate}%`,
    delta: "-0,3 pp",
    positive: true,
    icon: TrendingDown,
  },
  {
    label: "Sessões WAHA",
    value: String(saasMetrics.whatsappSessions),
    delta: "conectadas",
    positive: true,
    icon: MessageCircle,
  },
  {
    label: "Mensagens 24h",
    value: saasMetrics.messagesLast24h.toLocaleString("pt-BR"),
    delta: "+8,2%",
    positive: true,
    icon: Activity,
  },
];

function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Painel Master · SaaS
            </p>
            <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">
              Visão Geral do Ecossistema
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe MRR, ARR, churn, inadimplência e a saúde de todas as sessões WAHA em uma
              única tela.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            Última sincronização: agora mesmo
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Card
              key={s.label}
              className="gradient-surface shadow-card border-border/60 p-5 transition-all hover:border-primary/40 hover:shadow-glow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">{s.value}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <p
                className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
                  s.positive ? "text-success" : "text-destructive"
                }`}
              >
                {s.delta}
              </p>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="gradient-surface shadow-card border-border/60 p-6 lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-foreground">
              Evolução de Faturamento (últimos 6 meses)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gráfico interativo disponível após integração com o banco (Cloud/Supabase).
            </p>
            <div className="mt-6 grid h-52 grid-cols-6 items-end gap-3">
              {[38, 52, 47, 68, 74, 92].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md gradient-primary opacity-90"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"][i]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="gradient-surface shadow-card border-border/60 p-6">
            <h2 className="font-display text-lg font-bold text-foreground">Régua de Cobrança</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Automações ativas para os tenants.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                { label: "Aviso pré-vencimento (3d)", count: 8 },
                { label: "Cobrança de atraso", count: 3 },
                { label: "Bloqueio automático", count: 1 },
              ].map((r) => (
                <li
                  key={r.label}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-sm"
                >
                  <span className="text-foreground">{r.label}</span>
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {r.count}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
