import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Loader2, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAgendamentos, listPacientes } from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [{ title: "Agenda & Agendamentos — MedeirosInfra" }],
  }),
  component: () => (
    <RequireAuth>
      <AgendaPage />
    </RequireAuth>
  ),
});

const statusStyles: Record<string, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-info/15 text-info border-info/30" },
  confirmado: { label: "Confirmado", className: "bg-success/15 text-success border-success/30" },
  cancelado: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  concluido: { label: "Concluído", className: "bg-primary/15 text-primary border-primary/30" },
};

function AgendaPage() {
  const queryClient = useQueryClient();

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["agendamentos"],
    queryFn: listAgendamentos,
  });

  const { data: pacientes } = useQuery({
    queryKey: ["pacientes"],
    queryFn: listPacientes,
  });

  const pacienteNome = (id?: string | null) =>
    pacientes?.find((p) => p.id === id)?.nome ?? "—";

  // Agrupa por dia
  const hoje = new Date().toISOString().slice(0, 10);
  const dias = new Map<string, typeof agendamentos>();
  (agendamentos ?? [])
    .filter((a) => a.status !== "cancelado")
    .forEach((a) => {
      const dia = a.data.slice(0, 10);
      if (!dias.has(dia)) dias.set(dia, []);
      dias.get(dia)!.push(a);
    });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Agenda
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Agenda & Agendamentos
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Consultas, retornos e avaliações da sua clínica. Organizados por dia.
            </p>
          </div>
          <Button size="lg" className="gradient-primary shadow-glow font-semibold">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Agendamento
          </Button>
        </header>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...dias.entries()].map(([dia, lista]) => (
                <Card key={dia} className="border-border/60 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      <h2 className="font-display text-sm font-bold text-foreground">
                        {new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </h2>
                    </div>
                    {dia === hoje && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Hoje
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {lista?.map((a) => {
                      const status = statusStyles[a.status] ?? statusStyles.agendado;
                      const hora = a.data.slice(11, 16);
                      return (
                        <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {hora}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {pacienteNome(a.paciente_id)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{a.tipo ?? "Consulta"}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                      );
                    })}
                    {!lista?.length && (
                      <p className="py-4 text-center text-xs text-muted-foreground">Sem agendamentos</p>
                    )}
                  </div>
                </Card>
              ))}
              {dias.size === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
