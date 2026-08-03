import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  listFuncionarios,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  listSetores,
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

const formInicial = {
  nome: "",
  cargo: "staff",
  setor_id: "",
  telefone: "",
  email: "",
};

function FuncionariosPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(formInicial);

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: listFuncionarios,
  });
  const { data: setores } = useQuery({ queryKey: ["setores"], queryFn: listSetores });

  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const createMutation = useMutation({
    mutationFn: () =>
      createFuncionario({
        nome: form.nome,
        cargo: form.cargo as Funcionario["cargo"],
        setor_id: form.setor_id || null,
        telefone: form.telefone || null,
        email: form.email || null,
        profile_id: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário criado!");
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
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" /> Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Novo funcionário</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome *</Label>
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} className="mt-1.5 h-11" required />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cargo</Label>
                  <Select value={form.cargo} onValueChange={(v) => set("cargo", v)}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CARGO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Setor</Label>
                  <Select value={form.setor_id} onValueChange={(v) => set("setor_id", v)}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {(setores ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Telefone</Label>
                    <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="gradient-primary w-full font-semibold">
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              </form>
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
                          {f.setor?.nome ? ` · ${f.setor.nome}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Remover ${f.nome}?`)) deleteMutation.mutate(f.id); }}
                      aria-label="Excluir"
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
