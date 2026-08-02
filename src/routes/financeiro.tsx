import { createFileRoute } from "@tanstack/react-router";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
  Plus,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listTransacoes, listProdutos, createTransacao, createProduto } from "@/lib/supabase/financeiro";
import { toast } from "sonner";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [{ title: "Financeiro & Estoque — MedeirosInfra" }],
  }),
  component: () => (
    <RequireAuth>
      <FinanceiroPage />
    </RequireAuth>
  ),
});

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function FinanceiroPage() {
  const queryClient = useQueryClient();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
  const [openTransacao, setOpenTransacao] = useState(false);
  const [openProduto, setOpenProduto] = useState(false);
  const [pNome, setPNome] = useState("");
  const [pPreco, setPPreco] = useState("");
  const [pQuantidade, setPQuantidade] = useState("");

  const { data: transacoes, isLoading: loadingTx } = useQuery({
    queryKey: ["transacoes"],
    queryFn: listTransacoes,
  });
  const { data: produtos, isLoading: loadingProd } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const totalReceitas = (transacoes ?? [])
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = (transacoes ?? [])
    .filter((t) => t.tipo === "despesa" && t.status === "pago")
    .reduce((s, t) => s + Math.abs(Number(t.valor)), 0);
  const saldo = totalReceitas - totalDespesas;
  const valorEstoque = (produtos ?? []).reduce((s, p) => s + Number(p.preco) * p.quantidade, 0);

  const txMutation = useMutation({
    mutationFn: () =>
      createTransacao({
        descricao,
        valor: parseFloat(valor),
        tipo,
        data: new Date().toISOString().slice(0, 10),
        status: "pago",
        categoria_id: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      toast.success("Transação registrada!");
      setDescricao("");
      setValor("");
      setOpenTransacao(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const prodMutation = useMutation({
    mutationFn: () =>
      createProduto({
        nome: pNome,
        preco: parseFloat(pPreco) || 0,
        quantidade: parseInt(pQuantidade) || 0,
        custo: null,
        descricao: null,
        unidade: "un",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto adicionado!");
      setPNome("");
      setPPreco("");
      setPQuantidade("");
      setOpenProduto(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">ERP</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Financeiro & Estoque
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Fluxo de caixa, contas a pagar/receber e controle de estoque.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={openTransacao} onOpenChange={setOpenTransacao}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Plus className="mr-1.5 h-4 w-4" /> Lançar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={tipo} onValueChange={(v) => setTipo(v as "receita" | "despesa")}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição (ex: Consulta)"
                    className="h-11"
                  />
                  <Input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Valor (R$)"
                    className="h-11"
                  />
                  <Button
                    onClick={() => txMutation.mutate()}
                    disabled={txMutation.isPending || !descricao.trim() || !valor}
                    className="gradient-primary w-full font-semibold"
                  >
                    {txMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Registrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={openProduto} onOpenChange={setOpenProduto}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary shadow-glow font-semibold">
                  <Package className="mr-1.5 h-4 w-4" /> Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input value={pNome} onChange={(e) => setPNome(e.target.value)} placeholder="Nome" className="h-11" />
                  <Input type="number" value={pPreco} onChange={(e) => setPPreco(e.target.value)} placeholder="Preço (R$)" className="h-11" />
                  <Input type="number" value={pQuantidade} onChange={(e) => setPQuantidade(e.target.value)} placeholder="Quantidade" className="h-11" />
                  <Button
                    onClick={() => prodMutation.mutate()}
                    disabled={prodMutation.isPending || !pNome.trim()}
                    className="gradient-primary w-full font-semibold"
                  >
                    {prodMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowUpCircle className="h-4 w-4 text-success" /> Receitas
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-success">{brl(totalReceitas)}</p>
          </Card>
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowDownCircle className="h-4 w-4 text-destructive" /> Despesas
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-destructive">{brl(totalDespesas)}</p>
          </Card>
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" /> Saldo
            </div>
            <p className={`mt-2 font-display text-2xl font-bold ${saldo >= 0 ? "text-foreground" : "text-destructive"}`}>
              {brl(saldo)}
            </p>
          </Card>
          <Card className="border-border/60 p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-4 w-4 text-primary" /> Estoque
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{brl(valorEstoque)}</p>
          </Card>
        </div>

        {/* Transações */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Fluxo de caixa</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loadingTx && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                )}
                {(transacoes ?? []).length === 0 && !loadingTx && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">Nenhuma transação.</td></tr>
                )}
                {(transacoes ?? []).map((t) => (
                  <tr key={t.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.descricao}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.tipo === "receita" ? "text-success" : "text-destructive"}`}>
                      {t.tipo === "receita" ? "+" : "−"}{brl(Math.abs(Number(t.valor)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Estoque */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Estoque</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loadingProd && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                )}
                {(produtos ?? []).length === 0 && !loadingProd && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nenhum produto.</td></tr>
                )}
                {(produtos ?? []).map((p) => (
                  <tr key={p.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nome}</td>
                    <td className="px-4 py-3 text-right">{brl(Number(p.preco))}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.quantidade}</td>
                    <td className="px-4 py-3 text-right font-semibold">{brl(Number(p.preco) * p.quantidade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
