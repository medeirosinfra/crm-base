import { createFileRoute } from "@tanstack/react-router";
import { Send, Loader2, Users, CheckCircle2, XCircle, MessageSquareMore } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase/client";
import { listarContatosParaDisparo, dispararMensagens } from "@/lib/supabase/disparos";
import { toast } from "sonner";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function listWahaSessions(): Promise<{ name: string; status: string }[]> {
  const headers = await authHeaders();
  const res = await fetch("/api/whatsapp/sessoes", { headers });
  if (!res.ok) return [];
  return res.json();
}

export const Route = createFileRoute("/master/disparos")({
  head: () => ({
    meta: [{ title: "Disparos em Massa — MedeirosInfra Master" }],
  }),
  component: DisparosMaster,
});

function DisparosMaster() {
  const [mensagem, setMensagem] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<{ enviados: number; falhas: number } | null>(null);

  const { data: contatos } = useQuery({ queryKey: ["disparo-contatos"], queryFn: listarContatosParaDisparo });
  const { data: sessions } = useQuery({ queryKey: ["waha-sessions"], queryFn: listWahaSessions });
  const activeSessions = (sessions ?? []).filter((s) => s.status === "WORKING");
  const session = activeSessions[0]?.name ?? "crmprincipal";

  const toggleContato = (telefone: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(telefone)) next.delete(telefone);
      else next.add(telefone);
      return next;
    });
  };

  const selecionarTodos = () => {
    const todos = (contatos ?? []).map((c) => c.telefone!).filter(Boolean);
    setSelecionados(new Set(todos));
  };

  const disparoMutation = useMutation({
    mutationFn: () => dispararMensagens(session, [...selecionados], mensagem),
    onSuccess: (res) => {
      setResultado({ enviados: res.enviados, falhas: res.falhas });
      toast.success(`${res.enviados} mensagens enviadas, ${res.falhas} falhas`);
    },
    onError: (e) => toast.error(String(e)),
  });

  const handleDisparar = () => {
    if (!mensagem.trim()) {
      toast.error("Digite a mensagem");
      return;
    }
    if (selecionados.size === 0) {
      toast.error("Selecione pelo menos 1 contato");
      return;
    }
    if (!confirm(`Enviar para ${selecionados.size} contatos?`)) return;
    disparoMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Ferramentas do Master</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Disparos em Massa</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Envie mensagens em massa para contatos de todas as clínicas via WhatsApp (WAHA).
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Seleção de contatos */}
        <Card className="border-border/60 p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">
                Contatos ({selecionados.size} selecionados)
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={selecionarTodos}>
              Selecionar todos
            </Button>
          </div>

          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-2">
            {(contatos ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum contato com telefone encontrado.
              </p>
            )}
            {(contatos ?? []).map((c) => (
              <label key={c.telefone} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <Checkbox
                  checked={selecionados.has(c.telefone!)}
                  onCheckedChange={() => toggleContato(c.telefone!)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{c.telefone} · {c.clinica}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Mensagem e envio */}
        <Card className="border-border/60 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <MessageSquareMore className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Mensagem</h2>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mensagem</Label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="mt-1.5 min-h-[160px] text-sm"
                placeholder="Olá! Aqui é da clínica. Temos uma promoção especial para você..."
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Sessão: <span className="font-semibold">{session}</span> · {activeSessions.length} ativa(s)
              </p>
            </div>

            <Button
              onClick={handleDisparar}
              disabled={disparoMutation.isPending}
              size="lg"
              className="gradient-primary w-full shadow-glow font-semibold"
            >
              {disparoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {disparoMutation.isPending ? "Enviando..." : `Enviar para ${selecionados.size} contatos`}
            </Button>

            {resultado && (
              <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> {resultado.enviados} enviados
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-destructive">
                    <XCircle className="h-4 w-4" /> {resultado.falhas} falhas
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
