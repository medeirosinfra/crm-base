import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { PenLine, RotateCcw, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assinatura/$planoId")({
  head: () => ({ meta: [{ title: "Assinatura — Negociação" }] }),
  component: AssinaturaPage,
});

interface PlanoAssinatura {
  id: string;
  descricao: string | null;
  valor_total: number;
  entrada: number;
  num_parcelas: number;
  paciente_nome: string | null;
  procedimento_nome: string | null;
  status: string;
  assinado: boolean;
  assinatura_nome: string | null;
  assinatura_em: string | null;
  parcelas: { numero: number; vencimento: string; valor: number; pago: number; status: string }[];
}

function AssinaturaPage() {
  const { planoId } = Route.useParams();
  const [plano, setPlano] = useState<PlanoAssinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [desenhando, setDesenhando] = useState(false);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasTintaRef = useRef(false);

  useEffect(() => {
    fetch(`/api/assinatura/${planoId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPlano(d))
      .catch(() => toast.error("Plano não encontrado"))
      .finally(() => setLoading(false));
  }, [planoId]);

  // Ajusta o canvas em telas de celular (retina + largura)
  useEffect(() => {
    if (!loading && plano && !plano.assinado) {
      const cv = canvasRef.current;
      if (!cv) return;
      const resize = () => {
        const largura = Math.min(cv.parentElement?.clientWidth ?? 320, 560);
        const altura = Math.max(160, Math.round(largura * 0.4));
        const dpr = window.devicePixelRatio || 1;
        cv.width = largura * dpr;
        cv.height = altura * dpr;
        cv.style.width = `${largura}px`;
        cv.style.height = `${altura}px`;
        const ctx = cv.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#1e293b";
        }
      };
      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
  }, [loading, plano]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return { x: (e.clientX - rect.left) * dpr / dpr, y: (e.clientY - rect.top) * dpr / dpr };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    hasTintaRef.current = true;
    setDesenhando(true);
    cv.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => setDesenhando(false);

  const limpar = () => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    hasTintaRef.current = false;
  };

  const salvar = async () => {
    if (!hasTintaRef.current) {
      toast.error("Desenhe sua assinatura na área acima");
      return;
    }
    if (!nome.trim()) {
      toast.error("Digite seu nome completo");
      return;
    }
    setSalvando(true);
    try {
      const cv = canvasRef.current;
      const imagem = cv?.toDataURL("image/png");
      const res = await fetch(`/api/assinatura/${planoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem, nome }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.erro ?? "Erro ao salvar");
      toast.success("Assinatura registrada com sucesso!");
      setPlano((p) => (p ? { ...p, assinado: true, assinatura_nome: nome, assinatura_em: new Date().toISOString() } : p));
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    } finally {
      setSalvando(false);
    }
  };

  const fmtBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtData = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/40 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-2 text-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Assinatura digital da negociação</span>
        </div>

        {loading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !plano ? (
          <p className="py-24 text-center text-muted-foreground">Plano não encontrado ou link inválido.</p>
        ) : plano.assinado ? (
          <div className="mt-8 rounded-2xl border border-success/30 bg-card/80 p-8 text-center shadow-card">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
              <Check className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Assinatura registrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {plano.assinatura_nome} assinou esta negociação em{" "}
              {plano.assinatura_em ? new Date(plano.assinatura_em).toLocaleString("pt-BR") : ""}.
            </p>
            <p className="mt-4 text-sm text-foreground">Obrigado pela confiança! 💜</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-card">
            {/* Resumo */}
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-foreground">
                {plano.paciente_nome ?? "Paciente"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {plano.procedimento_nome ?? plano.descricao ?? "Negociação"}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-foreground">{fmtBRL(Number(plano.valor_total))}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Entrada</p>
                <p className="text-sm font-bold text-foreground">{fmtBRL(Number(plano.entrada ?? 0))}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Parcelas</p>
                <p className="text-sm font-bold text-foreground">{plano.num_parcelas}x</p>
              </div>
            </div>

            {plano.parcelas.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Parcelas</p>
                <div className="grid grid-cols-2 gap-1">
                  {plano.parcelas.map((p) => (
                    <div key={p.numero} className="rounded bg-card px-2 py-1 text-[11px] text-muted-foreground">
                      <b className="text-foreground">{p.numero}ª</b> {fmtData(p.vencimento)} · {fmtBRL(Number(p.valor))}
                      {Number(p.pago) > 0 && <span className="ml-1 text-success">paga</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-foreground">Assine abaixo</p>
              <p className="text-[11px] text-muted-foreground">
                Desenhe sua assinatura (ou use o dedo no celular) e confirme seu nome.
              </p>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-border/50 bg-white">
                <span className="pl-3 text-muted-foreground/50">
                  <PenLine className="h-4 w-4" />
                </span>
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                  className="touch-none"
                />
              </div>
              <button
                onClick={limpar}
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Limpar assinatura
              </button>

              <div className="mt-3">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Nome completo *
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome como assina"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={salvar}
                disabled={salvando}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirmar assinatura
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
                Ao assinar, você concorda com as condições da negociação descritas acima.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
