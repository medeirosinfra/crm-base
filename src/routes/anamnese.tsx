import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Loader2, Save, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
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
import { listPacientes } from "@/lib/supabase/tenants";
import { listProfissionais } from "@/lib/supabase/agendamentos";
import { getAnamnese, upsertAnamnese } from "@/lib/supabase/prontuario";
import { toast } from "sonner";

export const Route = createFileRoute("/anamnese")({
  head: () => ({
    meta: [{ title: "Anamnese — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <AnamnesePage />
    </RequireClinic>
  ),
});

const TIPOS_PELE = ["Oleosa", "Seca", "Mista", "Normal", "Sensível"];

function AnamnesePage() {
  const queryClient = useQueryClient();
  const [pacienteId, setPacienteId] = useState("");
  const [form, setForm] = useState({
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
  });

  const { data: pacientes } = useQuery({ queryKey: ["pacientes"], queryFn: listPacientes });
  const { data: profissionais } = useQuery({
    queryKey: ["profissionais"],
    queryFn: listProfissionais,
  });
  const { data: anamneseExistente } = useQuery({
    queryKey: ["anamnese", pacienteId],
    queryFn: () => getAnamnese(pacienteId),
    enabled: !!pacienteId,
  });

  const set = (campo: keyof typeof form, valor: string | boolean) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const saveMutation = useMutation({
    mutationFn: () => upsertAnamnese(pacienteId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anamnese"] });
      toast.success("Anamnese salva com sucesso!");
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) {
      toast.error("Selecione o paciente");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Avaliação Facial
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Anamnese & Avaliação
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Ficha de avaliação facial para procedimentos de harmonização, botox e preenchimento.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          <Card className="border-border/60 p-6">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Paciente *
            </Label>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue placeholder="Selecione o paciente..." />
              </SelectTrigger>
              <SelectContent>
                {(pacientes ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {pacienteId && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Histórico de saúde */}
              <Card className="border-border/60 p-6">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Histórico de saúde</h2>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Alergias</Label>
                    <Input value={form.alergias} onChange={(e) => set("alergias", e.target.value)} className="mt-1.5 h-11" placeholder="Ex: ácido hialurônico, lidocaína..." />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Medicamentos em uso</Label>
                    <Input value={form.medicamentos} onChange={(e) => set("medicamentos", e.target.value)} className="mt-1.5 h-11" placeholder="Ex: anticoagulantes..." />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Doenças crônicas</Label>
                    <Input value={form.doencas_cronicas} onChange={(e) => set("doencas_cronicas", e.target.value)} className="mt-1.5 h-11" placeholder="Ex: hipertensão, diabetes..." />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cirurgias prévias</Label>
                    <Input value={form.cirurgias_previas} onChange={(e) => set("cirurgias_previas", e.target.value)} className="mt-1.5 h-11" />
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Gravidez</p>
                      <p className="text-[11px] text-muted-foreground">Contraindicado alguns procedimentos</p>
                    </div>
                    <Switch checked={form.gravidez} onCheckedChange={(v) => set("gravidez", v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Amamentando</p>
                      <p className="text-[11px] text-muted-foreground">Avaliar contraindicações</p>
                    </div>
                    <Switch checked={form.amamentando} onCheckedChange={(v) => set("amamentando", v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Fumante</p>
                      <p className="text-[11px] text-muted-foreground">Afeta resultado dos procedimentos</p>
                    </div>
                    <Switch checked={form.fuma} onCheckedChange={(v) => set("fuma", v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Consome álcool</p>
                      <p className="text-[11px] text-muted-foreground">Evitar antes/após procedimentos</p>
                    </div>
                    <Switch checked={form.consome_alcool} onCheckedChange={(v) => set("consome_alcool", v)} />
                  </div>
                </div>
              </Card>

              {/* Avaliação facial */}
              <Card className="border-border/60 p-6">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Avaliação facial</h2>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo de pele</Label>
                    <Select value={form.tipo_pele} onValueChange={(v) => set("tipo_pele", v)}>
                      <SelectTrigger className="mt-1.5 h-11">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_PELE.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Exposição ao sol</Label>
                    <Input value={form.exposicao_sol} onChange={(e) => set("exposicao_sol", e.target.value)} className="mt-1.5 h-11" placeholder="Frequente, ocasional, rara..." />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Queixa principal</Label>
                    <Textarea value={form.queixa_principal} onChange={(e) => set("queixa_principal", e.target.value)} className="mt-1.5 text-sm" placeholder="O que o paciente deseja tratar?" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Procedimentos anteriores</Label>
                    <Textarea value={form.procedimentos_anteriores} onChange={(e) => set("procedimentos_anteriores", e.target.value)} className="mt-1.5 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Expectativas do paciente</Label>
                    <Textarea value={form.expectativas} onChange={(e) => set("expectativas", e.target.value)} className="mt-1.5 text-sm" />
                  </div>
                </div>
              </Card>

              {/* Responsável */}
              <Card className="border-border/60 p-6">
                <h2 className="font-display text-lg font-bold text-foreground">Avaliador</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profissional responsável</Label>
                    <Select value={form.profissional_id} onValueChange={(v) => set("profissional_id", v)}>
                      <SelectTrigger className="mt-1.5 h-11">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(profissionais ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Observações</Label>
                    <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} className="mt-1.5 text-sm" />
                  </div>
                </div>
              </Card>

              <Button type="submit" disabled={saveMutation.isPending} className="gradient-primary w-full shadow-glow font-semibold">
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Anamnese
              </Button>
            </form>
          )}
        </div>
      </div>
    </ClinicLayout>
  );
}
