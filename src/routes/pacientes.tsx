import { createFileRoute } from "@tanstack/react-router";
import { Users, Search, Plus, Loader2, Phone, Mail } from "lucide-react";
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
import { listPacientes, createPaciente } from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/pacientes")({
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
  const [search, setSearch] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["pacientes"],
    queryFn: listPacientes,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createPaciente({
        nome,
        telefone: telefone || null,
        email: email || null,
        nascimento: null,
        observacoes: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente cadastrado!");
      setNome("");
      setTelefone("");
      setEmail("");
      setOpen(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const filtered = (pacientes ?? []).filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.telefone ?? "").includes(search),
  );

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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Telefone</Label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="5511999999999" className="mt-1.5 h-11 font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="paciente@email.com" className="mt-1.5 h-11" />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !nome.trim()}
                  className="gradient-primary w-full font-semibold"
                >
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Cadastrar paciente
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
              {filtered.map((p) => (
                <Card key={p.id} className="group gradient-surface shadow-card border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {p.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">{p.nome}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Desde {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="h-3.5 w-3.5 text-primary" /> {p.telefone ?? "—"}
                    </span>
                    {p.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3.5 w-3.5 text-primary" /> {p.email}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClinicLayout>
  );
}
