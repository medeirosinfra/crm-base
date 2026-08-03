import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Loader2, Save, Smartphone, CheckCircle2, AlertCircle, QrCode, RefreshCw, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
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
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  const [conectando, setConectando] = useState(false);
  const [statusSessao, setStatusSessao] = useState("");

  // Carrega config + slug do tenant
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const [cfg, tenant] = await Promise.all([
          getWhatsappConfig(tenantId),
          supabase.from("tenants").select("slug").eq("id", tenantId).single(),
        ]);
        if (cfg) { setNumero(cfg.numero ?? ""); setConectado(cfg.conectado); }
        setSlug(tenant.data?.slug ?? "");
        if (cfg?.conectado && tenant.data?.slug) {
          checarStatus(tenant.data.slug, tenantId);
        }
      } catch (e) {
        toast.error(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId]);

  async function checarStatus(s = slug, t = tenantId) {
    try {
      const res = await fetch(`/api/whatsapp/status?slug=${s}&tenantId=${t}`);
      const d = await res.json();
      setStatusSessao(d.status ?? "");
      setConectado(d.ok === true || d.status === "WORKING");
    } catch { /* ignora */ }
  }

  const salvarMutation = {
    pending: false,
    mutate: async () => {
      try {
        await salvarWhatsappClinica(tenantId!, numero);
        toast.success("Número salvo! Agora conecte via QR abaixo.");
      } catch (e) {
        toast.error(String(e));
      }
    },
  };

  const formatarNumero = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const conectar = async () => {
    if (!tenantId || !slug) return;
    setConectando(true);
    setQr(null);
    try {
      const res = await fetch("/api/whatsapp/conectar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, tenantId }),
      });
      const d = await res.json();
      if (d.ok && d.qr) {
        setQr(d.qr);
        setStatusSessao(d.status);
        // Poll até conectar
        const poll = setInterval(async () => {
          await checarStatus(slug, tenantId!);
          const r = await fetch(`/api/whatsapp/status?slug=${slug}&tenantId=${tenantId}`);
          const s = await r.json();
          if (s.status === "WORKING" || s.ok) {
            setConectado(true);
            setQr(null);
            toast.success("WhatsApp conectado!");
            clearInterval(poll);
          }
        }, 3000);
      } else {
        toast.error(d.erro ?? "Não foi possível obter o QR");
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setConectando(false);
    }
  };

  const desconectar = async () => {
    if (!tenantId || !slug) return;
    await fetch("/api/whatsapp/desconectar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, tenantId }),
    });
    setConectado(false);
    setQr(null);
    setStatusSessao("");
    toast.success("WhatsApp desconectado");
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
            Cadastre o número e conecte via QR Code. Esse WhatsApp será usado para disparos, bots e
            lembretes de vencimento da sua clínica.
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
                    {conectado ? "WhatsApp conectado" : "WhatsApp desconectado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conectado
                      ? `O número ${numero || "conectado"} está ativo para disparos da clínica.`
                      : "Cadastre o número e escaneie o QR para ativar disparos, bots e lembretes."}
                  </p>
                </div>
                {conectado && (
                  <Button variant="outline" size="sm" className="ml-auto" onClick={desconectar}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" /> Desconectar
                  </Button>
                )}
              </div>
            </Card>

            {/* Número + conexão */}
            <Card className="border-border/60 p-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">Conexão por QR Code</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Informe o WhatsApp da recepção/dona (com DDD). Depois clique em "Conectar" e escaneie o QR com o celular.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Número do WhatsApp</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      value={numero}
                      onChange={(e) => setNumero(formatarNumero(e.target.value))}
                      placeholder="(11) 98888-7777"
                      className="h-12 font-mono text-lg"
                      inputMode="numeric"
                      disabled={conectado}
                    />
                    <Button variant="outline" className="h-12" onClick={() => salvarMutation.mutate()} disabled={!numero || numero.replace(/\D/g, "").length < 10}>
                      <Save className="mr-1.5 h-4 w-4" /> Salvar
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {qr && (
                  <div className="flex flex-col items-center rounded-xl border border-primary/20 bg-primary/5 p-6">
                    <QrCode className="h-6 w-6 text-primary" />
                    <p className="mt-2 text-sm font-semibold text-foreground">Escaneie com o WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Abra o WhatsApp → Aparelhos conectados → Conectar aparelho</p>
                    <img src={qr} alt="QR Code WhatsApp" className="mt-4 h-56 w-56 rounded-lg bg-white p-2" />
                    <p className="mt-2 text-xs text-muted-foreground">O QR expira em ~60 segundos. Aguardando conexão...</p>
                  </div>
                )}

                {/* Botão conectar */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={conectar}
                    disabled={conectando || conectado || !numero || numero.replace(/\D/g, "").length < 10}
                    className="gradient-primary flex-1 font-semibold"
                    size="lg"
                  >
                    {conectando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : conectado ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <QrCode className="mr-2 h-4 w-4" />}
                    {conectado ? "Conectado" : conectando ? "Conectando..." : "Conectar via QR"}
                  </Button>
                  {!conectado && statusSessao && (
                    <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => conectar()} title="Atualizar QR">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {statusSessao && !conectado && (
                  <p className="text-center text-xs text-muted-foreground">
                    Status: <span className="font-mono">{statusSessao}</span>
                  </p>
                )}

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Dica:</strong> use um aparelho que fique ligado na clínica.
                      Após conectar, disparos, bots e lembretes de vencimento usarão este número.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ClinicLayout>
  );
}
