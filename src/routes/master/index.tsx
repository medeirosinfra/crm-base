import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, Wallet, Scissors, Loader2, TrendingUp, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTotaisRelatorio } from "@/lib/supabase/relatorios";
import { listTenants } from "@/lib/supabase/tenants";
import { formatBRLInt } from "@/lib/formatters";

export const Route = createFileRoute("/master/")({
  head: () => ({
    meta: [
      { title: "Visão do Ecossistema — MedeirosInfra Master" },
      { name: "description", content: "Métricas agregadas de todas as clínicas da plataforma." },
    ],
  }),
  component: MasterDashboard,
});

function MasterDashboard() {
  const { data: tenants, isLoading } = useQuery({ queryKey: ["tenants"], queryFn: listTenants });

  const clinicasAtivas = tenants?.filter((t) => t.status === "ativa")?.length ?? 0;
  const clinicasInativas = (tenants?.length ?? 0) - clinicasAtivas;

  const stats = [
    { label: "Clínicas Ativas", value: String(clinicasAtivas), icon: Building2 },
    { label: "Clínicas Suspensas/Inativas", value: String(clinicasInativas), icon: Building2 },
    { label: "Total de Clientes White-Label", value: String(tenants?.length ?? 0), icon: Users },
    { label: "Módulos & Recurso IA", value: "Ativos", icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Painel Master</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Visão do Ecossistema</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Métricas agregadas de todas as clínicas white-label da plataforma.
          </p>
        </div>
        <Link to="/master/clinicas">
          <Button size="lg" className="gradient-primary shadow-glow font-semibold">
            <Plus className="mr-1.5 h-4 w-4" /> Novo Cliente
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="mt-8 grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="border-border/60 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <section className="mt-8">
            <Card className="gradient-surface border-border/60 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Clínicas da plataforma</h2>
                </div>
                <Link to="/master/clinicas" className="text-xs font-semibold text-primary hover:underline">
                  Ver todas →
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(tenants ?? []).map((t) => (
                  <Link to="/master/clinicas" key={t.id} className="rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/40 hover:shadow-glow">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: t.cor_primaria }}>
                        {t.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{t.nome}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{t.especialidade ?? "Clínica"} · {t.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {(tenants ?? []).length === 0 && (
                  <Link to="/master/clinicas" className="col-span-full rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground hover:border-primary/40 hover:text-primary">
                    + Cadastrar o primeiro cliente
                  </Link>
                )}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
