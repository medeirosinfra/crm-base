import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Users, Wallet, CalendarDays, Loader2, Phone, Mail, Scissors } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPaciente,
  listAgendamentosDoPaciente,
  listTransacoesDoPaciente,
} from "@/lib/supabase/pacientes";
import { formatData, formatTelefone, formatBRL, formatHora } from "@/lib/formatters";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pacientes/$id")({
  head: () => ({ meta: [{ title: "Detalhe do Paciente — MedeirosInfra" }] }),
  component: () => (
    <RequireAuth>
      <PacienteDetalhePage />
    </RequireAuth>
  ),
});

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function PacienteDetalhePage() {
  const { id } = Route.useParams();

  const { data: paciente, isLoading } = useQuery({
    queryKey: ["pacientes", id],
    queryFn: () => getPaciente(id),
  });
  const { data: agendamentos } = useQuery({
    queryKey: ["pacientes", id, "agendamentos"],
    queryFn: () => listAgendamentosDoPaciente(id),
  });
  const { data: transacoes } = useQuery({
    queryKey: ["pacientes", id, "transacoes"],
    queryFn: () => listTransacoesDoPaciente(id),
  });

  const totalGasto = (transacoes ?? [])
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((s, t) => s + Number(t.valor), 0);
  const procedimentosFeitos = (agendamentos ?? []).filter((a) => a.status === "concluido").length;

  if (isLoading) {
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!paciente) {
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
          Paciente não encontrado.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <Link to="/pacientes" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para pacientes
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
            {paciente.nome.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{paciente.nome}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> {formatTelefone(paciente.telefone)}
              </span>
              {paciente.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> {paciente.email}
                </span>
              )}
              {paciente.origem && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Origem: {paciente.origem}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini resumo */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card className="border-border/60 p-4 text-center">
            <Users className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-2xl font-bold text-foreground">{(agendamentos ?? []).length}</p>
            <p className="text-[11px] text-muted-foreground">Agendamentos</p>
          </Card>
          <Card className="border-border/60 p-4 text-center">
            <Scissors className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-2xl font-bold text-foreground">{procedimentosFeitos}</p>
            <p className="text-[11px] text-muted-foreground">Procedimentos concluídos</p>
          </Card>
          <Card className="border-border/60 p-4 text-center">
            <Wallet className="mx-auto h-5 w-5 text-success" />
            <p className="mt-1 text-2xl font-bold text-success">{formatBRL(totalGasto)}</p>
            <p className="text-[11px] text-muted-foreground">Total investido</p>
          </Card>
        </div>

        <Tabs defaultValue="visao" className="mt-8">
          <TabsList>
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="historico">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              <Wallet className="mr-1.5 h-3.5 w-3.5" /> Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao">
            <Card className="border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Dados cadastrais</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Nascimento</p>
                  <p className="mt-0.5 text-sm text-foreground">{formatData(paciente.nascimento)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">CPF</p>
                  <p className="mt-0.5 text-sm text-foreground">{paciente.cpf ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Gênero</p>
                  <p className="mt-0.5 text-sm text-foreground">{paciente.genero ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Última consulta</p>
                  <p className="mt-0.5 text-sm text-foreground">{formatData(paciente.ultima_consulta)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Endereço</p>
                  <p className="mt-0.5 text-sm text-foreground">{paciente.endereco ?? "—"}</p>
                </div>
                {paciente.observacoes && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Observações</p>
                    <p className="mt-0.5 text-sm text-foreground">{paciente.observacoes}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card className="border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Histórico de agendamentos</h2>
              {(agendamentos ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Procedimento</th>
                        <th className="hidden px-4 py-3 md:table-cell">Profissional</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(agendamentos ?? []).map((a) => (
                        <tr key={a.id} className="bg-card hover:bg-muted/30">
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatData(a.data)} · {formatHora(a.data)}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {a.procedimento?.nome ?? a.tipo ?? "Consulta"}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            {a.profissional?.nome ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {a.valor != null ? formatBRL(Number(a.valor)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {statusLabels[a.status] ?? a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <Card className="border-border/60 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Transações financeiras</h2>
              {(transacoes ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhuma transação vinculada. (As transações de agendamentos futuros aparecerão aqui.)
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(transacoes ?? []).map((t) => (
                        <tr key={t.id} className="bg-card hover:bg-muted/30">
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatData(t.data)}</td>
                          <td className="px-4 py-3 text-foreground">{t.descricao}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${t.tipo === "receita" ? "text-success" : "text-destructive"}`}>
                            {t.tipo === "receita" ? "+" : "−"}{formatBRL(Math.abs(Number(t.valor)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
