import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus, Loader2, Trash2, CalendarDays } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/master/anuncios")({
  head: () => ({
    meta: [{ title: "Anúncios — MedeirosInfra Master" }],
  }),
  component: AnunciosMaster,
});

// Estado local (mock) — integração real com redes sociais virá depois
interface Anuncio {
  id: string;
  titulo: string;
  texto: string;
  plataforma: "instagram" | "facebook" | "whatsapp";
  agendamento: string;
  status: "rascunho" | "agendado" | "publicado";
}

function AnunciosMaster() {
  const [open, setOpen] = useState(false);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([
    {
      id: "1",
      titulo: "Promoção Harmonização Facial",
      texto: "Harmonização facial com 20% de desconto neste mês!",
      plataforma: "instagram",
      agendamento: new Date().toISOString().slice(0, 10),
      status: "rascunho",
    },
  ]);
  const [form, setForm] = useState({ titulo: "", texto: "", plataforma: "instagram", agendamento: "" });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setAnuncios((prev) => [
      { ...form, id: String(Date.now()), status: "rascunho" },
      ...prev,
    ]);
    setOpen(false);
    setForm({ titulo: "", texto: "", plataforma: "instagram", agendamento: "" });
    toast.success("Anúncio criado!");
  };

  const plataformaLabel: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Ferramentas do Master</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Anúncios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Crie e agende anúncios para redes sociais das clínicas.
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)} className="gradient-primary shadow-glow font-semibold">
          <Plus className="mr-1.5 h-4 w-4" /> Novo Anúncio
        </Button>
      </header>

      <section className="mt-8">
        {anuncios.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Nenhum anúncio"
            description="Crie o primeiro anúncio para redes sociais."
            action={<Button onClick={() => setOpen(true)}>Criar anúncio</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {anuncios.map((a) => (
              <Card key={a.id} className="border-border/60 p-5">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {plataformaLabel[a.plataforma]}
                  </span>
                  <button
                    onClick={() => setAnuncios((prev) => prev.filter((x) => x.id !== a.id))}
                    aria-label="Excluir"
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-foreground">{a.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.texto}</p>
                <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  {a.agendamento || "Sem agendamento"}
                  <span className="ml-auto rounded-full border border-border/40 px-2 py-0.5 font-semibold">
                    {a.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo anúncio</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Promoção de botox" className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Texto</Label>
              <Textarea value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} className="mt-1.5 text-sm" placeholder="Descrição do anúncio..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plataforma</Label>
                <Select value={form.plataforma} onValueChange={(v) => setForm((f) => ({ ...f, plataforma: v }))}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agendamento</Label>
                <Input type="date" value={form.agendamento} onChange={(e) => setForm((f) => ({ ...f, agendamento: e.target.value }))} className="mt-1.5 h-11" />
              </div>
            </div>
            <Button type="submit" className="gradient-primary w-full font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Criar anúncio
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
