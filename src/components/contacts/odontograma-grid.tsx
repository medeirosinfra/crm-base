import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { listOdontograma, upsertOdontograma, deleteOdontograma } from "@/lib/supabase/prontuario";
import { toast } from "sonner";

const TRATAMENTOS = [
  "Coroa",
  "Canal",
  "Restauração",
  "Extração",
  "Implante",
  "Prótese",
  "Limpeza",
  "Clareamento",
  "Avaliação",
  "Preenchimento",
];

const CORES: Record<string, { label: string; bg: string; border: string }> = {
  amber: { label: "Pendente", bg: "bg-amber-100", border: "border-amber-400" },
  red: { label: "Urgente", bg: "bg-red-100", border: "border-red-400" },
  green: { label: "Feito", bg: "bg-green-100", border: "border-green-400" },
  blue: { label: "Planejado", bg: "bg-blue-100", border: "border-blue-400" },
  gray: { label: "Ideal", bg: "bg-slate-100", border: "border-slate-300" },
};

interface OdontogramaGridProps {
  pacienteId: string;
}

export function OdontogramaGrid({ pacienteId }: OdontogramaGridProps) {
  const queryClient = useQueryClient();

  const { data: marcacoes, isLoading } = useQuery({
    queryKey: ["odontograma", pacienteId],
    queryFn: () => listOdontograma(pacienteId),
  });

  const [denteSelecionado, setDenteSelecionado] = useState<number | null>(null);
  const [tratamento, setTratamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [cor, setCor] = useState("amber");

  const upsert = useMutation({
    mutationFn: () =>
      upsertOdontograma({
        paciente_id: pacienteId,
        dente: denteSelecionado!,
        tratamento: tratamento || null,
        observacao: observacao || null,
        cor,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["odontograma", pacienteId] });
      toast.success(`Dente ${denteSelecionado} salvo no modelo.`);
      setDenteSelecionado(null);
      setTratamento("");
      setObservacao("");
      setCor("amber");
    },
    onError: (e) => toast.error(`Erro ao salvar dente: ${e.message}`),
  });

  const remover = useMutation({
    mutationFn: (id: string) => deleteOdontograma(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["odontograma", pacienteId] });
      toast.success("Marcação removida do dente.");
      setDenteSelecionado(null);
    },
    onError: (e) => toast.error(`Erro ao remover: ${e.message}`),
  });

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerRight = [31, 32, 33, 34, 35, 36, 37, 38];

  const marcado = (d: number) => (marcacoes ?? []).find((m) => m.dente === d);

  const renderSparkles = (n: number) => {
    const m = marcado(n);
    const cfg = m ? CORES[m.cor ?? "amber"] ?? CORES.amber : undefined;
    const style = m
      ? `border-2 ${cfg!.bg} ${cfg!.border} shadow-sm`
      : "border border-border/70 hover:border-primary/50";

    return (
      <button
        key={n}
        type="button"
        onClick={() => {
          setDenteSelecionado(n);
          setTratamento(m?.tratamento ?? "");
          setObservacao(m?.observacao ?? "");
          setCor(m?.cor ?? "amber");
        }}
        title={m ? `Dente ${n}: ${m.tratamento ?? "Marcado"}` : `Dente ${n}`}
        className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-foreground transition-all hover:scale-105 ${style}`}
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-[8px] leading-none">{n}</span>
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-3">
        {/* Arcada superior — quadrante 1 (dir) e 2 (esq) */}
        <div className="flex items-start gap-1">
          <span className="mr-1 mt-2 text-[11px] font-semibold text-muted-foreground">S</span>
          <div className="flex gap-1">{upperRight.map((n) => renderSparkles(n))}</div>
          <span className="mx-1 mt-2 text-[11px] font-semibold text-muted-foreground">|</span>
          <div className="flex gap-1">{upperLeft.map((n) => renderSparkles(n))}</div>
          <span className="ml-1 mt-2 text-[11px] font-semibold text-muted-foreground">S</span>
        </div>
        {/* Arcada inferior — quadrante 3 (esq) e 4 (dir) */}
        <div className="flex items-start gap-1">
          <span className="mr-1 mt-2 text-[11px] font-semibold text-muted-foreground">I</span>
          <div className="flex gap-1">{lowerLeft.map((n) => renderSparkles(n))}</div>
          <span className="mx-1 mt-2 text-[11px] font-semibold text-muted-foreground">|</span>
          <div className="flex gap-1">{lowerRight.map((n) => renderSparkles(n))}</div>
          <span className="ml-1 mt-2 text-[11px] font-semibold text-muted-foreground">I</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        {Object.entries(CORES).map(([key, c]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm border ${c.bg} ${c.border}`} /> {c.label}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">Clique num dente para marcar.</span>
      </div>

      {isLoading && (
        <div className="mt-5 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Carregando modelo de dentes...
        </div>
      )}

      {/* Dialog de detalhe do dente */}
      <Dialog
        open={denteSelecionado != null}
        onOpenChange={(open) => {
          if (!open) setDenteSelecionado(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Dente {denteSelecionado}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Tratamento / Procedimento</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TRATAMENTOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTratamento(t)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      tratamento === t
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Observação (opcional)</Label>
              <Input
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: fratura de cúspide, dor ao toque..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {Object.entries(CORES).map(([key, c]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCor(key)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      cor === key ? `${c.bg} ${c.border} border-2` : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full border ${c.bg} ${c.border}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {marcado(denteSelecionado ?? 0) && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  const m = marcado(denteSelecionado!);
                  if (m) remover.mutate(m.id);
                }}
                disabled={remover.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Limpar
              </Button>
            )}
            <Button
              onClick={() => upsert.mutate()}
              disabled={upsert.isPending || !denteSelecionado}
              className="gradient-primary font-semibold"
            >
              {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar dente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}