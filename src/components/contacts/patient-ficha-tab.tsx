import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Stethoscope,
  FileText,
  Plus,
  Loader2,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAnamnese,
  upsertAnamnese,
  listProntuario,
  createProntuarioRegistro,
  deleteProntuarioRegistro,
  type ProntuarioRegistro,
} from "@/lib/supabase/prontuario";
import { OdontogramaGrid } from "@/components/contacts/odontograma-grid";
import { listProfissionais } from "@/lib/supabase/agendamentos";
import { formatData } from "@/lib/formatters";
import { toast } from "sonner";

const TIPOS_PELE = ["Oleosa", "Seca", "Mista", "Normal", "Sensível"];

const tipoBadge: Record<string, { label: string; color: string }> = {
  avaliacao: { label: "Avaliação", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  evolucao: { label: "Evolução", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  procedimento: { label: "Procedimento", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  retorno: { label: "Retorno", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  medicacao: { label: "Medicação / Receita", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
};

interface PatientFichaTabProps {
  pacienteId: string;
  agendamentos?: unknown[];
  planos?: unknown[];
}

export function PatientFichaTab({ pacienteId, agendamentos = [], planos = [] }: PatientFichaTabProps) {
  const queryClient = useQueryClient();

  // --- ANAMNESE ---
  const { data: anamnese, isLoading: loadingAnamnese } = useQuery({
    queryKey: ["anamnese", pacienteId],
    queryFn: () => getAnamnese(pacienteId),
  });

  const [anamneseForm, setAnamneseForm] = useState({
    alergias: "",
    medicamentos: "",
    doencas_cronicas: "",
    cirurgias_previas: "",
    gravidez: false,
    amamentando: false,
    fuma: false,
    consome_alcool: false,
    exposicao_sol: "",
    tipo_pele: "",
    queixa_principal: "",
    procedimentos_anteriores: "",
    expectativas: "",
    profissional_id: "",
    observacoes: "",
    procedimentos_alinhados: [] as Array<{ procedimento: string; valor: number | null; obs?: string }>,
    valor_orcado: "",
    valor_entrada: "",
    previsao_inicio: "",
    observacoes_orcamento: "",
  });

  useEffect(() => {
    if (anamnese) {
      const alinhados = Array.isArray(anamnese.procedimentos_alinhados)
        ? (anamnese.procedimentos_alinhados as Array<{ procedimento: string; valor: number | null; obs?: string }>)
        : [];
      setAnamneseForm({
        alergias: anamnese.alergias ?? "",
        medicamentos: anamnese.medicamentos ?? "",
        doencas_cronicas: anamnese.doencas_cronicas ?? "",
        cirurgias_previas: anamnese.cirurgias_previas ?? "",
        gravidez: !!anamnese.gravidez,
        amamentando: !!anamnese.amamentando,
        fuma: !!anamnese.fuma,
        consome_alcool: !!anamnese.consome_alcool,
        exposicao_sol: anamnese.exposicao_sol ?? "",
        tipo_pele: anamnese.tipo_pele ?? "",
        queixa_principal: anamnese.queixa_principal ?? "",
        procedimentos_anteriores: anamnese.procedimentos_anteriores ?? "",
        expectativas: anamnese.expectativas ?? "",
        profissional_id: anamnese.profissional_id ?? "",
        observacoes: anamnese.observacoes ?? "",
        procedimentos_alinhados: alinhados,
        valor_orcado: anamnese.valor_orcado != null ? String(anamnese.valor_orcado) : "",
        valor_entrada: anamnese.valor_entrada != null ? String(anamnese.valor_entrada) : "",
        previsao_inicio: anamnese.previsao_inicio ?? "",
        observacoes_orcamento: anamnese.observacoes_orcamento ?? "",
      });
    }
  }, [anamnese]);

  const setAnamneseField = (campo: keyof typeof anamneseForm, valor: string | boolean) => {
    setAnamneseForm((f) => ({ ...f, [campo]: valor }));
  };

  const addAlinhado = () =>
    setAnamneseForm((f) => ({
      ...f,
      procedimentos_alinhados: [...f.procedimentos_alinhados, { procedimento: "", valor: null }],
    }));
  const setAlinhado = (i: number, campo: "procedimento" | "valor" | "obs", valor: string | number | null) =>
    setAnamneseForm((f) => ({
      ...f,
      procedimentos_alinhados: f.procedimentos_alinhados.map((p, idx) =>
        idx === i ? { ...p, [campo]: campo === "valor" ? (typeof valor === "string" ? parseFloat(valor) || null : valor) : valor } : p
      ),
    }));
  const removeAlinhado = (i: number) =>
    setAnamneseForm((f) => ({
      ...f,
      procedimentos_alinhados: f.procedimentos_alinhados.filter((_, idx) => idx !== i),
    }));

  const saveAnamnese = useMutation({
    mutationFn: () =>
      upsertAnamnese(pacienteId, {
        ...anamneseForm,
        valor_orcado: anamneseForm.valor_orcado !== "" ? parseFloat(anamneseForm.valor_orcado as string) || 0 : null,
        valor_entrada: anamneseForm.valor_entrada !== "" ? parseFloat(anamneseForm.valor_entrada as string) || 0 : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anamnese", pacienteId] });
      toast.success("Anamnese / Ficha de avaliação salva!");
    },
    onError: (e) => toast.error(`Erro ao salvar anamnese: ${e.message}`),
  });

  // --- PRONTUÁRIO ---
  const { data: prontuarioList, isLoading: loadingProntuario } = useQuery({
    queryKey: ["prontuario", pacienteId],
    queryFn: () => listProntuario(pacienteId),
  });

  const { data: profissionais } = useQuery({
    queryKey: ["profissionais"],
    queryFn: listProfissionais,
  });

  const [openNewRegistro, setOpenNewRegistro] = useState(false);
  const [registroForm, setRegistroForm] = useState({
    tipo: "evolucao" as ProntuarioRegistro["tipo"],
    titulo: "",
    descricao: "",
    data_registro: new Date().toISOString().split("T")[0],
    procedimento_realizado: "",
    medicacao: "",
    receita: "",
    periodo_inicio: "",
    periodo_fim: "",
    retorno_em: "",
    profissional_id: "",
  });

  const setRegistroField = (campo: keyof typeof registroForm, valor: string) => {
    setRegistroForm((f) => ({ ...f, [campo]: valor }));
  };

  const createRegistro = useMutation({
    mutationFn: () =>
      createProntuarioRegistro({
        paciente_id: pacienteId,
        agendamento_id: null,
        tipo: registroForm.tipo,
        titulo: registroForm.titulo || null,
        descricao: registroForm.descricao || null,
        data_registro: registroForm.data_registro || null,
        procedimento_realizado: registroForm.procedimento_realizado || null,
        medicacao: registroForm.medicacao || null,
        receita: registroForm.receita || null,
        periodo_inicio: registroForm.periodo_inicio || null,
        periodo_fim: registroForm.periodo_fim || null,
        retorno_em: registroForm.retorno_em || null,
        profissional_id: registroForm.profissional_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario", pacienteId] });
      toast.success("Registro adicionado ao prontuário!");
      setOpenNewRegistro(false);
      setRegistroForm({
        tipo: "evolucao",
        titulo: "",
        descricao: "",
        data_registro: new Date().toISOString().split("T")[0],
        procedimento_realizado: "",
        medicacao: "",
        receita: "",
        periodo_inicio: "",
        periodo_fim: "",
        retorno_em: "",
        profissional_id: "",
      });
    },
    onError: (e) => toast.error(`Erro ao adicionar registro: ${e.message}`),
  });

  const deleteRegistro = useMutation({
    mutationFn: (id: string) => deleteProntuarioRegistro(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario", pacienteId] });
      toast.success("Registro removido do prontuário.");
    },
    onError: (e) => toast.error(`Erro ao remover: ${e.message}`),
  });

  if (loadingAnamnese || loadingProntuario) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: ANAMNESE E AVALIAÇÃO FACIAL */}
      <Card className="border-border/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Anamnese & Avaliação Facial
              </h2>
              <p className="text-xs text-muted-foreground">
                Histórico de saúde, contraindicações e avaliação estética
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => saveAnamnese.mutate()}
            disabled={saveAnamnese.isPending}
            className="gradient-primary font-semibold shadow-glow"
          >
            {saveAnamnese.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Salvar Anamnese
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Histórico médico */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Stethoscope className="h-4 w-4" /> Histórico de Saúde
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Alergias</Label>
                <Input
                  value={anamneseForm.alergias}
                  onChange={(e) => setAnamneseField("alergias", e.target.value)}
                  placeholder="Ex: Ácido hialurônico, lidocaína, latex..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Medicamentos em Uso</Label>
                <Input
                  value={anamneseForm.medicamentos}
                  onChange={(e) => setAnamneseField("medicamentos", e.target.value)}
                  placeholder="Ex: Anticoagulantes, Roacutan..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Doenças Crônicas</Label>
                <Input
                  value={anamneseForm.doencas_cronicas}
                  onChange={(e) => setAnamneseField("doencas_cronicas", e.target.value)}
                  placeholder="Ex: Hipertensão, Diabetes, Autoimune..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cirurgias Prévias</Label>
                <Input
                  value={anamneseForm.cirurgias_previas}
                  onChange={(e) => setAnamneseField("cirurgias_previas", e.target.value)}
                  placeholder="Ex: Rinoplastia, Facelift..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                <span className="text-xs font-medium">Gravidez</span>
                <Switch
                  checked={anamneseForm.gravidez}
                  onCheckedChange={(v) => setAnamneseField("gravidez", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                <span className="text-xs font-medium">Amamentando</span>
                <Switch
                  checked={anamneseForm.amamentando}
                  onCheckedChange={(v) => setAnamneseField("amamentando", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                <span className="text-xs font-medium">Fumante</span>
                <Switch
                  checked={anamneseForm.fuma}
                  onCheckedChange={(v) => setAnamneseField("fuma", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                <span className="text-xs font-medium">Consome Álcool</span>
                <Switch
                  checked={anamneseForm.consome_alcool}
                  onCheckedChange={(v) => setAnamneseField("consome_alcool", v)}
                />
              </div>
            </div>
          </div>

          {/* Avaliação Estética */}
          <div className="border-t border-border/40 pt-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Avaliação Estética & Objetivos
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo de Pele</Label>
                <Select
                  value={anamneseForm.tipo_pele}
                  onValueChange={(v) => setAnamneseField("tipo_pele", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PELE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Exposição ao Sol</Label>
                <Input
                  value={anamneseForm.exposicao_sol}
                  onChange={(e) => setAnamneseField("exposicao_sol", e.target.value)}
                  placeholder="Ex: Frequente com protetor, Rara..."
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Queixa Principal</Label>
                <Textarea
                  value={anamneseForm.queixa_principal}
                  onChange={(e) => setAnamneseField("queixa_principal", e.target.value)}
                  placeholder="O que o cliente mais deseja melhorar..."
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Procedimentos Anteriores</Label>
                <Textarea
                  value={anamneseForm.procedimentos_anteriores}
                  onChange={(e) => setAnamneseField("procedimentos_anteriores", e.target.value)}
                  placeholder="Botox prévio, preenchimentos já realizados..."
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Expectativas do Paciente</Label>
                <Textarea
                  value={anamneseForm.expectativas}
                  onChange={(e) => setAnamneseField("expectativas", e.target.value)}
                  placeholder="Resultados esperados pelo paciente..."
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          </div>

          {/* ORÇAMENTO DA AVALIAÇÃO — procedimentos alinhados no dia */}
          <div className="border-t border-border/40 pt-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Procedimentos Alinhados no Orçamento (dia da avaliação)
            </div>

            <div className="mt-3 space-y-2">
              {anamneseForm.procedimentos_alinhados.map((p, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Procedimento</Label>
                    <Input
                      value={p.procedimento}
                      onChange={(e) => setAlinhado(i, "procedimento", e.target.value)}
                      placeholder="Ex: Coroa 11, Canal 26, Limpeza..."
                      className="mt-0.5"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                    <Input
                      type="number"
                      value={p.valor ?? ""}
                      onChange={(e) => setAlinhado(i, "valor", e.target.value)}
                      placeholder="0,00"
                      className="mt-0.5"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive"
                    onClick={() => removeAlinhado(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addAlinhado}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Adicionar procedimento
            </Button>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground">Valor total orçado (R$)</Label>
                <Input
                  type="number"
                  value={anamneseForm.valor_orcado as string}
                  onChange={(e) => setAnamneseField("valor_orcado", e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Entrada combinada (R$)</Label>
                <Input
                  type="number"
                  value={anamneseForm.valor_entrada as string}
                  onChange={(e) => setAnamneseField("valor_entrada", e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Previsão de início</Label>
                <Input
                  type="date"
                  value={anamneseForm.previsao_inicio as string}
                  onChange={(e) => setAnamneseField("previsao_inicio", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">Observações do orçamento</Label>
              <Textarea
                value={anamneseForm.observacoes_orcamento as string}
                onChange={(e) => setAnamneseField("observacoes_orcamento", e.target.value)}
                placeholder="Condições combinadas, parcelas, descontos, garantias..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SEÇÃO: MODELO DE DENTES (ODONTOGRAMA) */}
      <Card className="border-border/60 p-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Modelo de Dentes / Odontograma</h2>
            <p className="text-xs text-muted-foreground">
              Marque no modelo o que foi anotado durante a avaliação (coroa, canal, extração, restauração, etc.)
            </p>
          </div>
        </div>
        <div className="mt-5">
          <OdontogramaGrid pacienteId={pacienteId} />
        </div>
      </Card>

      {/* SEÇÃO 2: PRONTUÁRIO & EVOLUÇÕES CLÍNICAS */}
      <Card className="border-border/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Prontuário & Evoluções Clínicas
              </h2>
              <p className="text-xs text-muted-foreground">
                Linha do tempo de atendimentos, notas de aplicação, prescrições e retornos
              </p>
            </div>
          </div>

          <Dialog open={openNewRegistro} onOpenChange={setOpenNewRegistro}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary font-semibold shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Adicionar Registro ao Prontuário
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Tipo de Registro</Label>
                    <Select
                      value={registroForm.tipo}
                      onValueChange={(v) =>
                        setRegistroField("tipo", v as ProntuarioRegistro["tipo"])
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evolucao">Evolução</SelectItem>
                        <SelectItem value="procedimento">Procedimento Realizado</SelectItem>
                        <SelectItem value="avaliacao">Avaliação</SelectItem>
                        <SelectItem value="medicacao font-medium">Medicação / Receita</SelectItem>
                        <SelectItem value="retorno">Retorno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Data do Atendimento</Label>
                    <Input
                      type="date"
                      value={registroForm.data_registro}
                      onChange={(e) => setRegistroField("data_registro", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Título / Resumo</Label>
                  <Input
                    value={registroForm.titulo}
                    onChange={(e) => setRegistroField("titulo", e.target.value)}
                    placeholder="Ex: Aplicação Botox terço superior, Retorno 15 dias..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Profissional Responsável</Label>
                  <Select
                    value={registroForm.profissional_id}
                    onValueChange={(v) => setRegistroField("profissional_id", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o profissional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(profissionais ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Detalhamento / Anotações Clínicas</Label>
                  <Textarea
                    value={registroForm.descricao}
                    onChange={(e) => setRegistroField("descricao", e.target.value)}
                    placeholder="Descreva unidades aplicadas, técnica utilizada, observações..."
                    className="mt-1 min-h-[90px]"
                  />
                </div>

                {registroForm.tipo === "procedimento" && (
                  <div>
                    <Label className="text-xs font-medium">Procedimento / Produtos Aplicados</Label>
                    <Input
                      value={registroForm.procedimento_realizado}
                      onChange={(e) =>
                        setRegistroField("procedimento_realizado", e.target.value)
                      }
                      placeholder="Ex: 50U Botox Allergan, 1ml Juvederm Voluma"
                      className="mt-1"
                    />
                  </div>
                )}

                {registroForm.tipo === "medicacao" && (
                  <div className="space-y-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <div>
                      <Label className="text-xs font-medium">Medicação Prescrita</Label>
                      <Input
                        value={registroForm.medicacao}
                        onChange={(e) => setRegistroField("medicacao", e.target.value)}
                        placeholder="Ex: Dexametasona 4mg, Dipirona 500mg"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Instruções / Receita Completa</Label>
                      <Textarea
                        value={registroForm.receita}
                        onChange={(e) => setRegistroField("receita", e.target.value)}
                        placeholder="Posologia e orientações pós-procedimento..."
                        className="mt-1 min-h-[60px]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium">Previsão de Retorno</Label>
                  <Input
                    type="date"
                    value={registroForm.retorno_em}
                    onChange={(e) => setRegistroField("retorno_em", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => createRegistro.mutate()}
                  disabled={createRegistro.isPending || !registroForm.titulo}
                  className="w-full gradient-primary font-semibold"
                >
                  {createRegistro.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar no Prontuário"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista da linha do tempo do Prontuário */}
        <div className="mt-6 space-y-4">
          {(prontuarioList ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro no prontuário ainda. Clique em "Novo Registro" para adicionar a primeira evolução clínica.
            </p>
          ) : (
            (prontuarioList ?? []).map((reg) => {
              const badge = tipoBadge[reg.tipo] ?? {
                label: reg.tipo,
                color: "bg-muted text-muted-foreground border-border",
              };
              const profNome = (reg as any).profissional?.nome;

              return (
                <div
                  key={reg.id}
                  className="group relative rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <h3 className="font-display font-semibold text-foreground">
                        {reg.titulo || "Registro de Prontuário"}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {reg.data_registro ? formatData(reg.data_registro) : formatData(reg.created_at)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() => {
                          if (confirm("Deseja realmente remover este registro do prontuário?")) {
                            deleteRegistro.mutate(reg.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {profNome && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Profissional: <span className="font-medium text-foreground">{profNome}</span>
                    </p>
                  )}

                  {reg.descricao && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90 bg-muted/20 rounded-lg p-3 border border-border/30">
                      {reg.descricao}
                    </p>
                  )}

                  {reg.procedimento_realizado && (
                    <div className="mt-2 text-xs">
                      <span className="font-semibold text-primary">Procedimento/Produtos:</span>{" "}
                      <span className="text-foreground">{reg.procedimento_realizado}</span>
                    </div>
                  )}

                  {reg.medicacao && (
                    <div className="mt-2 rounded bg-pink-500/5 p-2.5 border border-pink-500/20 text-xs">
                      <p className="font-semibold text-pink-500">Medicação Prescrita:</p>
                      <p className="text-foreground">{reg.medicacao}</p>
                      {reg.receita && <p className="mt-1 text-muted-foreground italic">{reg.receita}</p>}
                    </div>
                  )}

                  {reg.retorno_em && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Retorno previsto para: {formatData(reg.retorno_em)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
