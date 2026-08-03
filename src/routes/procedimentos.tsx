import { createFileRoute } from "@tanstack/react-router";
import { Scissors, Plus, Loader2, Trash2, Clock, Tag } from "lucide-react";
import { useState } from "react";
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
import { listProcedimentos, createProcedimento, deleteProcedimento } from "@/lib/supabase/procedimentos-campanhas";
import { toast } from "sonner";

export const Route = createFileRoute("/procedimentos")({
  head: () => ({
    meta: [{ title: "Procedimentos & Tratamentos — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <ProcedimentosPage />
    </RequireClinic>
  ),
});

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function ProcedimentosPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [duracao, setDuracao] = useState("30");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");

  const { data: procedimentos, isLoading } = useQuery({
    queryKey: ["procedimentos"],
    queryFn: listProcedimentos,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createProcedimento({
        nome,
        categoria: categoria || null,
        descricao: descricao || null,
        duracao_min: parseInt(duracao) || 30,
        preco: parseFloat(preco) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedimentos"] });
      toast.success("Procedimento cadastrado!");
      setNome("");
      setCategoria("");
      setDuracao("30");
      setPreco("");
      setDescricao("");
      setOpen(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProcedimento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedimentos"] });
      toast.success("Procedimento excluído");
    },
    onError: (e) => toast.error(String(e)),
  });

  const categorias = [...new Set((procedimentos ?? []).map((p) => p.categoria).filter(Boolean))] as string[];

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Tratamentos
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Procedimentos & Tratamentos
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Catálogo de procedimentos da sua clínica — adaptado ao segmento (estética, odonto,
              dermato, etc.). Usados na agenda, financeiro e orçamentos.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" />
                Novo Procedimento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo procedimento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Harmonização Facial" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Categoria</Label>
                  <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="ex: Harmonização, Implante, Pele" className="mt-1.5 h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Duração (min)</Label>
                    <Input type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Preço (R$)</Label>
                    <Input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mt-1.5 text-sm" placeholder="Detalhes do procedimento..." />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !nome.trim()}
                  className="gradient-primary w-full font-semibold"
                >
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Filtros por categoria */}
              {categorias.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {categorias.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Tag className="h-3 w-3" /> {c}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(procedimentos ?? []).length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted-foreground">
                    Nenhum procedimento cadastrado. Adicione o primeiro!
                  </div>
                )}
                {(procedimentos ?? []).map((p) => (
                  <Card key={p.id} className="group gradient-surface shadow-card border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                          <Scissors className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-foreground">{p.nome}</h3>
                          {p.categoria && (
                            <p className="text-[11px] font-medium text-primary">{p.categoria}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        aria-label="Excluir"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {p.descricao && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.descricao}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" /> {p.duracao_min ?? 30} min
                      </span>
                      <span className="font-display text-sm font-bold text-foreground">{brl(Number(p.preco))}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ClinicLayout>
  );
}
