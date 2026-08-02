import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, MoreVertical, MessageCircle, Users, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listTenants, type Tenant } from "@/lib/supabase/tenants";

export const Route = createFileRoute("/clinicas")({
  head: () => ({
    meta: [
      { title: "Gestão de Clínicas — CRM MultiSaaS" },
      {
        name: "description",
        content:
          "Painel White-Label de gestão de clínicas: funis de agendamento, captação, avaliações e retornos.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ClinicasPage />
    </RequireAuth>
  ),
});

const specialtyStyles: Record<string, string> = {
  Odontologia: "bg-primary/15 text-primary",
  "Estética Avançada": "bg-info/15 text-info",
  Dermatologia: "bg-accent text-accent-foreground",
  Fisioterapia: "bg-success/15 text-success",
  Psicologia: "bg-warning/15 text-warning",
};

type ClinicStatus = Tenant["status"];

const statusLabels: Record<ClinicStatus, { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-success/15 text-success border-success/30" },
  trial: { label: "Trial", className: "bg-info/15 text-info border-info/30" },
  inadimplente: {
    label: "Inadimplente",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  suspensa: {
    label: "Suspensa",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function ClinicasPage() {
  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Carregando clínicas...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-semibold text-destructive">Erro ao carregar clínicas</p>
            <p className="mt-2 text-sm text-muted-foreground">{String(error)}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Verifique se você está autenticado e tem permissão de super_admin.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Gestão de Clínicas (CRM)
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              CRM Customizado para Clínicas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Funil de agendamento, captação de pacientes, avaliações de estética e retornos
              odontológicos.
            </p>
          </div>
          <Button
            size="lg"
            className="gradient-primary shadow-glow font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Nova Clínica
          </Button>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por clínica, especialidade ou responsável..."
              className="h-11 border-border/60 bg-card pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 text-xs">
            {["Todas", "Ativas", "Trial", "Inadimplentes"].map((f, i) => (
              <button
                key={f}
                className={`rounded-full border px-3 py-1.5 font-semibold transition-colors ${
                  i === 0
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(tenants ?? []).map((c) => {
            const status = statusLabels[c.status];
            return (
              <Card
                key={c.id}
                className="group gradient-surface shadow-card relative flex flex-col border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                      specialtyStyles[c.especialidade ?? ""] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.especialidade ?? "Clínica"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {c.mrr ? `R$ ${c.mrr}` : "Sem MRR"}
                    </span>
                    <button
                      aria-label="Ações"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-foreground">{c.nome}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.descricao ?? "Sem descrição"}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                    {c.whatsapp_sessions ?? 0} sessão{(c.whatsapp_sessions ?? 0) > 1 ? "ões" : ""} WAHA
                  </span>
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
