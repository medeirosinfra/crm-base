import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/pdv")({
  head: () => ({ meta: [{ title: "PDV & Vendas — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Ponto de Venda"
      title="PDV & Vendas"
      description="Frente de caixa ágil, orçamentos, vendas e ordens de serviço no padrão Vendus."
      icon={ShoppingCart}
    />
  ),
});
