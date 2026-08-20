import { createFileRoute } from "@tanstack/react-router";
import { Send, Loader2, Radio, MessageSquareMore, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClinicLayout } from "@/components/layouts/clinic-layout";
import { RequireClinic } from "@/components/require-clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function statusPropriaSessao(): Promise<{ ok: boolean; status: string; numero?: string }> {
  const headers = await authHeaders();
  const res = await fetch("/api/whatsapp/status", { headers });
  return res.json();
}

async function enviarMensagem(telefone: string, mensagem: string): Promise<{ id?: string }> {
  const headers = await authHeaders();
  const res = await fetch("/api/whatsapp/enviar", { method: "POST", headers, body: JSON.stringify({ telefone, mensagem }) });
  const d = await res.json();
  if (!res.ok) throw new Error(d.erro ?? "erro ao enviar");
  return d;
}

export const Route = createFileRoute("/disparador")({
  head: () => ({
    meta: [{ title: "Disparador Multicanal — MedeirosInfra" }],
  }),
  component: () => (
    <RequireClinic>
      <DisparadorPage />
    </RequireClinic>
  ),
});

function DisparadorPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: minhaSessao } = useQuery({
    queryKey: ["minha-sessao-waha"],
    queryFn: statusPropriaSessao,
    refetchInterval: 30_000,
  });

  const conectado = minhaSessao?.ok === true || minhaSessao?.status === "WORKING";

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Número inválido. Use o DDD + número, ex: 5511999999999");
      return;
    }
    if (!message.trim()) {
      toast.error("Digite a mensagem");
      return;
    }

    setSending(true);
    try {
      const result = await enviarMensagem(digits, message.trim());
      toast.success(`Mensagem enviada! (${result.id?.slice(0, 20) ?? ""}...)`);
      setMessage("");
      setPhone("");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <ClinicLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Automação WhatsApp
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Disparador Multicanal (WAHA)
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Envio de mensagens em tempo real via WAHA. Em breve: campanhas em massa segmentadas
              por tag, agendamento e integração com N8N.
            </p>
          </div>

          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${conectado ? "border-success/30 bg-success/10 text-success" : "border-border/60 bg-muted/40 text-muted-foreground"}`}>
            <Radio className="h-3.5 w-3.5" />
            {conectado ? "WhatsApp da clínica conectado" : "WhatsApp da clínica não conectado"}
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* Formulário de envio */}
          <Card className="border-border/60 p-6 lg:col-span-3">
            <div className="flex items-center gap-2">
              <MessageSquareMore className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Nova mensagem</h2>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Número (WhatsApp)
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 h-11 font-mono text-sm"
                  placeholder="5511999999999"
                  inputMode="numeric"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Mensagem
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 min-h-[140px] text-sm"
                  placeholder="Olá! Aqui é da clínica..."
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={sending}
                size="lg"
                className="gradient-primary w-full shadow-glow font-semibold"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {sending ? "Enviando..." : "Enviar mensagem"}
              </Button>
            </div>
          </Card>

          {/* Status da sessão da clínica */}
          <Card className="border-border/60 p-6 lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-foreground">WhatsApp da clínica</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Status da conexão configurada em "WhatsApp da Clínica".
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{minhaSessao?.numero ?? "Sua clínica"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {conectado
                      ? "Conectada e recebendo mensagens"
                      : minhaSessao?.status === "SCAN_QR_CODE"
                        ? "Aguardando QR code"
                        : minhaSessao?.status ?? "desconectado"}
                  </p>
                </div>
                {conectado ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            <p className="mt-6 rounded-lg border border-border/60 bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
              💡 Em breve: campanhas em massa (CSV ou segmentadas), agendamento de envio,
              templates e relatório de entregas.
            </p>
          </Card>
        </div>
      </div>
    </ClinicLayout>
  );
}
