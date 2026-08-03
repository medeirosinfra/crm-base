import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, MessageCircle, Loader2, Pencil, Trash2, KeyRound, Building2, CheckCircle2, Hourglass, CircleDollarSign, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  listTenants,
  updateTenant,
  deleteTenant,
  type Tenant,
} from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/master/clinicas")({
  head: () => ({
    meta: [{ title: "Gestão de Clínicas — MedeirosInfra Master" }],
  }),
  component: ClinicasMaster,
});

const statusLabels: Record<Tenant["status"], { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-success/15 text-success border-success/30" },
  trial: { label: "Trial", className: "bg-info/15 text-info border-info/30" },
  inadimplente: { label: "Inadimplente", className: "bg-warning/15 text-warning border-warning/30" },
  suspensa: { label: "Suspensa", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ESPECIALIDADES = ["Harmonização Facial", "Odontologia", "Dermatologia", "Fisioterapia", "Psicologia"];
const PLANOS = ["starter", "pro", "empresarial"];

const formInicial = {
  nome: "",
  slug: "",
  especialidade: "",
  status: "trial" as Tenant["status"],
  plano: "starter" as Tenant["plano"],
  descricao: "",
  cor_primaria: "#e11d48",
  waha_sessao: "",
  // Campos do admin automático
  adminNome: "",
  adminEmail: "",
  adminSenha: "",
};

function ClinicasMaster() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(formInicial);
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null);
  const [credenciaisOpen, setCredenciaisOpen] = useState(false);

  const { data: tenants, isLoading } = useQuery({ queryKey: ["tenants"], queryFn: listTenants });

  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const openCriar = () => {
    setEditing(null);
    setForm(formInicial);
    setDialogOpen(true);
  };

  const openEditar = (t: Tenant) => {
    setEditing(t);
    setForm({
      nome: t.nome,
      slug: t.slug,
      especialidade: t.especialidade ?? "",
      status: t.status,
      plano: t.plano,
      descricao: t.descricao ?? "",
      cor_primaria: t.cor_primaria,
      waha_sessao: t.waha_sessao ?? "",
      adminNome: "",
      adminEmail: "",
      adminSenha: "",
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateTenant(editing.id, {
          nome: form.nome,
          especialidade: form.especialidade || null,
          status: form.status,
          plano: form.plano,
          descricao: form.descricao || null,
          cor_primaria: form.cor_primaria,
          waha_sessao: form.waha_sessao || null,
        });
      }
      // Criação com admin automático via rota customizada
      const resp = await fetch("/api/clinicas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          slug: form.slug || form.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          especialidade: form.especialidade,
          adminNome: form.adminNome || form.nome,
          adminEmail: form.adminEmail,
          adminSenha: form.adminSenha,
          corPrimaria: form.cor_primaria,
          plano: form.plano,
          wahaSessao: form.waha_sessao || undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ erro: "Falha ao criar clínica" }));
        throw new Error(err.erro ?? "Falha ao criar clínica");
      }
      return (await resp.json()) as { credenciais: { email: string; senha: string } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Clínica criada com admin automático!");
      setDialogOpen(false);
      if (data && "credenciais" in data) {
        setCredenciais(data.credenciais);
        setCredenciaisOpen(true);
      }
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Clínica excluída");
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    saveMutation.mutate();
  };

  const filtered = (tenants ?? []).filter(
    (t) => t.nome.toLowerCase().includes(search.toLowerCase()) || (t.especialidade ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Painel Master</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gerencie as clínicas white-label da plataforma. Cada cliente recebe um painel próprio com admin automático.
          </p>
        </div>
        <Button size="lg" onClick={openCriar} className="gradient-primary shadow-glow font-semibold">
          <Plus className="mr-1.5 h-4 w-4" /> Novo Cliente
        </Button>
      </header>

      {/* KPIs do negócio */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary" /> Total de clientes
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{(tenants ?? []).length}</p>
        </Card>
        <Card className="border-border/60 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" /> Ativos
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-success">{(tenants ?? []).filter((t) => t.status === "ativa").length}</p>
        </Card>
        <Card className="border-border/60 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hourglass className="h-4 w-4 text-warning" /> Em trial
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-warning">{(tenants ?? []).filter((t) => t.status === "trial").length}</p>
        </Card>
        <Card className="border-border/60 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CircleDollarSign className="h-4 w-4 text-primary" /> MRR estimado
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{brl((tenants ?? []).reduce((s, t) => s + (Number(t.mrr) || 0), 0))}</p>
        </Card>
      </div>

      {/* Guia rápido de uso */}
      <section className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Como criar um cliente em 3 passos</h3>
        </div>
        <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="flex gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
            <span>Clique em <strong className="text-foreground">"Novo Cliente"</strong> acima</span>
          </div>
          <div className="flex gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
            <span>Preencha nome, segmento e <strong className="text-foreground">login do admin</strong> da clínica</span>
          </div>
          <div className="flex gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
            <span>Entregue as <strong className="text-foreground">credenciais</strong> à dona — ela acessa o painel da clínica</span>
          </div>
        </div>
      </section>

      <div className="mt-6 relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="h-11 border-border/60 bg-card pl-9 text-sm" />
      </div>

      <section className="mt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(tenants ?? []).length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">Nenhum cliente cadastrado.</div>
            )}
            {filtered.map((c) => {
              const status = statusLabels[c.status];
              return (
                <Card key={c.id} className="group gradient-surface shadow-card relative flex flex-col border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold bg-primary/15 text-primary">
                      {c.especialidade ?? "Cliente"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditar(c)} aria-label="Editar" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Excluir a clínica "${c.nome}"?`)) deleteMutation.mutate(c.id); }} aria-label="Excluir" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-glow" style={{ background: c.cor_primaria }}>
                      {c.nome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold text-foreground">{c.nome}</h3>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{c.slug}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MessageCircle className="h-3.5 w-3.5 text-primary" /> {c.whatsapp_sessions ?? 0} WAHA
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold ${status.className}`}>{status.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar clínica" : "Nova clínica"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome</Label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Clínica Bella" className="mt-1.5 h-11" required />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Slug (subdomínio)</Label>
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="bella" className="mt-1.5 h-11 font-mono" disabled={!!editing} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Segmento</Label>
                <Select value={form.especialidade} onValueChange={(v) => set("especialidade", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Escolha..." /></SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusLabels).map((s) => <SelectItem key={s} value={s}>{statusLabels[s as Tenant["status"]].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição</Label>
              <Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Sessão WhatsApp (WAHA)
              </Label>
              <Input value={form.waha_sessao} onChange={(e) => set("waha_sessao", e.target.value)} placeholder="ex: clinica_dra_luana" className="mt-1.5 h-11 font-mono text-sm" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Nome da sessão WAHA da clínica. As mensagens desta sessão são atendidas pelos bots desta clínica.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cor primária</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input type="color" value={form.cor_primaria} onChange={(e) => set("cor_primaria", e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-border/60 bg-transparent" />
                  <Input value={form.cor_primaria} onChange={(e) => set("cor_primaria", e.target.value)} className="h-11 font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plano</Label>
                <Select value={form.plano} onValueChange={(v) => set("plano", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLANOS.map((p) => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Admin automático — só na criação */}
            {!editing && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Admin automático da clínica
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Cria automaticamente o login do administrador que a dona da clínica usará.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome do admin</Label>
                    <Input value={form.adminNome} onChange={(e) => set("adminNome", e.target.value)} placeholder="Nome da responsável" className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email do admin *</Label>
                    <Input type="email" value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} placeholder="dona@clinica.com.br" className="mt-1.5 h-11" required />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Senha do admin *</Label>
                    <Input type="password" value={form.adminSenha} onChange={(e) => set("adminSenha", e.target.value)} placeholder="Senha temporária" className="mt-1.5 h-11" required minLength={6} />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary w-full font-semibold">
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editing ? "Salvar alterações" : "Criar clínica com admin"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de credenciais geradas */}
      <Dialog open={credenciaisOpen} onOpenChange={setCredenciaisOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Clínica criada! Entregue o acesso à dona</DialogTitle></DialogHeader>
          {credenciais && (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-success">Credenciais do admin</p>
                <p className="mt-2 text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-mono font-semibold">{credenciais.email}</span></p>
                <p className="mt-1 text-sm"><span className="text-muted-foreground">Senha:</span> <span className="font-mono font-semibold">{credenciais.senha}</span></p>
              </div>
              <p className="text-xs text-muted-foreground">
                A dona da clínica loga em <span className="font-mono">crm.medeirossolucoestech.com.br</span> com essas credenciais e gerencia funcionários, setores e agendas.
              </p>
              <Button onClick={() => setCredenciaisOpen(false)} className="gradient-primary w-full font-semibold">
                Entendi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
