import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Wallet, CalendarDays, Loader2, Phone, Mail, Scissors, HandCoins, Plus, ClipboardList, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPaciente,
  listAgendamentosDoPaciente,
  listTransacoesDoPaciente,
} from "@/lib/supabase/pacientes";
import { listPlanosPagamento, criarPlanoPagamento, deletarPlano, marcarEntradaPaga, registrarPagamentoParcela, type Parcela } from "@/lib/supabase/pagamentos";
import { updatePaciente, deletePaciente, type Paciente } from "@/lib/supabase/tenants";
import { formatData, formatTelefone, formatBRL, formatHora } from "@/lib/formatters";
import { PatientFichaTab } from "@/components/contacts/patient-ficha-tab";

export const Route = createFileRoute("/pacientes/$id")({
  head: () => ({ meta: [{ title: "Detalhe do Paciente — MedeirosInfra" }] }),
  component: () => (
    <RequireClinic>
      <PacienteDetalhePage />
    </RequireClinic>
  ),
});

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function PacienteDetalhePage() {
  const { id } = Route.useParams();
  const defaultTab = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tab") || "visao"
    : "visao";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const ensureTab = (val: string) => { setActiveTab(val); window.history.replaceState({}, "", `/pacientes/${id}?tab=${val}`); };

  const { data: paciente, isLoading } = useQuery({
    queryKey: ["pacientes", id],
    queryFn: () => getPaciente(id),
  });
  const { data: agendamentos } = useQuery({
    queryKey: ["pacientes", id, "agendamentos"],
    queryFn: () => listAgendamentosDoPaciente(id),
  });
  const { data: transacoes } = useQuery({
    queryKey: ["pacientes", id, "transacoes"],
    queryFn: () => listTransacoesDoPaciente(id),
  });
  const { data: planos } = useQuery({
    queryKey: ["pacientes", id, "planos"],
    queryFn: () => listPlanosPagamento().then((ps) => ps.filter((p) => p.paciente_id === id)),
  });

  // ---- Edição do paciente (dialog) ----
  const [openEdit, setOpenEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    observacoes: "",
  });
  const abrirEdicao = (p: Paciente) => {
    setEditForm({
      nome: p.nome ?? "",
      telefone: p.telefone ?? "",
      email: p.email ?? "",
      endereco: p.endereco ?? "",
      observacoes: p.observacoes ?? "",
    });
    setOpenEdit(true);
  };
  const setEdit = (campo: keyof typeof editForm, valor: string) => setEditForm((f) => ({ ...f, [campo]: valor }));

  const editMutation = useMutation({
    mutationFn: () =>
      updatePaciente(id, {
        nome: editForm.nome,
        telefone: editForm.telefone || null,
        email: editForm.email || null,
        endereco: editForm.endereco || null,
        observacoes: editForm.observacoes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes", id] });
      toast.success("Paciente atualizado!");
      setOpenEdit(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (pacienteId: string) => deletePaciente(pacienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente excluído!");
      window.location.href = "/pacientes";
    },
    onError: (e) => toast.error(String(e)),
  });
  const handleExcluir = (p: Paciente) => {
    if (!confirm(`Excluir o paciente "${p.nome}"? Esta ação não pode ser desfeita.`)) return;
    deleteMutation.mutate(p.id);
  };

  // Formulário da negociação (o que foi fechado com o cliente na avaliação)
  const [openNegociacao, setOpenNegociacao] = useState(false);
  const [form, setForm] = useState({
    procedimento_id: "",
    descricao: "",
    valor_total: "",
    entrada: "0",
    num_parcelas: "1",
    vencimento: "",
  });
  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));
  const queryClient = useQueryClient();

  // Dialog de pagamento (entrada ou parcela) — permite valor parcial
  const [pagamentoTarget, setPagamentoTarget] = useState<{
    tipo: "entrada" | "parcela";
    planoId?: string;
    parcela?: Parcela;
  } | null>(null);
  const [valorPagamento, setValorPagamento] = useState("");

  const abrirPagamento = (tipo: "entrada" | "parcela", planoId?: string, parcela?: Parcela) => {
    setPagamentoTarget({ tipo, planoId, parcela });
    if (tipo === "entrada") {
      const plano = (planos ?? []).find((p) => p.id === planoId);
      setValorPagamento(String(plano?.entrada ?? 0));
    } else if (parcela) {
      setValorPagamento(String(Number(parcela.valor) - Number(parcela.pago)));
    }
  };

  const confirmarPagamento = () => {
    const valor = parseFloat(valorPagamento.replace(",", ".")) || 0;
    if (valor <= 0) { toast.error("Informe um valor válido."); return; }
    if (pagamentoTarget?.tipo === "entrada") {
      pagarEntradaMutation.mutate(pagamentoTarget.planoId!);
    } else if (pagamentoTarget?.parcela) {
      pagarParcelaMutation.mutate({ parcelaId: pagamentoTarget.parcela.id, valor });
    }
    setPagamentoTarget(null);
    setValorPagamento("");
  };

  const criarNegociacao = useMutation({
    mutationFn: () =>
      criarPlanoPagamento({
        paciente_id: id,
        procedimento_id: form.procedimento_id || null,
        descricao: form.descricao || null,
        valor_total: parseFloat(form.valor_total) || 0,
        entrada: parseFloat(form.entrada) || 0,
        num_parcelas: parseInt(form.num_parcelas) || 1,
        vencimento: form.vencimento,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "planos"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "transacoes"] });
      toast.success("Negociação registrada! Parcelas geradas.");
      setOpenNegociacao(false);
      setForm({ procedimento_id: "", descricao: "", valor_total: "", entrada: "0", num_parcelas: "1", vencimento: "" });
    },
    onError: (e) => toast.error(`Erro ao registrar: ${e.message}`),
  });

  const deletarNegociacao = useMutation({
    mutationFn: (planoId: string) => deletarPlano(planoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "planos"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "transacoes"] });
      toast.success("Negociação excluída com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao excluir: ${e.message}`),
  });

  const pagarEntradaMutation = useMutation({
    mutationFn: (planoId: string) => marcarEntradaPaga(planoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "planos"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "transacoes"] });
      toast.success("Entrada marcada como recebida!");
    },
    onError: (e) => toast.error(`Erro ao marcar entrada: ${e.message}`),
  });

  const pagarParcelaMutation = useMutation({
    mutationFn: ({ parcelaId, valor }: { parcelaId: string; valor: number }) =>
      registrarPagamentoParcela(parcelaId, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "planos"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes", id, "transacoes"] });
      toast.success("Pagamento registrado!");
    },
    onError: (e) => toast.error(`Erro ao registrar pagamento: ${e.message}`),
  });

  const totalGasto = (transacoes ?? [])
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((s, t) => s + Number(t.valor), 0);
  const procedimentosFeitos = (agendamentos ?? []).filter((a) => a.status === "concluido").length;

  if (isLoading) {
    return (
      <ClinicLayout>
        <div className="grid min-h-[60vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClinicLayout>
    );
  }

  if (!paciente) {
    return (
      <ClinicLayout>
        <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
          Paciente não encontrado.
        </div>
      </ClinicLayout>
    );
  }

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <Link to="/pacientes" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para pacientes
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
            {paciente.nome?.charAt(0) ?? "P"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground truncate">{paciente.nome ?? "Paciente"}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> {formatTelefone(paciente.telefone)}
              </span>
              {paciente.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> {paciente.email}
                </span>
              )}
              {paciente.origem && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Origem: {paciente.origem}
                </span>
              )}
            </div>
          </div>

          {/* Ações dentro da ficha do paciente */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="gradient-primary shadow-glow font-semibold"
              onClick={() => ensureTab("ficha")}
            >
              <ClipboardList className="mr-1.5 h-4 w-4" /> Ficha & Avaliação
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="font-medium"
              onClick={() => abrirEdicao(paciente)}
            >
              <Pencil className="mr-1.5 h-4 w-4 text-primary" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="font-medium hover:border-destructive/40 hover:text-destructive"
              onClick={() => handleExcluir(paciente)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-1.5 h-4 w-4 text-destructive" /> Excluir
            </Button>
          </div>
        </div>

        {/* Mini resumo */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card className="border-border/60 p-4 text-center">
            <Users className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-2xl font-bold text-foreground">{(agendamentos ?? []).length}</p>
            <p className="text-[11px] text-muted-foreground">Agendamentos</p>
          </Card>
          <Card className="border-border/60 p-4 text-center">
            <Scissors className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-2xl font-bold text-foreground">{procedimentosFeitos}</p>
            <p className="text-[11px] text-muted-foreground">Procedimentos concluídos</p>
          </Card>
          <Card className="border-border/60 p-4 text-center">
            <Wallet className="mx-auto h-5 w-5 text-success" />
            <p className="mt-1 text-2xl font-bold text-success">{formatBRL(totalGasto)}</p>
            <p className="text-[11px] text-muted-foreground">Total investido</p>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={ensureTab} className="mt-8">
          <TabsList>
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="ficha">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Ficha & Prontuário
            </TabsTrigger>
            <TabsTrigger value="historico">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              <Wallet className="mr-1.5 h-3.5 w-3.5" /> Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao">
            <Card className="border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Dados cadastrais</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Nascimento</p>
                  <p className="mt-0.5 text-sm text-foreground">{formatData(paciente.nascimento)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">CPF</p>
                  <p className="mt-0.5 text-sm text-foreground">{paciente.cpf ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Gênero</p>
                  <p className="mt-0.5 text-sm text-foreground">{paciente.genero ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Última consulta</p>
                  <p className="mt-0.5 text-sm text-foreground">{formatData(paciente.ultima_consulta)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Endereço</p>
                  <p className="mt-0.5 text-sm text-foreground">{paciente.endereco ?? "—"}</p>
                </div>
                {paciente.observacoes && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Observações</p>
                    <p className="mt-0.5 text-sm text-foreground">{paciente.observacoes}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ficha">
            <PatientFichaTab
              pacienteId={id}
              agendamentos={agendamentos ?? []}
              planos={planos ?? []}
            />
          </TabsContent>

          <TabsContent value="historico">
            <Card className="border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Histórico de agendamentos</h2>
              {(agendamentos ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Procedimento</th>
                        <th className="hidden px-4 py-3 md:table-cell">Profissional</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(agendamentos ?? []).map((a) => (
                        <tr key={a.id} className="bg-card hover:bg-muted/30">
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatData(a.data)} · {formatHora(a.data)}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {a.procedimento?.nome ?? a.tipo ?? "Consulta"}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            {a.profissional?.nome ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {a.valor != null ? formatBRL(Number(a.valor)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {statusLabels[a.status] ?? a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {a.observacoes ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <Card className="border-border/60 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Transações financeiras</h2>
                <Dialog open={openNegociacao} onOpenChange={setOpenNegociacao}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-primary shadow-glow font-semibold">
                      <Plus className="mr-1.5 h-4 w-4" /> Nova negociação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <HandCoins className="h-5 w-5 text-primary" /> Registrar negociação
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Registre o que foi fechado com a cliente na avaliação (valor, entrada e parcelas). O sistema gera as parcelas automaticamente.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Descrição / Procedimento</label>
                        <Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex: Limpeza de pele + clareamento" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium">Valor total (R$)</label>
                          <Input type="number" value={form.valor_total} onChange={(e) => set("valor_total", e.target.value)} placeholder="0,00" />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Entrada (R$)</label>
                          <Input type="number" value={form.entrada} onChange={(e) => set("entrada", e.target.value)} placeholder="0" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium">Nº de parcelas</label>
                          <Input type="number" value={form.num_parcelas} onChange={(e) => set("num_parcelas", e.target.value)} placeholder="1" />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Vencimento 1ª parcela</label>
                          <Input type="date" value={form.vencimento} onChange={(e) => set("vencimento", e.target.value)} />
                        </div>
                      </div>

                      {/* Prévia automática do cálculo */}
                      {parseFloat(form.valor_total) > 0 && (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs space-y-1">
                          <p className="font-semibold text-primary">Simulação do parcelamento:</p>
                          <p className="text-foreground">
                            Valor total: <b>{formatBRL(parseFloat(form.valor_total) || 0)}</b>
                          </p>
                          <p className="text-foreground">
                            Entrada: <b>{formatBRL(parseFloat(form.entrada) || 0)}</b>
                          </p>
                          <p className="text-foreground">
                            Restante: <b>{formatBRL(Math.max((parseFloat(form.valor_total) || 0) - (parseFloat(form.entrada) || 0), 0))}</b> divididos em <b>{form.num_parcelas || 1}x</b> de <b className="text-success">{formatBRL(Math.round(((Math.max((parseFloat(form.valor_total) || 0) - (parseFloat(form.entrada) || 0), 0)) / Math.max(1, parseInt(form.num_parcelas) || 1)) * 100) / 100)}</b>
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={() => criarNegociacao.mutate()}
                        disabled={criarNegociacao.isPending || !form.valor_total}
                        className="w-full gradient-primary font-semibold"
                      >
                        {criarNegociacao.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar negociação"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Planos/negociações do paciente */}
              {(planos ?? []).length > 0 && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Planos de pagamento</h3>
                  {(planos ?? []).map((plano) => {
                    const parcelas = Array.isArray(plano.parcelas) ? (plano.parcelas as Parcela[]) : [];
                    const entradaValor = Number(plano.entrada ?? 0);
                    const pagoParcelas = parcelas.reduce((s, p) => s + Number(p.pago), 0);
                    const pagoTotal = (plano.entrada_paga ? entradaValor : 0) + pagoParcelas;
                    const total = Number(plano.valor_total);
                    const restante = Math.max(total - pagoTotal, 0);
                    const pct = total > 0 ? Math.min(100, Math.round((pagoTotal / total) * 100)) : 0;
                    const parcelasPagas = parcelas.filter((p) => Number(p.pago) >= Number(p.valor)).length;
                    return (
                      <div key={plano.id} className="rounded-xl border border-border/40 bg-card p-4 shadow-sm">
                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display text-base font-bold text-foreground">
                              {plano.descricao || "Plano de pagamento"}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {plano.num_parcelas}x de {formatBRL(total)} · Entrada {formatBRL(entradaValor ?? 0)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${plano.status === "ativo" ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground border-border/40"}`}>
                              {plano.status === "ativo" ? "Ativo" : plano.status}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled={deletarNegociacao.isPending}
                              onClick={() => {
                                if (confirm("Excluir este plano e suas parcelas?")) deletarNegociacao.mutate(plano.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Barra de progresso */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{pct}% pago</span>
                            <span>Pago: <b className="text-success">{formatBRL(pagoTotal)}</b> de <b className="text-foreground">{formatBRL(total)}</b></span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Entrada + Parcelas grid */}
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {/* Entrada */}
                          <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Entrada</p>
                                <p className="mt-0.5 text-lg font-bold text-foreground">{formatBRL(entradaValor)}</p>
                              </div>
                              {plano.entrada_paga ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Recebida
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[11px] font-semibold text-success hover:bg-success/10"
                                  onClick={() => abrirPagamento("entrada", plano.id)}
                                >
                                  <HandCoins className="mr-1 h-3.5 w-3.5" /> Receber
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Parcelas */}
                          <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Parcelas ({parcelasPagas}/{plano.num_parcelas} pagas)
                              </p>
                            </div>
                            <div className="mt-2 space-y-1.5">
                              {parcelas.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhuma parcela gerada ainda.</p>
                              ) : (
                                parcelas.map((p) => {
                                  const pago = Number(p.pago) >= Number(p.valor);
                                  const restante = Number(p.valor) - Number(p.pago);
                                  return (
                                    <div key={p.numero} className="flex items-center justify-between gap-2 rounded-md border border-border/30 bg-card px-2.5 py-1.5">
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground">
                                          {p.numero}ª · {formatData(p.vencimento)}
                                        </p>
                                        <p className={`text-xs ${pago ? "text-success" : "text-foreground"}`}>
                                          {formatBRL(Number(p.valor))}
                                          {pago && <span className="ml-1">✓ paga</span>}
                                        </p>
                                      </div>
                                      {!pago && p.status !== "cancelado" ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-[11px] font-semibold text-success hover:bg-success/10"
                                          disabled={pagarParcelaMutation.isPending}
                                          onClick={() => abrirPagamento("parcela", undefined, p)}
                                        >
                                          <HandCoins className="mr-1 h-3 w-3" /> Receber
                                        </Button>
                                      ) : (
                                        <span className="text-[11px] font-semibold text-success">
                                          {restante > 0 ? `resta ${formatBRL(restante)}` : "Pago"}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dialog de pagamento (entrada ou parcela) */}
              <Dialog open={!!pagamentoTarget} onOpenChange={(o) => !o && setPagamentoTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HandCoins className="h-5 w-5 text-primary" />
                      {pagamentoTarget?.tipo === "entrada" ? "Receber entrada" : "Receber parcela"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Valor recebido (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valorPagamento}
                        onChange={(e) => setValorPagamento(e.target.value)}
                        placeholder="0,00"
                        autoFocus
                      />
                      {pagamentoTarget?.parcela && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Parcela de {formatBRL(Number(pagamentoTarget.parcela.valor))} · já pago{" "}
                          {formatBRL(Number(pagamentoTarget.parcela.pago))}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={confirmarPagamento}
                      disabled={pagarEntradaMutation.isPending || pagarParcelaMutation.isPending}
                      className="w-full gradient-primary font-semibold"
                    >
                      {pagarEntradaMutation.isPending || pagarParcelaMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirmar pagamento"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <h2 className="font-display text-lg font-bold text-foreground">Transações financeiras</h2>
              {(transacoes ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhuma transação vinculada. (As transações de agendamentos futuros aparecerão aqui.)
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(transacoes ?? []).map((t) => (
                        <tr key={t.id} className="bg-card hover:bg-muted/30">
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatData(t.data)}</td>
                          <td className="px-4 py-3 text-foreground">{t.descricao}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${t.tipo === "receita" ? "text-success" : "text-destructive"}`}>
                            {t.tipo === "receita" ? "+" : "−"}{formatBRL(Math.abs(Number(t.valor)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de edição do paciente */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar paciente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome completo</label>
                <Input value={editForm.nome} onChange={(e) => setEdit("nome", e.target.value)} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Telefone</label>
                  <Input value={editForm.telefone} onChange={(e) => setEdit("telefone", e.target.value)} className="h-11 font-mono" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">E-mail</label>
                  <Input type="email" value={editForm.email} onChange={(e) => setEdit("email", e.target.value)} className="h-11" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Endereço</label>
                <Input value={editForm.endereco} onChange={(e) => setEdit("endereco", e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Observações</label>
                <Input value={editForm.observacoes} onChange={(e) => setEdit("observacoes", e.target.value)} className="h-11" />
              </div>
              <Button
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending || !editForm.nome.trim()}
                className="gradient-primary w-full font-semibold"
              >
                {editMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                Salvar alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClinicLayout>
  );
}
