import { createFileRoute } from "@tanstack/react-router";
import { Users2, Search, Plus, Loader2, Phone, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listPacientes, createPaciente } from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/contatos")({
  head: () => ({
    meta: [{ title: "Contatos & Leads — MedeirosInfra" }],
  }),
  component: () => (
    <RequireAuth>
      <ContatosPage />
    </RequireAuth>
  ),
});

function ContatosPage() {
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
      toast.success("Contato adicionado!");
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
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">CRM</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Contatos & Leads
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Base unificada de pacientes e leads da sua clínica, com histórico e integração com
              WhatsApp.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo contato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                  className="h-11"
                />
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Telefone (ex: 5511999999999)"
                  className="h-11 font-mono"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-11"
                />
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !nome.trim()}
                  className="gradient-primary w-full font-semibold"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Salvar contato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="h-11 border-border/60 bg-card pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-muted-foreground">
            <Users2 className="h-3.5 w-3.5 text-primary" />
            {filtered.length} contatos
          </div>
        </div>

        <section className="mt-6">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="hidden px-4 py-3 md:table-cell">Email</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Criado em</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        Nenhum contato encontrado.
                      </td>
                    </tr>
                  )}
                  {filtered.map((p) => (
                    <tr key={p.id} className="bg-card hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{p.nome}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.telefone ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {p.email ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="WhatsApp">
                            <MessageCircle className="h-4 w-4 text-success" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ligar">
                            <Phone className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Email">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
