import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/white-label")({
  head: () => ({ meta: [{ title: "White-Label — MedeirosInfra" }] }),
  component: () => (
    <ComingSoon
      eyebrow="Configuração"
      title="Envelopamento White-Label"
      description="Logo, cores, domínio próprio e API Key por tenant para revenda em escala."
      icon={Palette}
    />
  ),
});
