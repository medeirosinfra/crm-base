import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro & Estoque — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="ERP"
      title="Financeiro & Estoque"
      description="Fluxo de caixa, contas a pagar/receber, DRE e controle de estoque com alertas."
      icon={Wallet}
    />
  ),
});
