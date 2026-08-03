import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareMore, Plus, Loader2, Zap, Bot, Trash2, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { EmptyState } from "@/components/shared/empty-state";
import { listBots, createBot, updateBot, deleteBot, type Bot as BotConfig } from "@/lib/supabase/bots";
import { listTenants } from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/master/bots")({
  head: () => ({
    meta: [{ title: "Bots de Atendimento — MedeirosInfra Master" }],
  }),
  component: BotsMaster,
});

const formInicial = {
  nome: "",
  saudacao: "",
  keyword: "",
  resposta: "",
  transferirHumano: true,
  tenant_id: "" as string, // "" = master (todas as clínicas)
};

function BotsMaster() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BotConfig | null>(null);
  const [form, setForm] = useState(formInicial);

  const { data: bots, isLoading } = useQuery({ queryKey: ["bots"], queryFn: listBots });
  const { data: tenants } = useQuery({ queryKey: ["tenants"], queryFn: listTenants });

  const openCriar = () => {
    setEditing(null);
    setForm(formInicial);
    setOpen(true);
  };

  const openEditar = (b: BotConfig) => {
    setEditing(b);
    setForm({
      nome: b.nome,
      saudacao: b.saudacao ?? "",
      keyword: b.keyword ?? "",
      resposta: b.resposta ?? "",
      transferirHumano: b.transferirHumano,
      tenant_id: b.tenant_id ?? "",
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        nome: form.nome,
        saudacao: form.saudacao || null,
        keyword: form.keyword || null,
        resposta: form.resposta || null,
        transferirHumano: form.transferirHumano,
      };
      if (editing) {
        return updateBot(editing.id, input);
      }
      return createBot({ ...input, tenant_id: form.tenant_id || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      toast.success(editing ? "Bot atualizado!" : "Bot criado!");
      setOpen(false);
      setForm(formInicial);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      toast.success("Bot excluído");
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    saveMutation.mutate();
  };

  const nomeTenant = (id: string | null) =>
    tenants?.find((t) => t.id === id)?.nome ?? "Master (todas)";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Ferramentas do Master</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Bots de Atendimento</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure bots que respondem automaticamente no WhatsApp das clínicas.
          </p>
        </div>
        <Button size="lg" onClick={openCriar} className="gradient-primary shadow-glow font-semibold">
          <Plus className="mr-1.5 h-4 w-4" /> Novo Bot
        </Button>
      </header>

      <section className="mt-8">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (bots ?? []).length === 0 ? (
          <EmptyState
            icon={Bot}
            title="Nenhum bot configurado"
            description="Crie um bot para atender automaticamente os clientes."
            action={<Button onClick={openCriar}>Criar bot</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(bots ?? []).map((b) => (
              <Card key={b.id} className="border-border/60 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">{b.nome}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Clínica: <span className="font-mono">{nomeTenant(b.tenant_id)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditar(b)} aria-label="Editar" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm(`Excluir o bot "${b.nome}"?`)) deleteMutation.mutate(b.id); }} aria-label="Excluir" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${b.ativo ? "border-success/30 bg-success/10 text-success" : "border-border/40 text-muted-foreground"}`}>
                    {b.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Keyword: {b.keyword || "qualquer"}
                  </span>
                </div>

                <div className="mt-4 rounded-lg border border-border/40 bg-muted/30 p-3">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                    <Zap className="h-3 w-3" /> Saudação
                  </p>
                  <p className="mt-1 text-sm text-foreground">{b.saudacao}</p>
                </div>

                <div className="mt-3 rounded-lg border border-border/40 bg-muted/30 p-3">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                    <MessageSquareMore className="h-3 w-3" /> Resposta
                  </p>
                  <p className="mt-1 text-sm text-foreground">{b.resposta}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <span>Transferir para humano</span>
                  <Switch checked={b.transferirHumano} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar bot" : "Novo bot"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome do bot</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Atendente Botox" className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Clínica (atende)</Label>
              <Select value={form.tenant_id || "master"} onValueChange={(v) => setForm((f) => ({ ...f, tenant_id: v === "master" ? "" : v }))}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master — todas as clínicas</SelectItem>
                  {(tenants ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Saudação</Label>
              <Input value={form.saudacao} onChange={(e) => setForm((f) => ({ ...f, saudacao: e.target.value }))} placeholder="Olá! Sou o assistente da clínica." className="mt-1.5 h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Palavra-chave</Label>
                <Input value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} placeholder="botox" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transferir humano</Label>
                <div className="mt-3 flex items-center gap-2">
                  <Switch checked={form.transferirHumano} onCheckedChange={(v) => setForm((f) => ({ ...f, transferirHumano: v }))} />
                  <span className="text-xs text-muted-foreground">{form.transferirHumano ? "Sim" : "Não"}</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resposta automática</Label>
              <Textarea value={form.resposta} onChange={(e) => setForm((f) => ({ ...f, resposta: e.target.value }))} className="mt-1.5 text-sm" placeholder="Ótima escolha! Quer agendar?" />
            </div>
            <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary w-full font-semibold">
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editing ? "Salvar" : "Criar bot"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
