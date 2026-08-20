import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus, Loader2, Trash2, Send, Users } from "lucide-react";
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
import { listCampanhas, createCampanha, deleteCampanha } from "@/lib/supabase/procedimentos-campanhas";
import { toast } from "sonner";

export const Route = createFileRoute("/campanhas")({
  head: () => ({
    meta: [{ title: "Campanhas — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <CampanhasPage />
    </RequireClinic>
  ),
});

const statusStyles: Record<string, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border/40" },
  agendada: { label: "Agendada", className: "bg-info/15 text-info border-info/30" },
  enviando: { label: "Enviando", className: "bg-warning/15 text-warning border-warning/30" },
  enviada: { label: "Enviada", className: "bg-success/15 text-success border-success/30" },
  cancelada: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function CampanhasPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");

  const { data: campanhas, isLoading } = useQuery({
    queryKey: ["campanhas"],
    queryFn: listCampanhas,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCampanha({
        nome,
        mensagem,
        status: "rascunho",
        waha_sessao: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success("Campanha criada como rascunho!");
      setNome("");
      setMensagem("");
      setOpen(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampanha,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success("Campanha excluída");
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Marketing
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Campanhas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Disparo de mensagens em massa via WhatsApp (WAHA). Ideal para confirmações, promoções
              e retornos de pacientes.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Campanha Dia das Mães" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mensagem</Label>
                  <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="mt-1.5 min-h-[120px] text-sm" placeholder="Olá {nome}! Aqui é da clínica..." />
                  <p className="mt-1 text-[10px] text-muted-foreground">Use {'{nome}'} para personalizar com o nome do contato.</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  O envio usa automaticamente o WhatsApp conectado da sua clínica (configure em
                  "WhatsApp da Clínica" caso ainda não tenha conectado).
                </p>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !nome.trim() || !mensagem.trim()}
                  className="gradient-primary w-full font-semibold"
                >
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar campanha
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(campanhas ?? []).length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground">
                  Nenhuma campanha criada ainda.
                </div>
              )}
              {(campanhas ?? []).map((c) => {
                const status = statusStyles[c.status] ?? statusStyles.rascunho;
                return (
                  <Card key={c.id} className="group gradient-surface shadow-card flex flex-col border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-foreground">{c.nome}</h3>
                          <p className="text-[11px] text-muted-foreground">
                            Criada em {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(c.id)}
                        aria-label="Excluir"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {c.mensagem}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {c.enviados}/{c.total_contatos || 0} enviados
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ClinicLayout>
  );
}
