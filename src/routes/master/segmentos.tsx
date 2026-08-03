import { createFileRoute } from "@tanstack/react-router";
import { Building2, Checkbox, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listSegmentos,
  listModulos,
  listModuloCodigosDoSegmento,
  createSegmento,
  setModulosDoSegmento,
  type Segmento,
} from "@/lib/supabase/segmentos";
import { toast } from "sonner";

export const Route = createFileRoute("/master/segmentos")({
  head: () => ({
    meta: [{ title: "Segmentos & Módulos — MedeirosInfra Master" }],
  }),
  component: SegmentosMaster,
});

function SegmentosMaster() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [segmentoAtivo, setSegmentoAtivo] = useState<Segmento | null>(null);
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);

  const { data: segmentos, isLoading } = useQuery({ queryKey: ["segmentos"], queryFn: listSegmentos });
  const { data: modulos } = useQuery({ queryKey: ["modulos"], queryFn: listModulos });

  const createMutation = useMutation({
    mutationFn: () => createSegmento({ codigo: novoCodigo, nome: novoNome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segmentos"] });
      toast.success("Segmento criado!");
      setOpen(false);
      setNovoCodigo("");
      setNovoNome("");
    },
    onError: (e) => toast.error(String(e)),
  });

  const salvarModulos = async (seg: Segmento) => {
    try {
      await setModulosDoSegmento(seg.codigo, modulosSelecionados);
      toast.success(`Módulos do segmento "${seg.nome}" atualizados!`);
    } catch (e) {
      toast.error(String(e));
    }
  };

  const abrirModulos = async (seg: Segmento) => {
    setSegmentoAtivo(seg);
    const codigos = await listModuloCodigosDoSegmento(seg.codigo);
    setModulosSelecionados(codigos);
  };

  const toggleModulo = (codigo: string) => {
    setModulosSelecionados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Painel Master</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Segmentos & Módulos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure quais módulos cada segmento de clínica mostra no menu. Cada ramo tem seu painel específico.
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)} className="gradient-primary shadow-glow font-semibold">
          <Plus className="mr-1.5 h-4 w-4" /> Novo Segmento
        </Button>
      </header>

      <section className="mt-8">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(segmentos ?? []).map((seg) => (
              <Card key={seg.codigo} className="border-border/60 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">{seg.nome}</h3>
                      <p className="font-mono text-[11px] text-muted-foreground">{seg.codigo}</p>
                    </div>
                  </div>
                </div>
                {seg.descricao && <p className="mt-3 text-sm text-muted-foreground">{seg.descricao}</p>}
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => abrirModulos(seg)}>
                  Configurar módulos
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Novo segmento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo segmento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Código</Label>
              <Input value={novoCodigo} onChange={(e) => setNovoCodigo(e.target.value)} placeholder="estetica" className="mt-1.5 h-11 font-mono" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Estética Avançada" className="mt-1.5 h-11" />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !novoCodigo || !novoNome} className="gradient-primary w-full font-semibold">
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configurar módulos */}
      <Dialog open={!!segmentoAtivo} onOpenChange={(v) => { if (!v) setSegmentoAtivo(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Módulos do segmento "{segmentoAtivo?.nome}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(modulos ?? [])
              .filter((m) => !m.caminho?.startsWith("/master"))
              .map((m) => (
                <div key={m.codigo} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{m.caminho}</p>
                  </div>
                  <Switch
                    checked={modulosSelecionados.includes(m.codigo)}
                    onCheckedChange={() => toggleModulo(m.codigo)}
                  />
                </div>
              ))}
            <Button
              onClick={() => segmentoAtivo && salvarModulos(segmentoAtivo)}
              className="gradient-primary w-full font-semibold"
            >
              Salvar configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
