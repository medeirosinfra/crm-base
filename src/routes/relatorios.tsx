import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Analytics"
      title="Relatórios & BI"
      description="DRE, faturamento, margem, funil de vendas e desempenho de campanhas WAHA."
      icon={BarChart3}
    />
  ),
});
