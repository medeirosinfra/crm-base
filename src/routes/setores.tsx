import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, Loader2, Trash2 } from "lucide-react";
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
import { listSetores, createSetor } from "@/lib/supabase/funcionarios";
import { toast } from "sonner";

export const Route = createFileRoute("/setores")({
  head: () => ({
    meta: [{ title: "Setores — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <SetoresPage />
    </RequireClinic>
  ),
});

function SetoresPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");

  const { data: setores, isLoading } = useQuery({ queryKey: ["setores"], queryFn: listSetores });

  const createMutation = useMutation({
    mutationFn: () => createSetor({ nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setores"] });
      toast.success("Setor criado!");
      setNome("");
      setOpen(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    createMutation.mutate();
  };

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Organização
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Setores
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Organize a clínica por setores (recepção, sala de procedimentos, consultório...).
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" /> Novo Setor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Novo setor</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome *</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Recepção" className="mt-1.5 h-11" required />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(setores ?? []).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum setor cadastrado.</p>
                </div>
              )}
              {(setores ?? []).map((s) => (
                <Card key={s.id} className="border-border/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-base font-bold text-foreground">{s.nome}</h3>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </ClinicLayout>
  );
}
