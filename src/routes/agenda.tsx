import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Stethoscope,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAgendamentosComRels,
  createAgendamento,
  updateAgendamentoStatus,
  deleteAgendamento,
  listProfissionais,
  type AgendamentoStatus,
} from "@/lib/supabase/agendamentos";
import { listPacientes } from "@/lib/supabase/tenants";
import { listProcedimentos } from "@/lib/supabase/procedimentos-campanhas";
import { formatHora, formatDataLonga, formatBRL } from "@/lib/formatters";
import { toast } from "sonner";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [{ title: "Agenda & Agendamentos — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <AgendaPage />
    </RequireClinic>
  ),
});

const statusStyles: Record<AgendamentoStatus, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-info/15 text-info border-info/30" },
  confirmado: { label: "Confirmado", className: "bg-success/15 text-success border-success/30" },
  cancelado: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  concluido: { label: "Concluído", className: "bg-primary/15 text-primary border-primary/30" },
};

const proximoStatus: Record<AgendamentoStatus, AgendamentoStatus | null> = {
  agendado: "confirmado",
  confirmado: "concluido",
  concluido: null,
  cancelado: null,
};

function AgendaPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    paciente_id: "",
    procedimento_id: "",
    profissional_id: "",
    data: "",
    hora: "09:00",
    observacoes: "",
  });

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["agendamentos"],
    queryFn: listAgendamentosComRels,
  });
  const { data: pacientes } = useQuery({ queryKey: ["pacientes"], queryFn: listPacientes });
  const { data: procedimentos } = useQuery({
    queryKey: ["procedimentos"],
    queryFn: listProcedimentos,
  });
  const { data: profissionais } = useQuery({
    queryKey: ["profissionais"],
    queryFn: listProfissionais,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const dataISO = `${form.data}T${form.hora}:00-03:00`;
      return createAgendamento({
        paciente_id: form.paciente_id,
        procedimento_id: form.procedimento_id || null,
        profissional_id: form.profissional_id || null,
        data: dataISO,
        tipo: procedimentos?.find((p) => p.id === form.procedimento_id)?.categoria ?? "Consulta",
        observacoes: form.observacoes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Agendamento criado!");
      setOpen(false);
      setForm({ paciente_id: "", procedimento_id: "", profissional_id: "", data: "", hora: "09:00", observacoes: "" });
    },
    onError: (e) => toast.error(String(e)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgendamentoStatus }) =>
      updateAgendamentoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Status atualizado");
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgendamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Agendamento removido");
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.paciente_id || !form.data) {
      toast.error("Paciente e data são obrigatórios");
      return;
    }
    createMutation.mutate();
  };

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
    <ClinicLayout>
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
              Crie, confirme e conclua agendamentos da sua clínica.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo agendamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Paciente *
                  </Label>
                  <Select value={form.paciente_id} onValueChange={(v) => setForm((f) => ({ ...f, paciente_id: v }))}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder="Selecione o paciente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(pacientes ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Procedimento
                    </Label>
                    <Select value={form.procedimento_id} onValueChange={(v) => setForm((f) => ({ ...f, procedimento_id: v }))}>
                      <SelectTrigger className="mt-1.5 h-11">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(procedimentos ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome} — {formatBRL(Number(p.preco))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Profissional
                    </Label>
                    <Select value={form.profissional_id} onValueChange={(v) => setForm((f) => ({ ...f, profissional_id: v }))}>
                      <SelectTrigger className="mt-1.5 h-11">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(profissionais ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Data *
                    </Label>
                    <Input
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Hora
                    </Label>
                    <Input
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                      className="mt-1.5 h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Observações para a Dra
                  </Label>
                  <Textarea
                    value={form.observacoes}
                    onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                    placeholder="Ex: dente 36 — restauração prevista; paciente com sensibilidade no dente 47"
                    className="mt-1.5 min-h-[72px] resize-y"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Anote o dente/procedimento previsto para este agendamento.
                  </p>
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="gradient-primary w-full font-semibold">
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar agendamento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                      <h2 className="font-display text-sm font-bold text-foreground capitalize">
                        {formatDataLonga(dia + "T12:00:00")}
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
                      const status = statusStyles[a.status];
                      const next = proximoStatus[a.status];
                      return (
                        <div key={a.id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {formatHora(a.data)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {a.paciente?.nome ?? "Paciente"}
                              </p>
                              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Stethoscope className="h-3 w-3" />
                                {a.procedimento?.nome ?? a.tipo ?? "Consulta"}
                              </p>
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                              {status.label}
                            </span>
                          </div>

                          {(a.procedimento?.nome || a.valor) && (
                            <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2 text-[11px]">
                              {a.profissional && (
                                <span className="text-muted-foreground">
                                  {a.profissional.nome}
                                </span>
                              )}
                              {a.valor != null && (
                                <span className="font-semibold text-foreground">
                                  {formatBRL(Number(a.valor))}
                                </span>
                              )}
                            </div>
                          )}

                          {a.observacoes && (
                            <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] leading-relaxed text-foreground/90">
                              <span className="font-semibold text-primary">Observações: </span>
                              {a.observacoes}
                            </div>
                          )}

                          <div className="mt-2 flex gap-1.5">
                            {next && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={() => statusMutation.mutate({ id: a.id, status: next })}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3 text-success" />
                                {next === "confirmado" ? "Confirmar" : "Concluir"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Cancelar este agendamento?")) {
                                  statusMutation.mutate({ id: a.id, status: "cancelado" });
                                }
                              }}
                            >
                              <XCircle className="mr-1 h-3 w-3" /> Cancelar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto h-7 w-7 p-0"
                              onClick={() => {
                                if (confirm("Excluir definitivamente?")) deleteMutation.mutate(a.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
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
                  Nenhum agendamento encontrado. Crie o primeiro!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ClinicLayout>
  );
}
