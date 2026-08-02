import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MessageCircle,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { RequireRole } from "@/components/require-role";
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
  createTenant,
  updateTenant,
  deleteTenant,
  type Tenant,
} from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/clinicas")({
  head: () => ({
    meta: [
      { title: "Gestão de Clínicas — CRM MultiSaaS" },
      {
        name: "description",
        content:
          "Painel White-Label de gestão de clínicas: funis de agendamento, captação, avaliações e retornos.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <RequireRole modulo="clinicas">
        <ClinicasPage />
      </RequireRole>
    </RequireAuth>
  ),
});

const specialtyStyles: Record<string, string> = {
  Odontologia: "bg-primary/15 text-primary",
  "Estética Avançada": "bg-info/15 text-info",
  Dermatologia: "bg-accent text-accent-foreground",
  Fisioterapia: "bg-success/15 text-success",
  Psicologia: "bg-warning/15 text-warning",
};

type ClinicStatus = Tenant["status"];

const statusLabels: Record<ClinicStatus, { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-success/15 text-success border-success/30" },
  trial: { label: "Trial", className: "bg-info/15 text-info border-info/30" },
  inadimplente: {
    label: "Inadimplente",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  suspensa: {
    label: "Suspensa",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const ESPECIALIDADES = [
  "Odontologia",
  "Estética Avançada",
  "Dermatologia",
  "Fisioterapia",
  "Psicologia",
];

const PLANOS = ["starter", "pro", "empresarial"];

const formInicial = {
  nome: "",
  slug: "",
  especialidade: "",
  status: "trial" as Tenant["status"],
  plano: "starter" as Tenant["plano"],
  descricao: "",
  cor_primaria: "#e11d48",
  dominio: "",
  waha_sessao: "",
};

function ClinicasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(formInicial);

  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
  });

  const set = (campo: keyof typeof form, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

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
      dominio: t.dominio ?? "",
      waha_sessao: t.waha_sessao ?? "",
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return updateTenant(editing.id, {
          nome: form.nome,
          especialidade: form.especialidade || null,
          status: form.status,
          plano: form.plano,
          descricao: form.descricao || null,
          cor_primaria: form.cor_primaria,
          dominio: form.dominio || null,
          waha_sessao: form.waha_sessao || null,
        });
      }
      return createTenant({
        nome: form.nome,
        slug: form.slug || form.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        especialidade: form.especialidade || null,
        status: form.status,
        plano: form.plano,
        descricao: form.descricao || null,
        cor_primaria: form.cor_primaria,
        cor_segundaria: null,
        dominio: form.dominio || null,
        waha_sessao: form.waha_sessao || null,
        whatsapp_sessions: 0,
        mrr: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(editing ? "Clínica atualizada!" : "Clínica criada!");
      setDialogOpen(false);
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
    if (!form.nome.trim()) {
      toast.error("Informe o nome da clínica");
      return;
    }
    saveMutation.mutate();
  };

  const filtered = (tenants ?? []).filter(
    (t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      (t.especialidade ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Gestão de Clínicas (CRM)
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              CRM Customizado para Clínicas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Gerencie as clínicas white-label: crie, edite o branding, defina o segmento e o
              status de cada uma.
            </p>
          </div>
          <Button
            size="lg"
            onClick={openCriar}
            className="gradient-primary shadow-glow font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Nova Clínica
          </Button>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por clínica, especialidade..."
              className="h-11 border-border/60 bg-card pl-9 text-sm"
            />
          </div>
        </div>

        <section className="mt-6">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="grid place-items-center py-20">
              <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                <p className="font-semibold text-destructive">Erro ao carregar clínicas</p>
                <p className="mt-2 text-sm text-muted-foreground">{String(error)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(tenants ?? []).length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground">
                  Nenhuma clínica cadastrada. Clique em "Cadastrar Nova Clínica".
                </div>
              )}
              {filtered.map((c) => {
                const status = statusLabels[c.status];
                return (
                  <Card
                    key={c.id}
                    className="group gradient-surface shadow-card relative flex flex-col border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                          specialtyStyles[c.especialidade ?? ""] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.especialidade ?? "Clínica"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditar(c)}
                          aria-label="Editar"
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir a clínica "${c.nome}"?`)) deleteMutation.mutate(c.id);
                          }}
                          aria-label="Excluir"
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-glow"
                        style={{ background: c.cor_primaria }}
                      >
                        {c.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-lg font-bold text-foreground">
                          {c.nome}
                        </h3>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {c.slug}
                        </p>
                      </div>
                    </div>
                    {c.descricao && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {c.descricao}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <MessageCircle className="h-3.5 w-3.5 text-primary" />
                        {c.whatsapp_sessions ?? 0} sessões WAHA
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal criar/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar clínica" : "Nova clínica"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome</Label>
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Clínica Bella" className="mt-1.5 h-11" required />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Slug (subdomínio){editing ? "" : " — opcional"}
                  </Label>
                  <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="bella" className="mt-1.5 h-11 font-mono" disabled={!!editing} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Segmento</Label>
                  <Select value={form.especialidade} onValueChange={(v) => set("especialidade", v)}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder="Escolha o segmento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESPECIALIDADES.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusLabels).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s as ClinicStatus].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição</Label>
                <Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Breve descrição da clínica" className="mt-1.5 h-11" />
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
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANOS.map((p) => (
                        <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Domínio próprio</Label>
                  <Input value={form.dominio} onChange={(e) => set("dominio", e.target.value)} placeholder="crm.minhaclinica.com.br" className="mt-1.5 h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sessão WAHA</Label>
                  <Input value={form.waha_sessao} onChange={(e) => set("waha_sessao", e.target.value)} placeholder="crmprincipal" className="mt-1.5 h-11 text-sm" />
                </div>
              </div>

              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary w-full font-semibold">
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editing ? "Salvar alterações" : "Criar clínica"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
