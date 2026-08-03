import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Loader2, Trash2, Pencil, Briefcase, BadgeCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  listFuncionarios,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  listSetores,
  createSetor,
  type Funcionario,
} from "@/lib/supabase/funcionarios";
import { toast } from "sonner";

export const Route = createFileRoute("/funcionarios")({
  head: () => ({
    meta: [{ title: "Funcionários — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <FuncionariosPage />
    </RequireClinic>
  ),
});

const CARGO_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  financeiro: "Financeiro",
  staff: "Atendente",
};

const ESPECIALIDADES = [
  "Dentista",
  "Ortodontista",
  "Dermatologista",
  "Harmonização Facial",
  "Fisioterapeuta",
  "Psicólogo",
  "Esteticista",
  "Recepcionista",
  "Auxiliar",
  "Outro",
];

const formInicial = {
  nome: "",
  cpf: "",
  cargo: "staff",
  setor_id: "",
  telefone: "",
  email: "",
  especialidade: "",
  observacoes: "",
  ativo: true,
};

function FuncionariosPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [form, setForm] = useState(formInicial);
  const [openSetor, setOpenSetor] = useState(false);
  const [novoSetor, setNovoSetor] = useState("");

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: listFuncionarios,
  });
  const { data: setores } = useQuery({ queryKey: ["setores"], queryFn: listSetores });

  const set = (campo: keyof typeof form, valor: string | boolean) => setForm((f) => ({ ...f, [campo]: valor }));

  const openCriar = () => {
    setEditing(null);
    setForm(formInicial);
    setOpen(true);
  };

  const openEditar = (f: Funcionario) => {
    setEditing(f);
    setForm({
      nome: f.nome,
      cpf: f.cpf ?? "",
      cargo: f.cargo,
      setor_id: f.setor_id ?? "",
      telefone: f.telefone ?? "",
      email: f.email ?? "",
      especialidade: f.especialidade ?? "",
      observacoes: f.observacoes ?? "",
      ativo: f.ativo,
    });
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const dados = {
        nome: form.nome,
        cpf: form.cpf || null,
        cargo: form.cargo as Funcionario["cargo"],
        setor_id: form.setor_id || null,
        telefone: form.telefone || null,
        email: form.email || null,
        especialidade: form.especialidade || null,
        observacoes: form.observacoes || null,
        ativo: form.ativo,
      };
      if (editing) {
        return updateFuncionario(editing.id, dados);
      }
      return createFuncionario({ ...dados, profile_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success(editing ? "Funcionário atualizado!" : "Funcionário criado!");
      setOpen(false);
      setForm(formInicial);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFuncionario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário removido");
    },
    onError: (e) => toast.error(String(e)),
  });

  const criarSetorMutation = useMutation({
    mutationFn: () => createSetor({ nome: novoSetor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setores"] });
      toast.success("Setor criado!");
      setOpenSetor(false);
      setNovoSetor("");
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    createMutation.mutate();
  };

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Equipe
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Funcionários
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Gerencie a equipe da clínica. Cada funcionário terá login e agenda individuais.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold" onClick={openCriar}>
                <Plus className="mr-1.5 h-4 w-4" /> Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar funcionário" : "Novo funcionário"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-primary">Identificação</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome completo *" className="h-11" required />
                    </div>
                    <div>
                      <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="CPF" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mail" className="h-11" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Função</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Cargo</Label>
                      <Select value={form.cargo} onValueChange={(v) => set("cargo", v)}>
                        <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CARGO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Especialidade / Área</Label>
                      <Select value={form.especialidade} onValueChange={(v) => set("especialidade", v)}>
                        <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {ESPECIALIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-[11px] text-muted-foreground">Setor</Label>
                      <div className="mt-1 flex gap-2">
                        <Select value={form.setor_id} onValueChange={(v) => set("setor_id", v)}>
                          <SelectTrigger className="h-11 flex-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {(setores ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="h-11" onClick={() => setOpenSetor(true)}>
                          <Briefcase className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contato</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="Telefone (com DDD)" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Observações" className="h-11" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-foreground">Ativo na equipe</span>
                  </div>
                  <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} />
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="gradient-primary w-full font-semibold">
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editing ? "Salvar alterações" : "Cadastrar funcionário"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog criar setor */}
          <Dialog open={openSetor} onOpenChange={setOpenSetor}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Novo setor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input value={novoSetor} onChange={(e) => setNovoSetor(e.target.value)} placeholder="Nome do setor (ex: Recepção)" className="h-11" />
                <Button onClick={() => criarSetorMutation.mutate()} disabled={!novoSetor.trim() || criarSetorMutation.isPending} className="gradient-primary w-full font-semibold">
                  {criarSetorMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar setor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <section className="mt-8">
          {isLoading ? (
            <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(funcionarios ?? []).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum funcionário cadastrado.</p>
                </div>
              )}
              {(funcionarios ?? []).map((f) => (
                <Card key={f.id} className="border-border/60 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {f.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">{f.nome}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {CARGO_LABELS[f.cargo] ?? f.cargo}
                          {f.especialidade ? ` · ${f.especialidade}` : ""}
                          {f.setor?.nome ? ` · ${f.setor.nome}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!f.ativo && (
                        <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Inativo</span>
                      )}
                      <button
                        onClick={() => openEditar(f)}
                        aria-label="Editar"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remover ${f.nome}?`)) deleteMutation.mutate(f.id); }}
                        aria-label="Excluir"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {f.email && <p className="mt-3 text-xs text-muted-foreground">{f.email}</p>}
                  {f.telefone && <p className="mt-1 text-xs text-muted-foreground">{f.telefone}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </ClinicLayout>
  );
}
