import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Loader2, Save, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { getWhatsappConfig, salvarWhatsappClinica } from "@/lib/supabase/whatsapp-config";
import { toast } from "sonner";

export const Route = createFileRoute("/whatsapp")({
  head: () => ({
    meta: [{ title: "WhatsApp da Clínica — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <WhatsappPage />
    </RequireClinic>
  ),
});

function WhatsappPage() {
  const { tenantId } = useAuth();
  const [numero, setNumero] = useState("");
  const [conectado, setConectado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    getWhatsappConfig(tenantId)
      .then((cfg) => {
        if (cfg) {
          setNumero(cfg.numero ?? "");
          setConectado(cfg.conectado);
        }
      })
      .catch((e) => toast.error(String(e)))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const salvarMutation = useMutation({
    mutationFn: () => salvarWhatsappClinica(tenantId!, numero),
    onSuccess: () => {
      toast.success("Número do WhatsApp salvo!");
      setConectado(true);
    },
    onError: (e) => toast.error(String(e)),
  });

  const formatarNumero = (v: string) => {
    // Formata como (00) 00000-0000
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Configuração</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
            WhatsApp da Clínica
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre o número de WhatsApp da sua clínica. Esse número será usado para disparos,
            bots de atendimento e lembretes de vencimento.
          </p>
        </header>

        {loading ? (
          <div className="mt-10 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Status atual */}
            <Card className="border-border/60 p-6">
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${conectado ? "bg-success/15 text-success" : "bg-muted/40 text-muted-foreground"}`}>
                  {conectado ? <CheckCircle2 className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">
                    {conectado ? "Número conectado" : "Nenhum número conectado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conectado
                      ? `O número ${numero} está configurado para disparos da clínica.`
                      : "Cadastre o número abaixo para ativar os disparos, bots e lembretes."}
                  </p>
                </div>
              </div>
            </Card>

            {/* Formulário */}
            <Card className="border-border/60 p-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">Cadastrar número</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Informe o WhatsApp da recepção/dona da clínica (com DDD). Não use o número do aparelho master.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Número do WhatsApp</Label>
                  <Input
                    value={numero}
                    onChange={(e) => setNumero(formatarNumero(e.target.value))}
                    placeholder="(11) 98888-7777"
                    className="mt-1.5 h-12 font-mono text-lg"
                    inputMode="numeric"
                  />
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Como funciona:</strong> ao salvar, o número fica registrado para
                      disparos, bots e lembretes de vencimento. A conexão em tempo real será ativada em breve.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => salvarMutation.mutate()}
                  disabled={salvarMutation.isPending || !numero || numero.replace(/\D/g, "").length < 10}
                  className="gradient-primary w-full font-semibold"
                  size="lg"
                >
                  {salvarMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar número
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ClinicLayout>
  );
}
