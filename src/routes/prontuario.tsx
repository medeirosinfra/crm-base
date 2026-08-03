import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Plus, Loader2, Search, Trash2, Pencil, Pill, Stethoscope, CalendarClock, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPacientes } from "@/lib/supabase/tenants";
import {
  listProntuario,
  createProntuarioRegistro,
  updateProntuarioRegistro,
  deleteProntuarioRegistro,
  type ProntuarioRegistro,
} from "@/lib/supabase/prontuario";
import { listFuncionarios } from "@/lib/supabase/funcionarios";
import { toast } from "sonner";

export const Route = createFileRoute("/prontuario")({
  head: () => ({
    meta: [{ title: "Prontuário — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <RequireRole modulo="prontuario">
        <ProntuarioPage />
      </RequireRole>
    </RequireClinic>
  ),
});

const fmtData = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : null;

const TIPO_LABELS: Record<string, string> = {
  avaliacao: "Avaliação",
  procedimento: "Procedimento",
  medicacao: "Medicação",
  retorno: "Retorno",
  evolucao: "Evolução",
};

const TIPO_ICONES: Record<string, typeof Pill> = {
  avaliacao: FileText,
  procedimento: Stethoscope,
  medicacao: Pill,
  retorno: CalendarClock,
  evolucao: FileText,
};

const formInicial = {
  tipo: "procedimento",
  titulo: "",
  data_registro: new Date().toISOString().slice(0, 10),
  procedimento_realizado: "",
  medicacao: "",
  receita: "",
  periodo_inicio: "",
  periodo_fim: "",
  retorno_em: "",
  descricao: "",
  profissional_id: "",
};

function ProntuarioPage() {
  const queryClient = useQueryClient();
  const [pacienteId, setPacienteId] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProntuarioRegistro | null>(null);
  const [form, setForm] = useState(formInicial);
  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const { data: pacientes } = useQuery({ queryKey: ["pacientes"], queryFn: listPacientes });
  const { data: funcionarios } = useQuery({ queryKey: ["funcionarios"], queryFn: listFuncionarios });
  const { data: registros, isLoading } = useQuery({
    queryKey: ["prontuario", pacienteId],
    queryFn: () => listProntuario(pacienteId),
    enabled: !!pacienteId,
  });

  const paciente = (pacientes ?? []).find((p) => p.id === pacienteId);
  const filteredPacientes = (pacientes ?? []).filter(
    (p) => p.nome.toLowerCase().includes(search.toLowerCase()) || (p.telefone ?? "").includes(search),
  );

  const openCriar = () => {
    setEditing(null);
    setForm(formInicial);
    setOpen(true);
  };

  const openEditar = (r: ProntuarioRegistro) => {
    setEditing(r);
    setForm({
      tipo: r.tipo,
      titulo: r.titulo ?? "",
      data_registro: r.data_registro ?? new Date().toISOString().slice(0, 10),
      procedimento_realizado: r.procedimento_realizado ?? "",
      medicacao: r.medicacao ?? "",
      receita: r.receita ?? "",
      periodo_inicio: r.periodo_inicio ?? "",
      periodo_fim: r.periodo_fim ?? "",
      retorno_em: r.retorno_em ?? "",
      descricao: r.descricao ?? "",
      profissional_id: r.profissional_id ?? "",
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const dados = {
        tipo: form.tipo as ProntuarioRegistro["tipo"],
        titulo: form.titulo || null,
        data_registro: form.data_registro || null,
        procedimento_realizado: form.procedimento_realizado || null,
        medicacao: form.medicacao || null,
        receita: form.receita || null,
        periodo_inicio: form.periodo_inicio || null,
        periodo_fim: form.periodo_fim || null,
        retorno_em: form.retorno_em || null,
        descricao: form.descricao || null,
        profissional_id: form.profissional_id || null,
      };
      if (editing) return updateProntuarioRegistro(editing.id, dados);
      return createProntuarioRegistro({ ...dados, paciente_id: pacienteId, agendamento_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario", pacienteId] });
      toast.success(editing ? "Registro atualizado!" : "Registro criado!");
      setOpen(false);
      setForm(formInicial);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProntuarioRegistro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario", pacienteId] });
      toast.success("Registro excluído");
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Clínica</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Prontuário</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Histórico completo do paciente: procedimentos, medicações, receitas, período e retorno.
            </p>
          </div>
        </header>

        {/* Seleção do paciente */}
        <div className="mt-8">
          {!pacienteId ? (
            <Card className="border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Selecione o paciente</h2>
              <div className="relative mt-4 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="h-11 pl-9" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPacientes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPacienteId(p.id)}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {p.nome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.nome}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.telefone ?? ""}</p>
                    </div>
                  </button>
                ))}
                {(filteredPacientes.length === 0) && <p className="col-span-full text-sm text-muted-foreground">Nenhum paciente encontrado.</p>}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Cabeçalho do paciente */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-base font-bold text-primary">
                    {paciente?.nome.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{paciente?.nome}</h2>
                    <p className="text-xs text-muted-foreground">
                      {paciente?.telefone ?? ""} {paciente?.email ? `· ${paciente.email}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPacienteId("")}>Trocar paciente</Button>
                  <Button onClick={openCriar} className="gradient-primary font-semibold">
                    <Plus className="mr-1.5 h-4 w-4" /> Novo registro
                  </Button>
                </div>
              </div>

              {/* Timeline de registros */}
              {isLoading ? (
                <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (registros ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum registro no prontuário deste paciente.</p>
                  <p className="text-sm text-muted-foreground">Clique em "Novo registro" para adicionar o primeiro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(registros ?? []).map((r) => {
                    const Icon = TIPO_ICONES[r.tipo] ?? FileText;
                    const tipoCls: Record<string, string> = {
                      avaliacao: "border-info/30 bg-info/10 text-info",
                      procedimento: "border-primary/30 bg-primary/10 text-primary",
                      medicacao: "border-success/30 bg-success/10 text-success",
                      retorno: "border-warning/30 bg-warning/10 text-warning",
                      evolucao: "border-border/40 text-muted-foreground",
                    };
                    return (
                      <Card key={r.id} className="border-border/60 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`grid h-10 w-10 place-items-center rounded-lg ${tipoCls[r.tipo] ?? tipoCls.evolucao}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-display text-base font-bold text-foreground">{r.titulo ?? TIPO_LABELS[r.tipo] ?? "Registro"}</h3>
                                <Badge className={tipoCls[r.tipo] ?? tipoCls.evolucao}>{TIPO_LABELS[r.tipo] ?? r.tipo}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{fmtData(r.data_registro)}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditar(r)} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => { if (confirm("Excluir este registro?")) deleteMutation.mutate(r.id); }} aria-label="Excluir" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {r.procedimento_realizado && (
                          <p className="mt-3 text-sm"><span className="font-semibold text-foreground">Procedimento:</span> <span className="text-muted-foreground">{r.procedimento_realizado}</span></p>
                        )}
                        {r.medicacao && (
                          <p className="mt-1 text-sm"><span className="font-semibold text-foreground">Medicação:</span> <span className="text-muted-foreground">{r.medicacao}</span></p>
                        )}
                        {r.receita && (
                          <p className="mt-1 text-sm"><span className="font-semibold text-foreground">Receita:</span> <span className="text-muted-foreground">{r.receita}</span></p>
                        )}
                        {r.periodo_inicio && (
                          <p className="mt-1 text-sm"><span className="font-semibold text-foreground">Período:</span> <span className="text-muted-foreground">{fmtData(r.periodo_inicio)} — {fmtData(r.periodo_fim) ?? "..."}</span></p>
                        )}
                        {r.retorno_em && (
                          <p className="mt-1 text-sm"><span className="font-semibold text-foreground">Retorno:</span> <span className="text-muted-foreground">{fmtData(r.retorno_em)}</span></p>
                        )}
                        {r.descricao && <p className="mt-2 text-sm text-muted-foreground">{r.descricao}</p>}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog do registro */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Data</Label>
                <Input type="date" value={form.data_registro} onChange={(e) => set("data_registro", e.target.value)} className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Título</Label>
              <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="ex: Sessão 2 de botox" className="mt-1.5 h-11" />
            </div>

            {form.tipo === "procedimento" && (
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Procedimento realizado</Label>
                <Input value={form.procedimento_realizado} onChange={(e) => set("procedimento_realizado", e.target.value)} placeholder="ex: Toxina botulínica 30U (glabela + frontal)" className="mt-1.5 h-11" />
              </div>
            )}
            {form.tipo === "medicacao" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Medicação</Label>
                  <Input value={form.medicacao} onChange={(e) => set("medicacao", e.target.value)} placeholder="ex: Amoxicilina 500mg" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Receita</Label>
                  <Input value={form.receita} onChange={(e) => set("receita", e.target.value)} placeholder="ex: 1 comprimido a cada 8h por 7 dias" className="mt-1.5 h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Início</Label>
                    <Input type="date" value={form.periodo_inicio} onChange={(e) => set("periodo_inicio", e.target.value)} className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Fim</Label>
                    <Input type="date" value={form.periodo_fim} onChange={(e) => set("periodo_fim", e.target.value)} className="mt-1 h-11" />
                  </div>
                </div>
              </div>
            )}
            {form.tipo === "retorno" && (
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Data do retorno</Label>
                <Input type="date" value={form.retorno_em} onChange={(e) => set("retorno_em", e.target.value)} className="mt-1.5 h-11" />
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição / Observações</Label>
              <Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes do atendimento..." className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profissional</Label>
              <Select value={form.profissional_id} onValueChange={(v) => set("profissional_id", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(funcionarios ?? []).map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.titulo} className="gradient-primary w-full font-semibold">
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editing ? "Salvar alterações" : "Adicionar registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ClinicLayout>
  );
}
