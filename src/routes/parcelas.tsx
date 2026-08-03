import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Plus, Loader2, Wallet, CheckCircle2, Clock, AlertTriangle, HandCoins } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPlanosPagamento, criarPlanoPagamento, registrarPagamentoParcela, cancelarPlano } from "@/lib/supabase/pagamentos";
import { listPacientes } from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/parcelas")({
  head: () => ({
    meta: [{ title: "Parcelas — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <RequireRole modulo="parcelas">
        <ParcelasPage />
      </RequireRole>
    </RequireClinic>
  ),
});

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtData = (d: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const FORMAS = ["boleto", "pix", "cartao", "amigavel"];

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    pago: { label: "Pago", cls: "border-success/30 bg-success/10 text-success" },
    parcial: { label: "Parcial", cls: "border-warning/30 bg-warning/10 text-warning" },
    atrasado: { label: "Atrasado", cls: "border-destructive/30 bg-destructive/10 text-destructive" },
    pendente: { label: "Pendente", cls: "border-border/40 text-muted-foreground" },
    cancelado: { label: "Cancelado", cls: "border-border/40 text-muted-foreground" },
  };
  return map[status] ?? map.pendente;
};

function ParcelasPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [openParcela, setOpenParcela] = useState<{ id: string; valor: number } | null>(null);
  const [valorParcela, setValorParcela] = useState("");
  const [form, setForm] = useState({
    paciente_id: "",
    descricao: "",
    valor_total: "",
    entrada: "0",
    num_parcelas: "1",
    vencimento: "",
    forma_pagamento: "boleto",
  });
  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const { data: planos, isLoading } = useQuery({
    queryKey: ["planos-pagamento"],
    queryFn: listPlanosPagamento,
  });
  const { data: pacientes } = useQuery({ queryKey: ["pacientes"], queryFn: listPacientes });

  const criarMutation = useMutation({
    mutationFn: () =>
      criarPlanoPagamento({
        paciente_id: form.paciente_id || null,
        descricao: form.descricao || null,
        valor_total: parseFloat(form.valor_total) || 0,
        entrada: parseFloat(form.entrada) || 0,
        num_parcelas: parseInt(form.num_parcelas) || 1,
        vencimento: form.vencimento,
        forma_pagamento: form.forma_pagamento || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-pagamento"] });
      toast.success("Plano de pagamento criado!");
      setOpen(false);
      setForm({ paciente_id: "", descricao: "", valor_total: "", entrada: "0", num_parcelas: "1", vencimento: "", forma_pagamento: "boleto" });
    },
    onError: (e) => toast.error(String(e)),
  });

  const pagarMutation = useMutation({
    mutationFn: () => registrarPagamentoParcela(openParcela!.id, parseFloat(valorParcela) || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-pagamento"] });
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      toast.success("Pagamento registrado!");
      setOpenParcela(null);
      setValorParcela("");
    },
    onError: (e) => toast.error(String(e)),
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelarPlano,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-pagamento"] });
      toast.success("Plano cancelado");
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Financeiro</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Parcelas & Planos de Pagamento
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Parcelamento amigável de tratamentos. Cadastre o valor total e o nº de parcelas — o sistema gera o
              vencimento de cada uma automaticamente.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                <Plus className="mr-1.5 h-4 w-4" /> Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Novo plano de pagamento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Paciente</Label>
                  <Select value={form.paciente_id} onValueChange={(v) => set("paciente_id", v)}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                    <SelectContent>
                      {(pacientes ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição / Tratamento</Label>
                  <Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="ex: Ciclo de botox, Aparelho..." className="mt-1.5 h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Valor total (R$)</Label>
                    <Input type="number" value={form.valor_total} onChange={(e) => set("valor_total", e.target.value)} placeholder="2200" className="mt-1.5 h-11 font-mono" required />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Entrada (R$)</Label>
                    <Input type="number" value={form.entrada} onChange={(e) => set("entrada", e.target.value)} placeholder="0" className="mt-1.5 h-11 font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nº de parcelas</Label>
                    <Input type="number" min={1} value={form.num_parcelas} onChange={(e) => set("num_parcelas", e.target.value)} placeholder="6" className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">1º vencimento</Label>
                    <Input type="date" value={form.vencimento} onChange={(e) => set("vencimento", e.target.value)} className="mt-1.5 h-11" required />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Forma de pagamento</Label>
                  <Select value={form.forma_pagamento} onValueChange={(v) => set("forma_pagamento", v)}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMAS.map((f) => (
                        <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => criarMutation.mutate()}
                  disabled={criarMutation.isPending || !form.valor_total || !form.vencimento}
                  className="gradient-primary w-full font-semibold"
                >
                  {criarMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Gerar parcelas
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-4 w-4 text-primary" /> Total em planos</div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{brl((planos ?? []).reduce((s, p) => s + Number(p.valor_total), 0))}</p>
          </Card>
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Recebido</div>
            <p className="mt-2 font-display text-2xl font-bold text-success">{brl((planos ?? []).reduce((s, p) => s + Number(p.total_pago), 0))}</p>
          </Card>
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-4 w-4 text-warning" /> A receber</div>
            <p className="mt-2 font-display text-2xl font-bold text-warning">{brl((planos ?? []).reduce((s, p) => s + Number(p.restante), 0))}</p>
          </Card>
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CreditCard className="h-4 w-4 text-primary" /> Planos ativos</div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{(planos ?? []).filter((p) => p.status === "ativo").length}</p>
          </Card>
        </div>

        {/* Lista de planos */}
        <section className="mt-8">
          {isLoading ? (
            <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (planos ?? []).length === 0 ? (
            <div className="grid place-items-center py-20 text-center text-muted-foreground">
              <div>
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3">Nenhum plano de pagamento ainda.</p>
                <p className="text-sm">Clique em "Novo Plano" para cadastrar o primeiro parcelamento.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(planos ?? []).map((plano) => (
                <Card key={plano.id} className="border-border/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {plano.paciente_nome ?? "Paciente"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {plano.descricao ?? "Plano"} · {plano.forma_pagamento?.toUpperCase() ?? "BOLETO"} ·{" "}
                        {plano.num_parcelas}x de {brl(plano.num_parcelas ? Number(plano.valor_total) / plano.num_parcelas : 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Recebido / Total</p>
                        <p className="font-display text-base font-bold text-success">{brl(plano.total_pago)} <span className="text-muted-foreground">/ {brl(plano.valor_total)}</span></p>
                      </div>
                      <Badge className={statusBadge(plano.status).cls}>
                        {plano.status === "ativo" ? "Ativo" : plano.status === "quitado" ? "Quitado" : "Cancelado"}
                      </Badge>
                      {plano.status === "ativo" && (
                        <Button variant="outline" size="sm" onClick={() => { if (confirm("Cancelar este plano?")) cancelarMutation.mutate(plano.id); }}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Parcelas */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Vencimento</th>
                          <th className="px-4 py-2 text-right">Valor</th>
                          <th className="px-4 py-2 text-right">Pago</th>
                          <th className="px-4 py-2 text-center">Status</th>
                          <th className="px-4 py-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {plano.parcelas.map((par) => {
                          const restante = Number(par.valor) - Number(par.pago);
                          const badge = statusBadge(par.status);
                          return (
                            <tr key={par.id} className="bg-card hover:bg-muted/30">
                              <td className="px-4 py-2.5 font-mono text-muted-foreground">{par.numero}</td>
                              <td className="px-4 py-2.5">{fmtData(par.vencimento)}</td>
                              <td className="px-4 py-2.5 text-right font-semibold">{brl(Number(par.valor))}</td>
                              <td className="px-4 py-2.5 text-right text-success">{brl(Number(par.pago))}</td>
                              <td className="px-4 py-2.5 text-center">
                                <Badge className={badge.cls}>{badge.label}</Badge>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {par.status !== "pago" && par.status !== "cancelado" && restante > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => { setOpenParcela({ id: par.id, valor: restante }); setValorParcela(String(restante)); }}
                                  >
                                    <HandCoins className="mr-1.5 h-3.5 w-3.5" /> Receber
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Dialog de pagamento */}
      <Dialog open={!!openParcela} onOpenChange={(v) => { if (!v) setOpenParcela(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader>
          {openParcela && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Valor da parcela: <strong>{brl(openParcela.valor)}</strong>. Registre quanto o paciente pagou (pode ser parcial).
              </p>
              <Input
                type="number"
                value={valorParcela}
                onChange={(e) => setValorParcela(e.target.value)}
                placeholder="Valor pago"
                className="h-11 font-mono"
                max={openParcela.valor}
              />
              <Button
                onClick={() => pagarMutation.mutate()}
                disabled={pagarMutation.isPending || !valorParcela || parseFloat(valorParcela) <= 0}
                className="gradient-primary w-full font-semibold"
              >
                {pagarMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirmar pagamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ClinicLayout>
  );
}
