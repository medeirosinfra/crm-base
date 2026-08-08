import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Users, Search, Plus, Loader2, Phone, Mail, FileText, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listPacientes,
  createPaciente,
  updatePaciente,
  deletePaciente,
  type Paciente,
} from "@/lib/supabase/tenants";
import { formatData } from "@/lib/formatters";
import { toast } from "sonner";

export const Route = createFileRoute("/pacientes")({
  // Autenticação/sessão são client-only (SSR renderiza spinner que diverge
  // da árvore client → React hydration #418). Renderizamos no client apenas.
  head: () => ({
    meta: [{ title: "Pacientes — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <PacientesPage />
    </RequireClinic>
  ),
});

function PacientesPage() {
  const queryClient = useQueryClient();
  // Se estamos na rota filha /pacientes/$id, renderizamos o Outlet (detalhe),
  // não a listagem. O pai só mostra a lista quando a URL não tem o id.
  const routerState = useRouterState();
  const isListing = routerState.matches[routerState.matches.length - 1]?.routeId === "/pacientes";
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    rg: "",
    nascimento: "",
    genero: "",
    telefone: "",
    email: "",
    endereco: "",
    instagram: "",
    facebook: "",
    observacoes: "",
  });
  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));
  const limparForm = () =>
    setForm({
      nome: "", cpf: "", rg: "", nascimento: "", genero: "",
      telefone: "", email: "", endereco: "", instagram: "", facebook: "", observacoes: "",
    });

  // Edição: usa o paciente já carregado na listagem (sem nova busca),
  // garantindo que os campos venham preenchidos.
  const [openEdit, setOpenEdit] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const abrirEdicao = (p: Paciente) => {
    setEditando(p);
    setForm({
      nome: p.nome ?? "",
      cpf: p.cpf ?? "",
      rg: p.rg ?? "",
      nascimento: p.nascimento ?? "",
      genero: p.genero ?? "",
      telefone: p.telefone ?? "",
      email: p.email ?? "",
      endereco: p.endereco ?? "",
      instagram: p.instagram ?? "",
      facebook: p.facebook ?? "",
      observacoes: p.observacoes ?? "",
    });
    setOpenEdit(true);
  };
  const updateMutation = useMutation({
    mutationFn: () =>
      updatePaciente(editando!.id, {
        nome: form.nome,
        cpf: form.cpf || null,
        rg: form.rg || null,
        nascimento: form.nascimento || null,
        genero: form.genero || null,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        observacoes: form.observacoes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente atualizado!");
      setOpenEdit(false);
      setEditando(null);
      limparForm();
    },
    onError: (e) => toast.error(String(e)),
  });

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["pacientes"],
    queryFn: listPacientes,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaciente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente excluído!");
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleExcluir = (p: Paciente) => {
    if (!confirm(`Excluir o paciente "${p.nome}"? Esta ação não pode ser desfeita.`)) return;
    deleteMutation.mutate(p.id);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createPaciente({
        nome: form.nome,
        cpf: form.cpf || null,
        rg: form.rg || null,
        nascimento: form.nascimento || null,
        genero: form.genero || null,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        observacoes: form.observacoes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente cadastrado!");
      limparForm();
      setOpen(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const filtered = (pacientes ?? []).filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.telefone ?? "").includes(search),
  );

  if (!isListing) {
    // Rota filha (detalhe do paciente): o próprio PacienteDetalhePage já
    // renderiza o ClinicLayout, só expomos o Outlet sem aninhar outro layout.
    return <Outlet />;
  }

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">CRM</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Pacientes
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Cadastro completo dos pacientes da sua clínica, com histórico e contato.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Identificação */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-primary">Identificação</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome completo *" className="h-11" />
                    </div>
                    <div>
                      <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="CPF" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} placeholder="RG" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input type="date" value={form.nascimento} onChange={(e) => set("nascimento", e.target.value)} placeholder="Nascimento" className="h-11" />
                    </div>
                    <div>
                      <Input value={form.genero} onChange={(e) => set("genero", e.target.value)} placeholder="Gênero" className="h-11" />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contato</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="Telefone (com DDD)" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mail" className="h-11" />
                    </div>
                    <div className="sm:col-span-2">
                      <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Endereço completo" className="h-11" />
                    </div>
                  </div>
                </div>

                {/* Redes sociais */}
                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Redes sociais</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@instagram" className="h-11" />
                    </div>
                    <div>
                      <Input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="facebook.com/seuperfil" className="h-11" />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Observações</Label>
                  <Input value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Alergias, restrições, anotações..." className="mt-2 h-11" />
                </div>

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !form.nome.trim()}
                  className="gradient-primary w-full font-semibold"
                >
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Cadastrar paciente
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog de edição do paciente */}
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-primary">Identificação</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome completo *" className="h-11" />
                    </div>
                    <div>
                      <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="CPF" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} placeholder="RG" className="h-11 font-mono" />
                    </div>
                    <div>
                      <Input type="date" value={form.nascimento} onChange={(e) => set("nascimento", e.target.value)} placeholder="Nascimento" className="h-11" />
                    </div>
                    <div>
                      <Input value={form.genero} onChange={(e) => set("genero", e.target.value)} placeholder="Gênero" className="h-11" />
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
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mail" className="h-11" />
                    </div>
                    <div className="sm:col-span-2">
                      <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Endereço completo" className="h-11" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Redes sociais</Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@instagram" className="h-11" />
                    </div>
                    <div>
                      <Input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="facebook.com/seuperfil" className="h-11" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Observações</Label>
                  <Input value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Alergias, restrições, anotações..." className="mt-2 h-11" />
                </div>

                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !form.nome.trim()}
                  className="gradient-primary w-full font-semibold"
                >
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                  Salvar alterações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-8">
          <div className="relative mb-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="h-11 border-border/60 bg-card pl-9 text-sm"
            />
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground">
                  Nenhum paciente encontrado.
                </div>
              )}
              {filtered.map((e) => (
                <a
                  key={e.id}
                  href={`/pacientes/${e.id}`}
                  className="group gradient-surface shadow-card border-border/60 block rounded-xl border bg-card p-5 text-card-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {e.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">{e.nome}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Desde {formatData(e.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="h-3.5 w-3.5 text-primary" /> {e.telefone ?? "—"}
                    </span>
                    {e.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3.5 w-3.5 text-primary" /> {e.email}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    Abrir dados do paciente <FileText className="h-3 w-3" />
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClinicLayout>
  );
}
