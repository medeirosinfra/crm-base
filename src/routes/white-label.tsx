import { createFileRoute } from "@tanstack/react-router";
import { Palette, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listTenants, updateTenant, type Tenant } from "@/lib/supabase/tenants";
import { toast } from "sonner";

export const Route = createFileRoute("/white-label")({
  head: () => ({
    meta: [{ title: "White-Label — MedeirosInfra" }],
  }),
  component: () => (
    <RequireAuth>
      <WhiteLabelPage />
    </RequireAuth>
  ),
});

function WhiteLabelPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
  });

  const selected: Tenant | undefined = tenants?.find((t) => t.id === selectedId);

  const saveMutation = useMutation({
    mutationFn: (input: Partial<Tenant>) => updateTenant(selectedId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Branding atualizado com sucesso!");
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Configuração White-Label
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Envelopamento White-Label
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Logo, cores, domínio próprio e API Key por tenant para revenda em escala. Cada clínica
            vê o painel com a identidade visual dela.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* Seletor de clínica */}
          <Card className="border-border/60 p-5 lg:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Selecione a clínica
            </Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Escolha uma clínica..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading && <div className="p-2 text-sm text-muted-foreground">Carregando...</div>}
                {(tenants ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({t.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selected && (
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Cor primária
                  </Label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={selected.cor_primaria}
                      onChange={(e) => {
                        queryClient.setQueryData(["tenants"], (old?: Tenant[]) =>
                          old?.map((t) =>
                            t.id === selected.id ? { ...t, cor_primaria: e.target.value } : t,
                          ),
                        );
                      }}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-border/60 bg-transparent"
                    />
                    <Input
                      value={selected.cor_primaria}
                      onChange={(e) => {
                        queryClient.setQueryData(["tenants"], (old?: Tenant[]) =>
                          old?.map((t) =>
                            t.id === selected.id ? { ...t, cor_primaria: e.target.value } : t,
                          ),
                        );
                      }}
                      className="h-11 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Cor secundária
                  </Label>
                  <Input
                    value={selected.cor_segundaria ?? "#0f172a"}
                    onChange={(e) => {
                      queryClient.setQueryData(["tenants"], (old?: Tenant[]) =>
                        old?.map((t) =>
                          t.id === selected.id ? { ...t, cor_segundaria: e.target.value } : t,
                        ),
                      );
                    }}
                    className="mt-2 h-11 font-mono text-sm"
                    placeholder="#0f172a"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Domínio próprio
                  </Label>
                  <Input
                    value={selected.dominio ?? ""}
                    onChange={(e) => {
                      queryClient.setQueryData(["tenants"], (old?: Tenant[]) =>
                        old?.map((t) =>
                          t.id === selected.id ? { ...t, dominio: e.target.value } : t,
                        ),
                      );
                    }}
                    className="mt-2 h-11 text-sm"
                    placeholder="ex: crm.minhaclinica.com.br"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Segmento da clínica (define os módulos ativos)
                  </Label>
                  <Select
                    value={selected.especialidade ?? ""}
                    onValueChange={(v) => {
                      queryClient.setQueryData(["tenants"], (old?: Tenant[]) =>
                        old?.map((t) =>
                          t.id === selected.id ? { ...t, especialidade: v } : t,
                        ),
                      );
                    }}
                  >
                    <SelectTrigger className="mt-2 h-11">
                      <SelectValue placeholder="Escolha o segmento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Odontologia">🦷 Odontologia</SelectItem>
                      <SelectItem value="Estética Avançada">✨ Estética Avançada</SelectItem>
                      <SelectItem value="Dermatologia">🧴 Dermatologia</SelectItem>
                      <SelectItem value="Fisioterapia">💪 Fisioterapia</SelectItem>
                      <SelectItem value="Psicologia">🧠 Psicologia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    O segmento define quais módulos e funcionalidades a clínica vê no painel.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Sessão WAHA (WhatsApp)
                  </Label>
                  <Input
                    value={selected.waha_sessao ?? ""}
                    onChange={(e) => {
                      queryClient.setQueryData(["tenants"], (old?: Tenant[]) =>
                        old?.map((t) =>
                          t.id === selected.id ? { ...t, waha_sessao: e.target.value } : t,
                        ),
                      );
                    }}
                    className="mt-2 h-11 text-sm"
                    placeholder="ex: crmprincipal"
                  />
                </div>

                <Button
                  onClick={() =>
                    saveMutation.mutate({
                      cor_primaria: selected.cor_primaria,
                      cor_segundaria: selected.cor_segundaria,
                      dominio: selected.dominio,
                      waha_sessao: selected.waha_sessao,
                      especialidade: selected.especialidade,
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="gradient-primary w-full shadow-glow font-semibold"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Branding
                </Button>
              </div>
            )}
          </Card>

          {/* Preview ao vivo */}
          <div className="lg:col-span-3">
            <Card className="gradient-surface shadow-card h-full border-border/60 p-6">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Preview ao vivo
                </p>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>

              {selected ? (
                <div className="mt-6">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-glow"
                    style={{ background: selected.cor_primaria }}
                  >
                    {selected.nome.charAt(0)}
                  </div>
                  <h2 className="mt-4 text-center font-display text-xl font-bold text-foreground">
                    {selected.nome}
                  </h2>
                  <p className="text-center text-xs text-muted-foreground">
                    painel.white-label — {selected.slug}
                  </p>

                  <div className="mx-auto mt-6 max-w-xs space-y-2">
                    <div
                      className="h-11 rounded-lg text-center leading-[2.75rem] text-sm font-semibold text-white"
                      style={{ background: selected.cor_primaria }}
                    >
                      Botão primário
                    </div>
                    <div className="h-11 rounded-lg border border-border/60 bg-card text-center leading-[2.75rem] text-sm text-muted-foreground">
                      Botão secundário
                    </div>
                    <div className="h-11 rounded-lg border border-primary/30 bg-primary/10 text-center leading-[2.75rem] text-sm text-primary">
                      {selected.especialidade ?? "Clínica"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[300px] place-items-center text-center">
                  <div className="max-w-xs">
                    <Palette className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Selecione uma clínica para configurar e visualizar o branding white-label.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
